import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

/// Centered spinner used while a screen is waiting on backend data.
class AppLoader extends StatelessWidget {
  const AppLoader({super.key, this.message = 'लोड होत आहे...'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12.5, color: AppColors.muted, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
