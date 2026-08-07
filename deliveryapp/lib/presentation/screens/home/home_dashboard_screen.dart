import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/order_card.dart';
import '../../widgets/cards/statistic_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/common/empty_state.dart';

class HomeDashboardScreen extends StatefulWidget {
  const HomeDashboardScreen({super.key});

  @override
  State<HomeDashboardScreen> createState() => _HomeDashboardScreenState();
}

class _HomeDashboardScreenState extends State<HomeDashboardScreen> {
  bool _isOnline = false;
  bool _updatingStatus = false;
  Timer? _heartbeat;
  Timer? _verifyPoll;
  AreaManagerInfo? _areaManager;
  bool _loadingManager = false;
  String? _lastVerificationStatus;
  bool _showVerifiedBanner = false;

  bool get _verificationPending {
    final boy = AuthService.instance.deliveryBoy;
    if (boy == null) return false;
    return boy.onboardingComplete && boy.isVerificationPending;
  }

  @override
  void initState() {
    super.initState();
    _lastVerificationStatus =
        AuthService.instance.deliveryBoy?.verificationStatus;
    _isOnline = AuthService.instance.deliveryBoy?.isOnline ?? false;
    if (_isOnline) _startHeartbeat();
    _refreshVerificationInfo();
    _verifyPoll = Timer.periodic(const Duration(seconds: 20), (_) {
      if (_verificationPending ||
          _lastVerificationStatus == 'pending' ||
          _lastVerificationStatus == null) {
        _refreshVerificationInfo();
      }
    });
  }

  Future<void> _refreshVerificationInfo() async {
    setState(() => _loadingManager = true);
    try {
      final before = _lastVerificationStatus ??
          AuthService.instance.deliveryBoy?.verificationStatus;
      await AuthService.instance.fetchMe();
      final manager = await AuthService.instance.fetchAreaManager();
      if (!mounted) return;

      final after =
          AuthService.instance.deliveryBoy?.verificationStatus ?? 'pending';
      final justApproved = before != 'approved' && after == 'approved';

      setState(() {
        _areaManager = manager;
        _isOnline = AuthService.instance.deliveryBoy?.isOnline ?? false;
        _loadingManager = false;
        _lastVerificationStatus = after;
        if (justApproved) {
          _showVerifiedBanner = true;
        }
      });

      if (justApproved) {
        _showVerifiedToast();
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingManager = false);
    }
  }

  void _showVerifiedToast() {
    final l10n = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentMaterialBanner();
    messenger.showMaterialBanner(
      MaterialBanner(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        backgroundColor: const Color(0xFF0C831F),
        leading: const Icon(Icons.verified_rounded, color: Colors.white),
        content: Text(
          l10n.verificationApprovedToast,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => messenger.hideCurrentMaterialBanner(),
            child: const Text(
              'OK',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
    Future<void>.delayed(const Duration(seconds: 5), () {
      if (!mounted) return;
      messenger.hideCurrentMaterialBanner();
      setState(() => _showVerifiedBanner = false);
    });
  }

  @override
  void dispose() {
    _heartbeat?.cancel();
    _verifyPoll?.cancel();
    super.dispose();
  }

  void _startHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = Timer.periodic(const Duration(seconds: 45), (_) {
      AuthService.instance.sendHeartbeat();
    });
  }

  void _stopHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = null;
  }

  Future<void> _onStatusToggle(bool value) async {
    if (_updatingStatus) return;

    if (value && _verificationPending) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).verificationCannotGoOnline),
        ),
      );
      return;
    }

    setState(() {
      _updatingStatus = true;
      _isOnline = value;
    });

    try {
      final boy = await AuthService.instance.updateStatus(
        value ? 'online' : 'offline',
      );

      if (!mounted) return;

      if (boy == null) {
        setState(() {
          _isOnline = !value;
          _updatingStatus = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not update status. Try again.')),
        );
        return;
      }

      setState(() {
        _isOnline = boy.isOnline;
        _updatingStatus = false;
      });

      if (boy.isOnline) {
        _startHeartbeat();
      } else {
        _stopHeartbeat();
      }
    } on AuthApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _isOnline = !value;
        _updatingStatus = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.goodMorning,
                      style: Theme.of(context)
                          .textTheme
                          .headlineMedium
                          ?.copyWith(fontSize: 22),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      l10n.beSafeDeliverHappiness,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              if (_updatingStatus)
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              else
                Switch(
                  value: _isOnline,
                  onChanged: _verificationPending ? null : _onStatusToggle,
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          StatusChip(
            label: _isOnline ? l10n.online : l10n.offline,
            type: _isOnline ? StatusType.online : StatusType.offline,
          ),
          if (_showVerifiedBanner) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0C831F),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified_rounded, color: Colors.white),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      l10n.verificationApprovedToast,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (_verificationPending ||
              AuthService.instance.deliveryBoy?.verificationStatus ==
                  'rejected') ...[
            const SizedBox(height: AppSpacing.lg),
            _VerificationNoticeCard(
              pending: _verificationPending,
              rejected: AuthService.instance.deliveryBoy?.verificationStatus ==
                  'rejected',
              manager: _areaManager,
              loading: _loadingManager,
            ),
          ],
          const SizedBox(height: AppSpacing.xl),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.35,
            children: [
              StatisticCard(
                title: l10n.todaysEarnings,
                value: l10n.placeholderEarnings,
                subtitle: l10n.tapToViewDetails,
                icon: Icons.payments_outlined,
              ),
              StatisticCard(
                title: l10n.todaysDeliveries,
                value: l10n.placeholderDash,
                subtitle: l10n.completedToday,
                icon: Icons.local_shipping_outlined,
                iconColor: AppColors.info,
                iconBackground: Color(0xFFDBEAFE),
              ),
              StatisticCard(
                title: l10n.performanceScore,
                value: l10n.placeholderPercent,
                subtitle: l10n.thisWeek,
                icon: Icons.insights_outlined,
                iconColor: AppColors.warning,
                iconBackground: Color(0xFFFEF3C7),
              ),
              StatisticCard(
                title: l10n.customerRating,
                value: l10n.placeholderDash,
                subtitle: l10n.averageRating,
                icon: Icons.star_outline,
                iconColor: Color(0xFF8B5CF6),
                iconBackground: Color(0xFFEDE9FE),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          SectionHeader(title: l10n.activeDelivery),
          const SizedBox(height: AppSpacing.md),
          DashboardCard(
            onTap: () => Navigator.pushNamed(context, AppRoutes.activeDelivery),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusChip(label: l10n.inProgress, type: StatusType.info),
                    const Spacer(),
                    Text(
                      l10n.viewDetails,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                const DeliveryTimelinePreview(),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          SectionHeader(
            title: l10n.quickActions,
            actionLabel: l10n.seeAll,
            onAction: () => Navigator.pushNamed(context, AppRoutes.newOrders),
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 110,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _QuickAction(
                  icon: Icons.add_shopping_cart_outlined,
                  label: l10n.newOrders,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.newOrders),
                ),
                _QuickAction(
                  icon: Icons.map_outlined,
                  label: l10n.navigate,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.liveNavigation),
                ),
                _QuickAction(
                  icon: Icons.history_outlined,
                  label: l10n.history,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.deliveryHistory),
                ),
                _QuickAction(
                  icon: Icons.account_balance_wallet_outlined,
                  label: l10n.wallet,
                  onTap: () => Navigator.pushNamed(context, AppRoutes.wallet),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          SectionHeader(title: l10n.recentOrders),
          const SizedBox(height: AppSpacing.md),
          OrderCard(
            storeName: l10n.placeholderStoreName,
            customerName: l10n.placeholderCustomerName,
            pickupAddress: l10n.placeholderPickupAddress,
            dropAddress: l10n.placeholderDropAddress,
            distance: l10n.placeholderDistanceKm,
            estimatedEarnings: l10n.placeholderEarnings,
            estimatedTime: l10n.placeholderTimeMin,
            showActions: false,
          ),
          const SizedBox(height: AppSpacing.lg),
          StatisticCard(
            title: l10n.acceptanceRate,
            value: l10n.placeholderPercent,
            subtitle: l10n.last7Days,
            icon: Icons.check_circle_outline,
            onTap: () => Navigator.pushNamed(context, AppRoutes.performance),
          ),
        ],
      ),
    );
  }
}

