import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Soft premium backdrop: gradient, curves, clouds, leaves, route, skyline.
class SplashBackground extends StatelessWidget {
  const SplashBackground({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = ThemeController.instance.isDark;
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: isDark
                  ? [
                      AppColors.surface,
                      AppColors.background,
                      AppColors.primaryLight,
                    ]
                  : const [
                      Color(0xFFE6F4E9),
                      Color(0xFFFFFFFF),
                      Color(0xFFC8E6CC),
                    ],
              stops: const [0.0, 0.5, 1.0],
            ),
          ),
        ),
        CustomPaint(painter: _SplashDecorPainter(isDark: isDark)),
      ],
    );
  }
}

class _SplashDecorPainter extends CustomPainter {
  _SplashDecorPainter({required this.isDark});

  final bool isDark;

  @override
  void paint(Canvas canvas, Size size) {
    _paintCurves(canvas, size);
    _paintSkyline(canvas, size);
    _paintRoute(canvas, size);
    _paintClouds(canvas, size);
    _paintLeaves(canvas, size);
    _paintPins(canvas, size);
  }

  void _paintCurves(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.14 : 0.08)
      ..style = PaintingStyle.fill;

    final topLeft = Path()
      ..moveTo(0, 0)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.08, size.width * 0.55, 0)
      ..lineTo(0, 0)
      ..close();
    canvas.drawPath(topLeft, paint);

    final bottomRight = Path()
      ..moveTo(size.width, size.height * 0.55)
      ..quadraticBezierTo(
        size.width * 0.7,
        size.height * 0.72,
        size.width,
        size.height * 0.85,
      )
      ..lineTo(size.width, size.height * 0.55)
      ..close();
    canvas.drawPath(
      bottomRight,
      Paint()..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.12 : 0.06),
    );

    canvas.drawCircle(
      Offset(size.width * 0.85, size.height * 0.18),
      size.width * 0.22,
      Paint()..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.08 : 0.04),
    );
  }

  void _paintSkyline(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.12 : 0.06)
      ..style = PaintingStyle.fill;

    final baseY = size.height * 0.62;
    final path = Path()..moveTo(0, baseY);

    final buildings = <(double, double)>[
      (0.02, 28),
      (0.08, 42),
      (0.14, 22),
      (0.20, 55),
      (0.28, 34),
      (0.35, 48),
      (0.42, 26),
      (0.50, 60),
      (0.58, 32),
      (0.66, 44),
      (0.74, 24),
      (0.82, 50),
      (0.90, 30),
      (0.96, 40),
    ];

    for (final (xFactor, height) in buildings) {
      final x = size.width * xFactor;
      path
        ..lineTo(x, baseY)
        ..lineTo(x, baseY - height)
        ..lineTo(x + size.width * 0.045, baseY - height)
        ..lineTo(x + size.width * 0.045, baseY);
    }
    path
      ..lineTo(size.width, baseY)
      ..lineTo(size.width, baseY + 4)
      ..lineTo(0, baseY + 4)
      ..close();

    canvas.drawPath(path, paint);
  }

  void _paintRoute(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.4 : 0.25)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(size.width * 0.12, size.height * 0.28)
      ..quadraticBezierTo(
        size.width * 0.35,
        size.height * 0.18,
        size.width * 0.55,
        size.height * 0.30,
      )
      ..quadraticBezierTo(
        size.width * 0.75,
        size.height * 0.42,
        size.width * 0.88,
        size.height * 0.34,
      );

    _drawDashedPath(canvas, path, paint, dashWidth: 6, dashSpace: 8);
  }

  void _drawDashedPath(
    Canvas canvas,
    Path path,
    Paint paint, {
    required double dashWidth,
    required double dashSpace,
  }) {
    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = math.min(distance + dashWidth, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), paint);
        distance = next + dashSpace;
      }
    }
  }

  void _paintClouds(Canvas canvas, Size size) {
    void cloud(Offset center, double scale) {
      final paint = Paint()
        ..color = (isDark ? const Color(0xFF2A342C) : Colors.white)
            .withValues(alpha: isDark ? 0.55 : 0.75)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
      canvas.drawCircle(center, 14 * scale, paint);
      canvas.drawCircle(center + Offset(-12 * scale, 2 * scale), 11 * scale, paint);
      canvas.drawCircle(center + Offset(12 * scale, 3 * scale), 12 * scale, paint);
      canvas.drawCircle(center + Offset(0, 6 * scale), 13 * scale, paint);
    }

    cloud(Offset(size.width * 0.18, size.height * 0.14), 1.0);
    cloud(Offset(size.width * 0.72, size.height * 0.11), 0.85);
    cloud(Offset(size.width * 0.48, size.height * 0.22), 0.65);
  }

  void _paintLeaves(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.28 : 0.18)
      ..style = PaintingStyle.fill;

    void leaf(Offset c, double angle, double scale) {
      canvas.save();
      canvas.translate(c.dx, c.dy);
      canvas.rotate(angle);
      final path = Path()
        ..moveTo(0, -10 * scale)
        ..quadraticBezierTo(8 * scale, -2 * scale, 0, 10 * scale)
        ..quadraticBezierTo(-8 * scale, -2 * scale, 0, -10 * scale)
        ..close();
      canvas.drawPath(path, paint);
      canvas.restore();
    }

    leaf(Offset(size.width * 0.08, size.height * 0.08), -0.5, 1.1);
    leaf(Offset(size.width * 0.14, size.height * 0.12), 0.4, 0.8);
    leaf(Offset(size.width * 0.92, size.height * 0.09), 0.6, 1.0);
    leaf(Offset(size.width * 0.86, size.height * 0.14), -0.3, 0.75);
    leaf(Offset(size.width * 0.06, size.height * 0.88), 0.8, 0.9);
    leaf(Offset(size.width * 0.94, size.height * 0.86), -0.7, 0.85);
  }

  void _paintPins(Canvas canvas, Size size) {
    void pin(Offset tip, double scale) {
      final paint = Paint()
        ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.45 : 0.28)
        ..style = PaintingStyle.fill;
      final path = Path()
        ..moveTo(tip.dx, tip.dy)
        ..quadraticBezierTo(
          tip.dx - 10 * scale,
          tip.dy - 22 * scale,
          tip.dx,
          tip.dy - 28 * scale,
        )
        ..quadraticBezierTo(
          tip.dx + 10 * scale,
          tip.dy - 22 * scale,
          tip.dx,
          tip.dy,
        )
        ..close();
      canvas.drawPath(path, paint);
      canvas.drawCircle(
        Offset(tip.dx, tip.dy - 20 * scale),
        3.5 * scale,
        Paint()
          ..color = (isDark ? const Color(0xFF0F1410) : Colors.white)
              .withValues(alpha: 0.7),
      );
    }

    pin(Offset(size.width * 0.55, size.height * 0.30), 1.0);
    pin(Offset(size.width * 0.88, size.height * 0.34), 0.85);
    pin(Offset(size.width * 0.22, size.height * 0.27), 0.7);
  }

  @override
  bool shouldRepaint(covariant _SplashDecorPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
