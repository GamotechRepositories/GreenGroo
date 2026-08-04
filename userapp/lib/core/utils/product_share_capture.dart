import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';

import '../../config/env.dart';
import 'product_share_card.dart';
import '../../widgets/product/product_share_card_widget.dart';

String proxyImageUrl(String imageUrl) {
  final encoded = Uri.encodeComponent(imageUrl.trim());
  return '${Env.apiUrl}/api/proxy/image?url=$encoded';
}

Future<void> precacheShareImage(BuildContext context, String imageUrl) async {
  if (imageUrl.trim().isEmpty) return;

  for (final source in [imageUrl.trim(), proxyImageUrl(imageUrl)]) {
    try {
      await precacheImage(NetworkImage(source), context);
      return;
    } catch (_) {
      // Try proxy or next source.
    }
  }
}

Future<void> _waitForPaint(int frames) async {
  for (var i = 0; i < frames; i++) {
    await WidgetsBinding.instance.endOfFrame;
  }
}

Future<Uint8List?> _capturePng(GlobalKey key, {double pixelRatio = 3}) async {
  final boundary =
      key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
  if (boundary == null) return null;

  final image = await boundary.toImage(pixelRatio: pixelRatio);
  final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
  image.dispose();
  return byteData?.buffer.asUint8List();
}

/// Renders [ProductShareCardWidget] off-screen and exports a high-res PNG.
Future<File?> captureProductShareCardFile({
  required BuildContext context,
  required String productId,
  required String imageUrl,
  required String productName,
  required String priceLabel,
  required String brandName,
  required String shareUrl,
}) async {
  final boundaryKey = GlobalKey();
  final overlay = Overlay.of(context, rootOverlay: true);

  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (_) => Positioned(
      left: -6000,
      top: -6000,
      child: Material(
        type: MaterialType.transparency,
        child: RepaintBoundary(
          key: boundaryKey,
          child: ProductShareCardWidget(
            imageUrl: imageUrl,
            productName: productName,
            priceLabel: priceLabel,
            brandName: brandName,
            shareUrl: shareUrl,
          ),
        ),
      ),
    ),
  );

  overlay.insert(entry);
  await precacheShareImage(context, imageUrl);
  await _waitForPaint(4);

  var bytes = await _capturePng(boundaryKey);
  entry.remove();

  bytes ??= await createProductShareCardPng(
    imageUrl: imageUrl,
    productName: productName,
    priceLabel: priceLabel,
    brandName: brandName,
    pixelRatio: 3,
  );

  if (bytes == null) return null;

  final dir = await getTemporaryDirectory();
  final safeId = productId.replaceAll(RegExp(r'[^\w-]'), '');
  final file = File('${dir.path}/product-share-$safeId.png');
  await file.writeAsBytes(bytes, flush: true);
  return file;
}
