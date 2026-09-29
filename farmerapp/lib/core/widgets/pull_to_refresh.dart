import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// Pull-to-refresh for content that is not itself scrollable (empty states, loaders):
/// the child fills the viewport inside an always-scrollable view so the pull gesture works.
class PullToRefresh extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;
  final Color color;

  const PullToRefresh({
    super.key,
    required this.onRefresh,
    required this.child,
    this.color = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: color,
      onRefresh: onRefresh,
      child: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: child,
          ),
        ),
      ),
    );
  }
}
