import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Soft full-screen backdrop: glow, skyline, clouds, leaves (full height).
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
                      Color(0xFFF0FAF2),
                      Color(0xFFF8FCF9),
                      Color(0xFFE8F3EA),
                    ],
              stops: const [0.0, 0.45, 1.0],
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
    _paintLogoGlow(canvas, size);
    _paintSkyline(canvas, size);
    _paintClouds(canvas, size);
    _paintLeaves(canvas, size);
  }

  void _paintLogoGlow(Canvas canvas, Size size) {
    final center = Offset(size.width * 0.5, size.height * 0.28);
    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.white.withValues(alpha: isDark ? 0.12 : 0.92),
          Colors.white.withValues(alpha: isDark ? 0.04 : 0.35),
          Colors.transparent,
        ],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(
        Rect.fromCircle(center: center, radius: size.height * 0.42),
      );
    canvas.drawCircle(center, size.height * 0.42, glow);
  }

  void _paintSkyline(Canvas canvas, Size size) {
    // Back row — taller, softer buildings across full lower half
    _drawBuildingRow(
      canvas,
      size,
      baseY: size.height * 0.92,
      alpha: isDark ? 0.10 : 0.05,
      heights: const [
        0.22, 0.34, 0.18, 0.42, 0.26, 0.38, 0.20, 0.46, 0.24, 0.36,
        0.19, 0.40, 0.23, 0.33, 0.21,
      ],
    );
    // Front row — clearer skyline near the scooter path
    _drawBuildingRow(
      canvas,
      size,
      baseY: size.height * 0.72,
      alpha: isDark ? 0.18 : 0.10,
      heights: const [
        0.14, 0.22, 0.12, 0.28, 0.16, 0.24, 0.13, 0.30, 0.15, 0.23,
        0.12, 0.26, 0.14, 0.21, 0.13,
      ],
    );
  }

  void _drawBuildingRow(
    Canvas canvas,
    Size size, {
    required double baseY,
    required double alpha,
    required List<double> heights,
  }) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: alpha)
      ..style = PaintingStyle.fill;

    final path = Path()..moveTo(0, baseY);
    final step = 1.0 / heights.length;

    for (var i = 0; i < heights.length; i++) {
      final x = size.width * (i * step);
      final h = size.height * heights[i];
      final w = size.width * step * 0.85;
      path
        ..lineTo(x, baseY)
        ..lineTo(x, baseY - h)
        ..lineTo(x + w, baseY - h)
        ..lineTo(x + w, baseY);
    }
    path
      ..lineTo(size.width, baseY)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(path, paint);
  }

  void _paintClouds(Canvas canvas, Size size) {
    void cloud(Offset center, double scale) {
      final paint = Paint()
        ..color = (isDark ? const Color(0xFF2A342C) : Colors.white)
            .withValues(alpha: isDark ? 0.45 : 0.85)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2);
      canvas.drawCircle(center, 14 * scale, paint);
      canvas.drawCircle(center + Offset(-12 * scale, 2 * scale), 10 * scale, paint);
      canvas.drawCircle(center + Offset(12 * scale, 3 * scale), 11 * scale, paint);
      canvas.drawCircle(center + Offset(0, 6 * scale), 12 * scale, paint);
    }

    // Spread clouds across full screen height
    cloud(Offset(size.width * 0.14, size.height * 0.10), 1.15);
    cloud(Offset(size.width * 0.78, size.height * 0.08), 1.0);
    cloud(Offset(size.width * 0.48, size.height * 0.18), 0.75);
    cloud(Offset(size.width * 0.22, size.height * 0.36), 0.9);
    cloud(Offset(size.width * 0.86, size.height * 0.40), 0.85);
    cloud(Offset(size.width * 0.55, size.height * 0.48), 0.7);
    cloud(Offset(size.width * 0.12, size.height * 0.62), 0.8);
    cloud(Offset(size.width * 0.80, size.height * 0.68), 0.75);
    cloud(Offset(size.width * 0.40, size.height * 0.82), 0.9);
    cloud(Offset(size.width * 0.68, size.height * 0.90), 0.7);
  }

  void _paintLeaves(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.3 : 0.22)
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

    // Leaves across full height
    leaf(Offset(size.width * 0.08, size.height * 0.08), -0.5, 1.1);
    leaf(Offset(size.width * 0.92, size.height * 0.10), 0.6, 1.0);
    leaf(Offset(size.width * 0.12, size.height * 0.24), 0.4, 0.85);
    leaf(Offset(size.width * 0.88, size.height * 0.28), -0.4, 0.8);
    leaf(Offset(size.width * 0.06, size.height * 0.42), -0.3, 0.95);
    leaf(Offset(size.width * 0.94, size.height * 0.46), 0.5, 0.9);
    leaf(Offset(size.width * 0.10, size.height * 0.58), 0.55, 0.75);
    leaf(Offset(size.width * 0.90, size.height * 0.62), -0.45, 0.8);
    leaf(Offset(size.width * 0.14, size.height * 0.76), -0.2, 0.9);
    leaf(Offset(size.width * 0.86, size.height * 0.80), 0.35, 0.85);
    leaf(Offset(size.width * 0.20, size.height * 0.92), 0.6, 0.7);
    leaf(Offset(size.width * 0.78, size.height * 0.94), -0.55, 0.75);
  }

  @override
  bool shouldRepaint(covariant _SplashDecorPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
