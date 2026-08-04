import 'package:flutter/material.dart';

import '../../../config/app_decorations.dart';
import '../../../config/theme.dart';

/// Home section wrapper — flat on landing (no nested white cards).
class HomeSectionCard extends StatelessWidget {
  const HomeSectionCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 0, 16, 4),
    this.margin = const EdgeInsets.fromLTRB(0, 12, 0, 8),
    this.boxed = false,
    this.showDivider = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final EdgeInsets margin;
  /// White card with border — use only where a panel is needed.
  final bool boxed;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final content = Padding(padding: padding, child: child);

    return Padding(
      padding: margin,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (boxed)
            DecoratedBox(
              decoration: AppDecorations.card(),
              child: content,
            )
          else
            content,
          if (showDivider)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Divider(
                height: 1,
                color: AppColors.borderLight.withValues(alpha: 0.7),
              ),
            ),
        ],
      ),
    );
  }
}
