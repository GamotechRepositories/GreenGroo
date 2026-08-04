import 'package:flutter/material.dart';

import '../../config/constants.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.height = 40, this.invert = false});

  final double height;
  final bool invert;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      AppConstants.logoAsset,
      height: height,
      fit: BoxFit.contain,
      filterQuality: FilterQuality.medium,
      errorBuilder: (context, error, stackTrace) => CachedNetworkImage(
        imageUrl: AppConstants.logoUrl,
        height: height,
        fit: BoxFit.contain,
        memCacheWidth: (height * 4).round(),
        memCacheHeight: (height * 2).round(),
        filterQuality: FilterQuality.medium,
        errorWidget: (context, url, err) => _textFallback(context),
      ),
    );
  }

  Widget _textFallback(BuildContext context) {
    return Text(
      'BulkMobileMart',
      style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: invert ? Colors.white : null,
          ),
    );
  }
}
