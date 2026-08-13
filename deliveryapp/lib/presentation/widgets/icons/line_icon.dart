import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/theme/app_colors.dart';

enum LineIconName {
  shoppingBag,
  clock,
  route,
  wallet,
  gift,
  receipt,
  headset,
  person,
  chevronRight,
  star,
  verified,
  users,
  walletOutline,
  trophy,
}

/// Stroke-style SVG icons used across the home dashboard.
class LineIcon extends StatelessWidget {
  const LineIcon(
    this.name, {
    super.key,
    this.size = 22,
    this.color,
    this.strokeWidth = 1.6,
  });

  final LineIconName name;
  final double size;
  final Color? color;
  final double strokeWidth;

  @override
  Widget build(BuildContext context) {
    Theme.of(context);
    final effectiveColor = color ?? AppColors.textSecondary;
    return SvgPicture.string(
      _svg(name, strokeWidth),
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(effectiveColor, BlendMode.srcIn),
    );
  }

  static String _svg(LineIconName name, double stroke) {
    const s = 'stroke="black" fill="none" stroke-linecap="round" stroke-linejoin="round"';
    switch (name) {
      case LineIconName.shoppingBag:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 8h12l-1 12H7L6 8z" $s stroke-width="$stroke"/>
  <path d="M9 8V6a3 3 0 116 0v2" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.clock:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8.5" $s stroke-width="$stroke"/>
  <path d="M12 8v4l2.5 2" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.route:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 18c0-2.5 2-4 4-4s2 1.5 2 3-1 3-2 3H6" $s stroke-width="$stroke"/>
  <circle cx="18" cy="6" r="2.5" $s stroke-width="$stroke"/>
  <path d="M18 8.5V14" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.wallet:
      case LineIconName.walletOutline:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 8V6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2v-2" $s stroke-width="$stroke"/>
  <path d="M4 12h14a2 2 0 012 2v2H6a2 2 0 01-2-2v-2z" $s stroke-width="$stroke"/>
  <circle cx="17" cy="14" r="1" fill="black"/>
</svg>''';
      case LineIconName.gift:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="10" width="16" height="10" rx="1.5" $s stroke-width="$stroke"/>
  <path d="M12 10V20M4 14h16" $s stroke-width="$stroke"/>
  <path d="M12 10c-2-2-4-2-4-4s2-2 4 0 4 0 2-2 4 0 0 2-2 4" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.receipt:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 4h8l2 2v14l-2 2-2-2-2 2-2-2-2 2-2-2V4z" $s stroke-width="$stroke"/>
  <path d="M9 9h6M9 13h6M9 17h4" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.headset:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 12a8 8 0 0116 0" $s stroke-width="$stroke"/>
  <rect x="3" y="12" width="3" height="6" rx="1.5" $s stroke-width="$stroke"/>
  <rect x="18" y="12" width="3" height="6" rx="1.5" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.person:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="3.5" $s stroke-width="$stroke"/>
  <path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.chevronRight:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 6l6 6-6 6" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.star:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4l2.4 5 5.6.8-4 3.9.9 5.6L12 16.8 7.1 19.3l.9-5.6-4-3.9 5.6-.8L12 4z" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.verified:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8.5" $s stroke-width="$stroke"/>
  <path d="M8.5 12l2.2 2.2 4.8-5" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.users:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="9" r="3" $s stroke-width="$stroke"/>
  <path d="M3 19c0-3 2.7-5 6-5" $s stroke-width="$stroke"/>
  <circle cx="17" cy="10" r="2.5" $s stroke-width="$stroke"/>
  <path d="M14 19c0-2.5 1.8-4 4-4" $s stroke-width="$stroke"/>
</svg>''';
      case LineIconName.trophy:
        return '''
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 5h8v5a4 4 0 01-8 0V5z" $s stroke-width="$stroke"/>
  <path d="M8 7H5a2 2 0 000 4h3M16 7h3a2 2 0 010 4h-3" $s stroke-width="$stroke"/>
  <path d="M12 14v3M9 20h6" $s stroke-width="$stroke"/>
</svg>''';
    }
  }
}
