import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Support',
        subtitle: 'We are here to help',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileTile(
                  title: 'FAQ',
                  subtitle: 'Common questions',
                  leadingIcon: Icons.help_outline,
                  onTap: () {},
                ),
                ProfileTile(
                  title: 'Chat Support',
                  subtitle: 'Chat with our team',
                  leadingIcon: Icons.chat_bubble_outline,
                  onTap: () {},
                ),
                ProfileTile(
                  title: 'Call Support',
                  subtitle: 'Talk to support agent',
                  leadingIcon: Icons.phone_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: 'Raise Ticket',
                  subtitle: 'Submit a support request',
                  leadingIcon: Icons.confirmation_number_outlined,
                  onTap: () {},
                  showDivider: false,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          DashboardCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  ),
                  child: Icon(Icons.support_agent, color: AppColors.primary),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('24/7 Support', style: Theme.of(context).textTheme.titleMedium),
                      Text(
                        'Our team is available round the clock',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
