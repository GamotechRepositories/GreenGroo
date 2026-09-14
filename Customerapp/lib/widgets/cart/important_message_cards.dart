import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../core/utils/order_settings.dart';
import '../../models/store_settings.dart';

class ImportantMessageCards extends StatelessWidget {
  const ImportantMessageCards({
    super.key,
    this.settings,
  });

  final StoreSettings? settings;

  @override
  Widget build(BuildContext context) {
    final englishBullets = buildCartNoticeBullets(settings, language: 'en');
    final hindiBullets = buildCartNoticeBullets(settings, language: 'hi');

    return Column(
      children: [
        _ImportantMessageCard(
          title: 'Important Message',
          bullets: englishBullets,
        ),
        if (hindiBullets.isNotEmpty) const SizedBox(height: 12),
        _ImportantMessageCard(
          title: 'महत्वपूर्ण संदेश',
          bullets: hindiBullets,
        ),
      ],
    );
  }
}

class _ImportantMessageCard extends StatelessWidget {
  const _ImportantMessageCard({
    required this.title,
    required this.bullets,
  });

  final String title;
  final List<String> bullets;

  @override
  Widget build(BuildContext context) {
    if (bullets.isEmpty) return const SizedBox.shrink();

    return Semantics(
      label: title,
      container: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.borderLight),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0D000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const SizedBox(
                      width: 28,
                      height: 28,
                      child: Icon(
                        Icons.error_outline_rounded,
                        size: 16,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFFDC2626),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              for (var i = 0; i < bullets.length; i++) ...[
                if (i > 0) const SizedBox(height: 8),
                _BulletLine(text: bullets[i]),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _BulletLine extends StatelessWidget {
  const _BulletLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 7),
          child: Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: Color(0xFFEF4444),
              shape: BoxShape.circle,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 13,
              height: 1.45,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
