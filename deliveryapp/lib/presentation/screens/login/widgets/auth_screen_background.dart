import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Soft white + green wave background for login/register screens.
class AuthScreenBackground extends StatelessWidget {
  const AuthScreenBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xFFF8FCF9),
                Colors.white,
                Color(0xFFF4FAF5),
              ],
            ),
          ),
        ),
        CustomPaint(painter: _AuthDecorPainter()),
        child,
      ],
    );
  }
}

class _AuthDecorPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final topWave = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.06)
      ..style = PaintingStyle.fill;
    final topPath = Path()
      ..moveTo(0, 0)
      ..quadraticBezierTo(size.width * 0.25, size.height * 0.08, size.width * 0.5, 0)
      ..quadraticBezierTo(size.width * 0.78, -size.height * 0.04, size.width, 0)
      ..lineTo(size.width, size.height * 0.14)
      ..quadraticBezierTo(size.width * 0.55, size.height * 0.2, 0, size.height * 0.12)
      ..close();
    canvas.drawPath(topPath, topWave);

    final bottomWave = Paint()
      ..color = AppColors.primary.withValues(alpha: 0.05)
      ..style = PaintingStyle.fill;
    final bottomPath = Path()
      ..moveTo(0, size.height * 0.88)
      ..quadraticBezierTo(size.width * 0.35, size.height * 0.82, size.width * 0.55, size.height * 0.9)
      ..quadraticBezierTo(size.width * 0.82, size.height * 0.98, size.width, size.height * 0.9)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(bottomPath, bottomWave);

    void leaf(Offset c, double angle, double scale) {
      final paint = Paint()
        ..color = AppColors.primary.withValues(alpha: 0.14)
        ..style = PaintingStyle.fill;
      canvas.save();
      canvas.translate(c.dx, c.dy);
      canvas.rotate(angle);
      final path = Path()
        ..moveTo(0, -8 * scale)
        ..quadraticBezierTo(6 * scale, -2 * scale, 0, 8 * scale)
        ..quadraticBezierTo(-6 * scale, -2 * scale, 0, -8 * scale)
        ..close();
      canvas.drawPath(path, paint);
      canvas.restore();
    }

    leaf(Offset(size.width * 0.08, size.height * 0.18), -0.4, 1.0);
    leaf(Offset(size.width * 0.92, size.height * 0.22), 0.5, 0.9);
    leaf(Offset(size.width * 0.12, size.height * 0.72), 0.7, 0.8);
    leaf(Offset(size.width * 0.88, size.height * 0.78), -0.6, 0.85);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
