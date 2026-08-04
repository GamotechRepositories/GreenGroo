import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../config/theme.dart';

/// Network image with memory/disk cache sizing — avoids decoding full-res on thumbnails.
class AppNetworkImage extends StatelessWidget {
  const AppNetworkImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.alignment = Alignment.center,
    this.cacheWidth,
    this.cacheHeight,
    this.placeholder,
    this.errorIcon = Icons.image_not_supported_outlined,
    this.errorIconSize = 28,
  });

  final String imageUrl;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Alignment alignment;
  /// Logical px — converted to memCacheWidth using device pixel ratio.
  final int? cacheWidth;
  /// Logical px — converted to memCacheHeight using device pixel ratio.
  final int? cacheHeight;
  final Widget? placeholder;
  final IconData errorIcon;
  final double errorIconSize;

  int? _memDim(BuildContext context, double? logical, int? cacheLogical) {
    final value = cacheLogical?.toDouble() ?? logical;
    if (value == null || !value.isFinite || value <= 0) return null;
    return (value * MediaQuery.devicePixelRatioOf(context)).round();
  }

  @override
  Widget build(BuildContext context) {
    if (imageUrl.trim().isEmpty) {
      return _errorBox();
    }

    final memW = _memDim(context, width, cacheWidth);
    final memH = _memDim(context, height, cacheHeight);

    return CachedNetworkImage(
      imageUrl: imageUrl.trim(),
      fit: fit,
      alignment: alignment,
      width: width,
      height: height,
      memCacheWidth: memW,
      memCacheHeight: memH,
      maxWidthDiskCache: memW != null ? memW.clamp(200, 1200) : 800,
      maxHeightDiskCache: memH?.clamp(200, 1200),
      filterQuality: FilterQuality.medium,
      fadeInDuration: const Duration(milliseconds: 150),
      fadeOutDuration: const Duration(milliseconds: 100),
      placeholder: (_, _) => placeholder ?? _loadingBox(),
      errorWidget: (_, _, _) => _errorBox(),
    );
  }

  Widget _loadingBox() {
    return ColoredBox(
      // White like the website's .product-image background — no gray flash.
      color: Colors.white,
      child: Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: AppColors.primary.withValues(alpha: 0.7),
          ),
        ),
      ),
    );
  }

  Widget _errorBox() {
    return ColoredBox(
      color: Colors.white,
      child: Center(
        child: Icon(errorIcon, size: errorIconSize, color: AppColors.textMuted),
      ),
    );
  }
}
