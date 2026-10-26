import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';

/// Centered result dialog: coloured icon badge, title, message and one full-width button.
Future<void> showStatusDialog(
  BuildContext context, {
  required bool success,
  required String title,
  required String message,
  required String buttonLabel,
}) {
  final accent = success ? const Color(0xFF059669) : const Color(0xFFEA580C);
  final tint = success ? const Color(0xFFD1FAE5) : const Color(0xFFFFEDD5);

  return showDialog<void>(
    context: context,
    builder: (ctx) => Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 32),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 26, 22, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: tint,
                shape: BoxShape.circle,
                border: Border.all(color: accent.withValues(alpha: 0.25), width: 6),
              ),
              child: Icon(
                success ? Icons.check_rounded : Icons.priority_high_rounded,
                color: accent,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            if (message.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                message,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  height: 1.45,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: accent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  textStyle: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: Text(buttonLabel),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
