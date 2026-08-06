import 'package:flutter/material.dart';

import '../../../../core/constants/app_assets.dart';

/// Delivery scooter PNG — horizontal motion only (no rotate/scale/bounce).
class SplashScooter extends StatelessWidget {
  const SplashScooter({
    super.key,
    required this.width,
    required this.height,
  });

  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: Image.network(
        AppAssets.deliveryScooter,
        width: width,
        height: height,
        fit: BoxFit.contain,
        alignment: Alignment.bottomCenter,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) {
          return Align(
            alignment: Alignment.bottomCenter,
            child: Icon(
              Icons.delivery_dining_rounded,
              size: width * 0.45,
              color: const Color(0xFF0C831F),
            ),
          );
        },
      ),
    );
  }
}
