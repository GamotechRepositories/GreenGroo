import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.support,
        subtitle: l10n.weAreHereToHelp,
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
        children: [
          // 24/7 Support Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF064E3B), const Color(0xFF0F291E)]
                    : [const Color(0xFF0F5A32), const Color(0xFF084826)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.black38 : const Color(0x220F5A32),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Center(
                    child: Text('🎧', style: TextStyle(fontSize: 22)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.support247,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.supportAvailableRoundClock,
                        style: GoogleFonts.inter(
                          fontSize: 11.5,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          DashboardCard(
            padding: EdgeInsets.zero,
            child: Column(
              children: [
                ProfileTile(
                  title: l10n.faq,
                  subtitle: l10n.commonQuestions,
                  leadingIcon: Icons.help_outline_rounded,
                  onTap: () {},
                ),
                ProfileTile(
                  title: l10n.chatSupport,
                  subtitle: l10n.chatWithTeam,
                  leadingIcon: Icons.chat_bubble_outline_rounded,
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
        ],
      ),
    );
  }
}
