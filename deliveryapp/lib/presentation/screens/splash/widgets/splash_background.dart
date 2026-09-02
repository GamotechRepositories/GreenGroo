import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Soft full-screen backdrop: glow, skyline, clouds, leaves.
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
    final center = Offset(size.width * 0.5, size.height * 0.2);
    final glow = Paint()
      ..shader = RadialGradient(
        colors: [
          Colors.white.withValues(alpha: isDark ? 0.12 : 0.92),
          Colors.white.withValues(alpha: isDark ? 0.04 : 0.35),
          Colors.transparent,
        ],
        stops: const [0.0, 0.55, 1.0],
      ).createShader(Rect.fromCircle(center: center, radius: size.width * 0.48));
    canvas.drawCircle(center, size.width * 0.48, glow);
  }

  void _paintSkyline(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF0C831F).withValues(alpha: isDark ? 0.16 : 0.08)
      ..style = PaintingStyle.fill;

    final baseY = size.height * 0.54;
    final path = Path()..moveTo(0, baseY);

    final buildings = <(double, double)>[
      (0.0, 32),
      (0.06, 52),
      (0.12, 28),
      (0.18, 68),
      (0.25, 40),
      (0.32, 58),
      (0.38, 30),
      (0.45, 72),
      (0.52, 38),
      (0.58, 55),
      (0.65, 28),
      (0.72, 62),
      (0.80, 36),
      (0.88, 50),
      (0.94, 34),
    ];

    for (final (xFactor, height) in buildings) {
      final x = size.width * xFactor;
      path
        ..lineTo(x, baseY)
        ..lineTo(x, baseY - height)
        ..lineTo(x + size.width * 0.05, baseY - height)
        ..lineTo(x + size.width * 0.05, baseY);
    }
    path
      ..lineTo(size.width, baseY)
      ..lineTo(size.width, baseY + 6)
      ..lineTo(0, baseY + 6)
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

    cloud(Offset(size.width * 0.16, size.height * 0.14), 1.0);
    cloud(Offset(size.width * 0.78, size.height * 0.12), 0.9);
    cloud(Offset(size.width * 0.48, size.height * 0.22), 0.65);
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

    leaf(Offset(size.width * 0.1, size.height * 0.1), -0.5, 1.0);
    leaf(Offset(size.width * 0.9, size.height * 0.11), 0.6, 0.95);
    leaf(Offset(size.width * 0.14, size.height * 0.28), 0.4, 0.75);
    leaf(Offset(size.width * 0.86, size.height * 0.26), -0.4, 0.7);
  }

  @override
  bool shouldRepaint(covariant _SplashDecorPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
