import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.support,
        subtitle: l10n.weAreHereToHelp,
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
                  title: l10n.faq,
                  subtitle: l10n.commonQuestions,
                  leadingIcon: Icons.help_outline,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.chatSupport,
                  subtitle: l10n.chatWithTeam,
                  leadingIcon: Icons.chat_bubble_outline,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.callSupport,
                  subtitle: l10n.talkToSupportAgent,
                  leadingIcon: Icons.phone_outlined,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.raiseTicket,
                  subtitle: l10n.submitSupportRequest,
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
                      Text(l10n.support247, style: Theme.of(context).textTheme.titleMedium),
                      Text(
                        l10n.supportAvailableRoundClock,
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
