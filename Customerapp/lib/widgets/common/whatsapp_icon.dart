import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Official WhatsApp brand mark (same path as web header).
class WhatsAppIcon extends StatelessWidget {
  const WhatsAppIcon({
    super.key,
    this.size = 22,
    this.color = const Color(0xFF25D366),
  });

  final double size;
  final Color color;

  static const _assetPath = 'assets/images/whatsapp.svg';

  @override
  Widget build(BuildContext context) {
    return SvgPicture.asset(
      _assetPath,
      width: size,
      height: size,
      colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
    );
  }
}
