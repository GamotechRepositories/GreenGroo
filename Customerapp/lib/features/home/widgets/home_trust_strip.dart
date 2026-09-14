import 'package:flutter/material.dart';

import '../../../config/theme.dart';

class HomeTrustStrip extends StatelessWidget {
  const HomeTrustStrip({super.key});

  static const _items = [
    (
      icon: Icons.local_shipping_outlined,
      title: 'Free Shipping',
      subtitle: 'Orders over ₹499',
    ),
    (
      icon: Icons.replay_outlined,
      title: '7-Day Returns',
      subtitle: 'Easy returns',
    ),
    (
      icon: Icons.verified_user_outlined,
      title: 'Secure Pay',
      subtitle: '100% safe',
    ),
    (
      icon: Icons.headset_mic_outlined,
      title: '24/7 Support',
      subtitle: 'We help you',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          for (var i = 0; i < _items.length; i++) ...[
            if (i > 0)
              Container(
                width: 1,
                height: 32,
                color: AppColors.borderLight,
              ),
            Expanded(child: _TrustItem(item: _items[i])),
          ],
        ],
      ),
    );
  }
}

class _TrustItem extends StatelessWidget {
  const _TrustItem({required this.item});

  final ({IconData icon, String title, String subtitle}) item;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        children: [
          Icon(item.icon, color: AppColors.primary, size: 22),
          const SizedBox(height: 6),
          Text(
            item.title,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            item.subtitle,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 9,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
