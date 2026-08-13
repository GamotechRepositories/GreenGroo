import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Rebuilds route content whenever light/dark mode changes so [AppColors] update.
class ThemeRebuild extends StatelessWidget {
  const ThemeRebuild({super.key, required this.builder});

  final WidgetBuilder builder;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: ThemeController.instance,
      builder: (context, _) {
        return KeyedSubtree(
          key: ValueKey(ThemeController.instance.isDark),
          child: builder(context),
        );
      },
    );
  }
}
