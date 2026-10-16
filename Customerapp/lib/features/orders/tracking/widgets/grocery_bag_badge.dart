import 'package:flutter/material.dart';
import '../../../../config/theme.dart';

/// Crisp, beautifully illustrated GreenGrocc grocery bag with fresh vegetables
/// (carrots, tomatoes, greens) and the "GG" logo, matching the UI mockup.
class GroceryBagBadge extends StatelessWidget {
  const GroceryBagBadge({super.key, this.size = 50});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.headerFadeBg,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Center(
        child: CustomPaint(
          size: Size(size * 0.85, size * 0.85),
          painter: _GroceryBagPainter(),
        ),
      ),
    );
  }
}

class _GroceryBagPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // --- 1. Vegetables poking out of bag top ---
    // Lettuce / Spinach leaves (left and center top)
    final leafPaint = Paint()..color = const Color(0xFF4CAF50);
    final darkLeafPaint = Paint()..color = const Color(0xFF2E7D32);

    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.28, h * 0.25), width: w * 0.26, height: h * 0.32),
      darkLeafPaint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.35, h * 0.22), width: w * 0.22, height: h * 0.28),
      leafPaint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.72, h * 0.26), width: w * 0.26, height: h * 0.3),
      darkLeafPaint,
    );
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.65, h * 0.22), width: w * 0.22, height: h * 0.26),
      leafPaint,
    );

    // Carrot (orange body with green stem)
    final carrotPaint = Paint()..color = const Color(0xFFFF7043);
    final carrotPath = Path()
      ..moveTo(w * 0.45, h * 0.12)
      ..lineTo(w * 0.55, h * 0.14)
      ..lineTo(w * 0.49, h * 0.38)
      ..close();
    canvas.drawPath(carrotPath, carrotPaint);

    // Carrot leafy top
    final stemPaint = Paint()
      ..color = const Color(0xFF388E3C)
      ..strokeWidth = 2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(Offset(w * 0.5, h * 0.13), Offset(w * 0.5, h * 0.05), stemPaint);
    canvas.drawLine(Offset(w * 0.5, h * 0.13), Offset(w * 0.45, h * 0.06), stemPaint);
    canvas.drawLine(Offset(w * 0.5, h * 0.13), Offset(w * 0.55, h * 0.07), stemPaint);

    // Tomato (red sphere with green calyx)
    final tomatoPaint = Paint()..color = const Color(0xFFE53935);
    canvas.drawCircle(Offset(w * 0.40, h * 0.32), w * 0.14, tomatoPaint);
    // Tomato highlight
    canvas.drawCircle(Offset(w * 0.37, h * 0.28), w * 0.035, Paint()..color = Colors.white.withValues(alpha: 0.6));
    // Tomato star stem
    final calyxPaint = Paint()..color = const Color(0xFF2E7D32);
    canvas.drawCircle(Offset(w * 0.40, h * 0.22), w * 0.035, calyxPaint);

    // Yellow bell pepper / lemon (right side)
    final yellowPaint = Paint()..color = const Color(0xFFFFA000);
    canvas.drawOval(
      Rect.fromCenter(center: Offset(w * 0.62, h * 0.33), width: w * 0.22, height: h * 0.20),
      yellowPaint,
    );

    // --- 2. Green Paper Grocery Bag ---
    const bagGreen = AppColors.primary;
    const bagDarkFold = AppColors.primaryDark;

    final bagPath = Path()
      ..moveTo(w * 0.18, h * 0.36)
      ..lineTo(w * 0.82, h * 0.36)
      ..lineTo(w * 0.80, h * 0.94)
      ..quadraticBezierTo(w * 0.80, h * 0.98, w * 0.74, h * 0.98)
      ..lineTo(w * 0.26, h * 0.98)
      ..quadraticBezierTo(w * 0.20, h * 0.98, w * 0.20, h * 0.94)
      ..close();

    // Drop shadow under bag
    canvas.drawPath(
      bagPath.shift(const Offset(0, 2)),
      Paint()
        ..color = Colors.black.withValues(alpha: 0.15)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
    );

    // Main Bag Body
    canvas.drawPath(bagPath, Paint()..color = bagGreen);

    // Top rim fold / cuff of the bag
    final cuffPath = Path()
      ..moveTo(w * 0.17, h * 0.36)
      ..lineTo(w * 0.83, h * 0.36)
      ..lineTo(w * 0.82, h * 0.43)
      ..lineTo(w * 0.18, h * 0.43)
      ..close();
    canvas.drawPath(cuffPath, Paint()..color = bagDarkFold);

    // Vertical crease fold lines for realistic paper bag look
    final creasePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
      ..strokeWidth = 1;
    canvas.drawLine(Offset(w * 0.28, h * 0.43), Offset(w * 0.29, h * 0.96), creasePaint);
    canvas.drawLine(Offset(w * 0.72, h * 0.43), Offset(w * 0.71, h * 0.96), creasePaint);

    // --- 3. White "GG" Logo in the center of the bag ---
    final textPainter = TextPainter(
      text: const TextSpan(
        text: 'GG',
        style: TextStyle(
          color: Colors.white,
          fontSize: 16,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
          fontFamily: 'sans-serif',
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();

    textPainter.paint(
      canvas,
      Offset((w - textPainter.width) / 2, h * 0.55),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
