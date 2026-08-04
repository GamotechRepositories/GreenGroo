import 'package:flutter/material.dart';

import '../../config/theme.dart';

Future<void> showAuthSuccessDialog({
  required BuildContext context,
  required String userName,
  required bool isSignup,
}) {
  final greetingName = userName.trim().isNotEmpty ? userName.trim() : 'there';

  return showDialog<void>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) {
      return Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check_rounded,
                  color: Colors.green.shade700,
                  size: 40,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                isSignup ? 'Account Created!' : 'Login Successful',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isSignup
                    ? 'Welcome to BulkMobileMart, $greetingName!'
                    : 'Welcome back, $greetingName!',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.45,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 22),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('Continue Shopping'),
                ),
              ),
            ],
          ),
        ),
      );
    },
  );
}
