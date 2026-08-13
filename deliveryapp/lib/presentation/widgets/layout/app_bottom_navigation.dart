import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';

/// Full-width sticky bottom bar with raised green Map button in the center.
/// Home · My Shifts · [Map] · Wallet · Notifications
class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final bottomPad = MediaQuery.paddingOf(context).bottom;
    Theme.of(context); // rebuild on light/dark toggle

    return Material(
      color: Colors.transparent,
      child: SizedBox(
        height: 72 + bottomPad,
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            // Full-width square bar stuck to bottom
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                width: double.infinity,
                padding: EdgeInsets.only(bottom: bottomPad),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  border: Border(
                    top: BorderSide(color: AppColors.border, width: 1),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.shadow,
                      blurRadius: 12,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SizedBox(
                  height: 56,
                  child: Row(
                    children: [
                      _sideTab(0, Icons.home_outlined, Icons.home_rounded, l10n.home),
                      _sideTab(1, Icons.schedule_outlined, Icons.schedule, l10n.myShifts),
                      const Expanded(child: SizedBox()),
                      _sideTab(
                        3,
                        Icons.account_balance_wallet_outlined,
                        Icons.account_balance_wallet,
                        l10n.wallet,
                      ),
                      _sideTab(
                        4,
                        Icons.notifications_outlined,
                        Icons.notifications,
                        l10n.notifications,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Raised green round Map button
            Positioned(
              bottom: bottomPad + 18,
              child: GestureDetector(
                onTap: () => onTap(2),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                        border: Border.all(
                          color: AppColors.background,
                          width: 3,
                        ),
                      ),
                      child: const Icon(
                        Icons.location_on_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.map,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        fontWeight: currentIndex == 2
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: currentIndex == 2
                            ? AppColors.primary
                            : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sideTab(int index, IconData icon, IconData activeIcon, String label) {
    return Expanded(
      child: _NavTab(
        icon: icon,
        activeIcon: activeIcon,
        label: label,
        isActive: currentIndex == index,
        onTap: () => onTap(index),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  const _NavTab({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.primary : AppColors.textSecondary;

    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(isActive ? activeIcon : icon, size: 24, color: color),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Container(
            width: isActive ? 18 : 0,
            height: 3,
            color: isActive ? AppColors.primary : Colors.transparent,
          ),
        ],
      ),
    );
  }
}
