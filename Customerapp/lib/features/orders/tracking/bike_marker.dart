import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Top-down delivery bike pointing north, so `Marker.rotation = heading`
/// turns it the way the rider is riding.
class BikeMarker {
  BikeMarker._();

  static const double logicalSize = 52;
  static final Map<double, BitmapDescriptor> _cache = {};

  static Future<BitmapDescriptor> descriptor(double devicePixelRatio) async {
    final cached = _cache[devicePixelRatio];
    if (cached != null) return cached;

    final px = (logicalSize * devicePixelRatio).roundToDouble();
    final recorder = ui.PictureRecorder();
    final canvas = Canvas(recorder);
    canvas.scale(px / 100);
    paintBike(canvas);
    final image = await recorder.endRecording().toImage(px.toInt(), px.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();

    final descriptor = BitmapDescriptor.bytes(
      bytes!.buffer.asUint8List(),
      imagePixelRatio: devicePixelRatio,
      width: logicalSize,
      height: logicalSize,
    );
    _cache[devicePixelRatio] = descriptor;
    return descriptor;
  }

  /// Drawn on a 100×100 canvas.
  static void paintBike(Canvas canvas) {
    const center = Offset(50, 50);
    const green = Color(0xFF2E7D32);
    const darkGreen = Color(0xFF1B5E20);
    const tyre = Color(0xFF263238);
    const helmet = Color(0xFFFFC107);

    canvas.drawCircle(
      center.translate(0, 2),
      40,
      Paint()
        ..color = Colors.black.withValues(alpha: 0.25)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
    );
    canvas.drawCircle(center, 40, Paint()..color = Colors.white);
    canvas.drawCircle(center, 35, Paint()..color = green);

    final heading = Path()
      ..moveTo(50, 4)
      ..lineTo(57, 15)
      ..lineTo(43, 15)
      ..close();
    canvas.drawPath(heading, Paint()..color = Colors.white);

    final tyrePaint = Paint()..color = tyre;
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(46, 20, 8, 15), const Radius.circular(4)),
      tyrePaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(46, 64, 8, 16), const Radius.circular(4)),
      tyrePaint,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(41, 30, 18, 40), const Radius.circular(9)),
      Paint()..color = Colors.white,
    );
    canvas.drawLine(
      const Offset(32, 33),
      const Offset(68, 33),
      Paint()
        ..color = Colors.white
        ..strokeWidth = 5
        ..strokeCap = StrokeCap.round,
    );

    canvas.drawRRect(
      RRect.fromRectAndRadius(const Rect.fromLTWH(38, 54, 24, 16), const Radius.circular(4)),
      Paint()..color = darkGreen,
    );
    canvas.drawCircle(const Offset(50, 45), 8, Paint()..color = helmet);
    canvas.drawCircle(
      const Offset(50, 45),
      8,
      Paint()
        ..color = darkGreen
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );
  }
}

/// Same bike as a widget (for widget-based maps such as flutter_map).
class BikeIcon extends StatelessWidget {
  const BikeIcon({super.key, this.size = BikeMarker.logicalSize});

  final double size;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(size: Size.square(size), painter: const _BikePainter());
  }
}

class _BikePainter extends CustomPainter {
  const _BikePainter();

  @override
  void paint(Canvas canvas, Size size) {
    canvas.scale(size.width / 100);
    BikeMarker.paintBike(canvas);
  }

  @override
  bool shouldRepaint(covariant _BikePainter oldDelegate) => false;
}
