import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  const CustomAppBar({
    super.key,
    required this.title,
    this.subtitle,
    this.actions,
    this.leading,
    this.showBackButton = false,
    this.centerTitle = false,
    this.leadingWidth,
    this.showTitle = true,
  });

  final String title;
  final bool showTitle;
  final String? subtitle;
  final List<Widget>? actions;
  final Widget? leading;
  final bool showBackButton;
  final bool centerTitle;
  final double? leadingWidth;

  @override
  Size get preferredSize =>
      Size.fromHeight(subtitle != null ? 72 : kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    // Depend on Theme so light/dark toggles rebuild this bar immediately.
    final theme = Theme.of(context);
    return AppBar(
      leadingWidth: leadingWidth,
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.textPrimary,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: centerTitle,
      automaticallyImplyLeading: showBackButton,
      leading: leading,
      iconTheme: IconThemeData(color: AppColors.textPrimary),
      title: !showTitle
          ? null
          : subtitle != null
              ? Column(
                  crossAxisAlignment: centerTitle
                      ? CrossAxisAlignment.center
                      : CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: AppColors.textPrimary)),
                    Text(
                      subtitle!,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                )
              : Text(title, style: TextStyle(color: AppColors.textPrimary)),
      actions: actions,
    );
  }
}