class DeliveryTimelinePreview extends StatelessWidget {
  const DeliveryTimelinePreview({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            Container(width: 2, height: 32, color: AppColors.border),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 2),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.pickUp, style: Theme.of(context).textTheme.bodySmall),
              Text(l10n.storeLocation, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14)),
              const SizedBox(height: AppSpacing.md),
              Text(l10n.dropOff, style: Theme.of(context).textTheme.bodySmall),
              Text(l10n.customerLocation, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.md),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Container(
          width: 100,
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: AppColors.primary),
              const SizedBox(height: AppSpacing.sm),
              Text(
                label,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _VerificationNoticeCard extends StatelessWidget {
  const _VerificationNoticeCard({
    required this.pending,
    required this.rejected,
    required this.manager,
    required this.loading,
  });

  final bool pending;
  final bool rejected;
  final AreaManagerInfo? manager;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = rejected
        ? (isDark ? const Color(0xFF3F1D1D) : const Color(0xFFFEF2F2))
        : (isDark ? const Color(0xFF3B2F14) : const Color(0xFFFFFBEB));
    final border = rejected
        ? const Color(0xFFFECACA)
        : const Color(0xFFFDE68A);
    final iconColor = rejected ? AppColors.error : AppColors.warning;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                rejected ? Icons.cancel_outlined : Icons.warning_amber_rounded,
                color: iconColor,
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  rejected
                      ? l10n.verificationRejectedTitle
                      : l10n.verificationPendingTitle,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (pending) ...[
            Text(
              l10n.verificationPendingHours,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              l10n.verificationOfflineVisit,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              l10n.verificationCannotGoOnline,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ] else if (rejected) ...[
            Text(
              l10n.verificationRejectedHint,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          if (loading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: LinearProgressIndicator(minHeight: 2),
            )
          else if (manager != null) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: isDark ? Colors.black26 : Colors.white.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${l10n.verificationManagerLabel}: ${manager!.name}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 4),
                  Text('${l10n.verificationStoreLabel}: ${manager!.storeName}'),
                  const SizedBox(height: 4),
                  Text(
                    '${l10n.verificationAddressLabel}: ${manager!.storeAddress}',
                  ),
                  if (manager!.phone.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text('${l10n.verificationPhoneLabel}: ${manager!.phone}'),
                  ],
                ],
              ),
            ),
          ] else ...[
            Text(
              l10n.verificationNoManagerYet,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ],
        ],
      ),
    );
  }
}
