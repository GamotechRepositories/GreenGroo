import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../common/app_network_image.dart';

class CategoryColorTheme {
  final Color topLeftColor;
  final Color bottomRightColor;
  final Color textColor;

  const CategoryColorTheme(
    this.topLeftColor,
    this.bottomRightColor,
    this.textColor,
  );
}

// Single identical bottom-right color for ALL category boxes
const sharedBottomRightColor = Color(0xFFFAF6F0);

CategoryColorTheme getCategoryColorTheme(String categoryName, int index) {
  final name = categoryName.toLowerCase().trim();

  if (name.contains('beverage') || name.contains('drink')) {
    return const CategoryColorTheme(
      Color(0xFFCDE8D0),
      sharedBottomRightColor,
      Color(0xFF164E29),
    );
  }
  if (name.contains('bakery') || name.contains('bread')) {
    return const CategoryColorTheme(
      Color(0xFFF7D5B8),
      sharedBottomRightColor,
      Color(0xFF6B310B),
    );
  }
  if (name.contains('dairy') || name.contains('milk')) {
    return const CategoryColorTheme(
      Color(0xFFCDE2FA),
      sharedBottomRightColor,
      Color(0xFF143B71),
    );
  }
  if (name.contains('dry fruit') || name.contains('nut')) {
    return const CategoryColorTheme(
      Color(0xFFFBE0BD),
      sharedBottomRightColor,
      Color(0xFF783E04),
    );
  }
  if (name.contains('fruit') && !name.contains('dry')) {
    return const CategoryColorTheme(
      Color(0xFFFAD1D5),
      sharedBottomRightColor,
      Color(0xFF7D1226),
    );
  }
  if (name.contains('grain') || name.contains('atta') || name.contains('rice') || name.contains('flour')) {
    return const CategoryColorTheme(
      Color(0xFFF4E0BF),
      sharedBottomRightColor,
      Color(0xFF684411),
    );
  }
  if (name.contains('grocery') || name.contains('staple')) {
    return const CategoryColorTheme(
      Color(0xFFDFDFF4),
      sharedBottomRightColor,
      Color(0xFF3F1970),
    );
  }
  if (name.contains('oil') || name.contains('ghee')) {
    return const CategoryColorTheme(
      Color(0xFFFAEEB4),
      sharedBottomRightColor,
      Color(0xFF664D00),
    );
  }
  if (name.contains('organic')) {
    return const CategoryColorTheme(
      Color(0xFFCEECD9),
      sharedBottomRightColor,
      Color(0xFF0C482A),
    );
  }
  if (name.contains('pulse') || name.contains('dal')) {
    return const CategoryColorTheme(
      Color(0xFFCFE7FE),
      sharedBottomRightColor,
      Color(0xFF094364),
    );
  }
  if (name.contains('spice') || name.contains('masala')) {
    return const CategoryColorTheme(
      Color(0xFFFCD7CB),
      sharedBottomRightColor,
      Color(0xFF84290E),
    );
  }
  if (name.contains('veg') || name.contains('sabzi')) {
    return const CategoryColorTheme(
      Color(0xFFCBEED7),
      sharedBottomRightColor,
      Color(0xFF114E28),
    );
  }
  if (name.contains('meat') || name.contains('chicken') || name.contains('fish')) {
    return const CategoryColorTheme(
      Color(0xFFFCD2CF),
      sharedBottomRightColor,
      Color(0xFF7C1616),
    );
  }
  if (name.contains('snack') || name.contains('munch')) {
    return const CategoryColorTheme(
      Color(0xFFFCE17E),
      sharedBottomRightColor,
      Color(0xFF72300A),
    );
  }
  if (name.contains('ready') || name.contains('instant')) {
    return const CategoryColorTheme(
      Color(0xFFFED19D),
      sharedBottomRightColor,
      Color(0xFF7D460A),
    );
  }

  const palette = [
    CategoryColorTheme(Color(0xFFCDE8D0), sharedBottomRightColor, Color(0xFF164E29)),
    CategoryColorTheme(Color(0xFFF7D5B8), sharedBottomRightColor, Color(0xFF6B310B)),
    CategoryColorTheme(Color(0xFFCDE2FA), sharedBottomRightColor, Color(0xFF143B71)),
    CategoryColorTheme(Color(0xFFFBE0BD), sharedBottomRightColor, Color(0xFF783E04)),
    CategoryColorTheme(Color(0xFFFAD1D5), sharedBottomRightColor, Color(0xFF7D1226)),
    CategoryColorTheme(Color(0xFFF4E0BF), sharedBottomRightColor, Color(0xFF684411)),
    CategoryColorTheme(Color(0xFFCEECD9), sharedBottomRightColor, Color(0xFF0C482A)),
    CategoryColorTheme(Color(0xFFFCD7CB), sharedBottomRightColor, Color(0xFF84290E)),
    CategoryColorTheme(Color(0xFFCFE7FE), sharedBottomRightColor, Color(0xFF094364)),
  ];

  return palette[index % palette.length];
}

class TriangularSplitPainter extends CustomPainter {
  final Color topLeftColor;
  final Color bottomRightColor;
  final Color textColor;
  final String categoryName;

  TriangularSplitPainter({
    required this.topLeftColor,
    required this.bottomRightColor,
    required this.textColor,
    required this.categoryName,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Top-left triangle (Richer pastel shade)
    final path1 = Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path1, Paint()..color = topLeftColor);

    // Bottom-right triangle (Same identical cream color for all boxes)
    final path2 = Path()
      ..moveTo(size.width, 0)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();
    canvas.drawPath(path2, Paint()..color = bottomRightColor);
  }

  @override
  bool shouldRepaint(covariant TriangularSplitPainter oldDelegate) {
    return oldDelegate.topLeftColor != topLeftColor ||
        oldDelegate.bottomRightColor != bottomRightColor ||
        oldDelegate.textColor != textColor;
  }
}

class CategoryTriangularCard extends StatelessWidget {
  final String categoryName;
  final String? imageUrl;
  final IconData errorIcon;
  final VoidCallback onTap;
  final int index;

  const CategoryTriangularCard({
    super.key,
    required this.categoryName,
    required this.onTap,
    this.imageUrl,
    this.errorIcon = Icons.category_rounded,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    final theme = getCategoryColorTheme(categoryName, index);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFF1F5F9), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: CustomPaint(
            painter: TriangularSplitPainter(
              topLeftColor: theme.topLeftColor,
              bottomRightColor: theme.bottomRightColor,
              textColor: theme.textColor,
              categoryName: categoryName,
            ),
            child: Stack(
              children: [
                // Top Category Title (Distinctive Montserrat typography & unique color per category)
                Positioned(
                  top: 10,
                  left: 10,
                  right: 10,
                  child: Text(
                    categoryName.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.montserrat(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: theme.textColor,
                      letterSpacing: 0.3,
                    ),
                  ),
                ),

                // Center-Bottom Image (Maximized Size)
                Positioned.fill(
                  top: 22,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
                    child: Center(
                      child: SizedBox.expand(
                        child: imageUrl != null && imageUrl!.isNotEmpty
                            ? AppNetworkImage(
                                imageUrl: imageUrl!,
                                fit: BoxFit.contain,
                                errorIcon: errorIcon,
                                errorIconSize: 46,
                              )
                            : Icon(
                                errorIcon,
                                size: 46,
                                color: theme.textColor.withValues(alpha: 0.7),
                              ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
