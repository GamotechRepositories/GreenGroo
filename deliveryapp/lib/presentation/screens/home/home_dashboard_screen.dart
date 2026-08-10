import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/rider_live_service.dart';
import '../../../data/services/shift_service.dart';
import '../../../domain/models/daily_progress.dart';
import '../../../l10n/app_localizations.dart';
import '../../shell/shell_navigation.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';

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
  bool _isPeak = false;
  String _onlineTodayLabel = '0m';
  ShiftBooking? _shiftBooking;

  /// Placeholder until live order API is wired.
  bool get _hasActiveOrder =>
      AuthService.instance.deliveryBoy?.status == 'on_delivery';

  bool get _verificationPending {
    final boy = AuthService.instance.deliveryBoy;
    if (boy == null) return false;
    return boy.onboardingComplete && boy.isVerificationPending;
  }

  String get _partnerName {
    final boy = AuthService.instance.deliveryBoy;
    final name = boy?.name.trim() ?? '';
    if (name.isNotEmpty) return name;
    return AppLocalizations.of(context).partnerName;
  }

  String get _statusLabel {
    final l10n = AppLocalizations.of(context);
    final status = AuthService.instance.deliveryBoy?.status ?? 'offline';
    if (status == 'on_delivery') return l10n.onADelivery;
    if (_isOnline) return l10n.online;
    return l10n.offline;
  }

  StatusType get _statusType {
    final status = AuthService.instance.deliveryBoy?.status ?? 'offline';
    if (status == 'on_delivery') return StatusType.info;
    if (_isOnline) return StatusType.online;
    return StatusType.offline;
  }

  @override
  void initState() {
    super.initState();
    _lastVerificationStatus =
        AuthService.instance.deliveryBoy?.verificationStatus;
    _isOnline = AuthService.instance.deliveryBoy?.isOnline ?? false;
    if (_isOnline) _startHeartbeat();
    _refreshVerificationInfo();
    _loadLiveData();
    _verifyPoll = Timer.periodic(const Duration(seconds: 20), (_) {
      if (_verificationPending ||
          _lastVerificationStatus == 'pending' ||
          _lastVerificationStatus == null) {
        _refreshVerificationInfo();
      }
    });
  }

  Future<void> _loadLiveData() async {
    await RiderLiveService.instance.refreshLoginHours();
    final booking = await RiderLiveService.instance.fetchMyBooking();
    final storeId = await _resolveStoreId();
    if (storeId != null) {
      await RiderLiveService.instance.refreshPeakHours(storeId);
    }
    if (!mounted) return;
    setState(() {
      _onlineTodayLabel = RiderLiveService.instance.formattedOnlineToday;
      _shiftBooking = booking;
      _isPeak = RiderLiveService.instance.isPeak;
    });
  }

  Future<String?> _resolveStoreId() async {
    final manager =
        _areaManager ?? await AuthService.instance.fetchAreaManager();
    _areaManager ??= manager;
    return manager?.storeId;
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
        if (justApproved) _showVerifiedBanner = true;
      });

      if (justApproved) _showVerifiedToast();
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
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        actions: [
          TextButton(
            onPressed: () => messenger.hideCurrentMaterialBanner(),
            child: const Text('OK', style: TextStyle(color: Colors.white)),
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
        _isPeak = RiderLiveService.instance.isPeak;
      });

      if (boy.isOnline) {
        _startHeartbeat();
      } else {
        _stopHeartbeat();
      }
      await _loadLiveData();
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
    final progress = ShiftService.dailyProgress;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.md,
        AppSpacing.lg,
        AppSpacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _PartnerHeader(
            name: _partnerName,
            statusLabel: _statusLabel,
            statusType: _statusType,
            onProfile: () => Navigator.pushNamed(context, AppRoutes.profile),
            onNotifications: () => ShellNavigation.instance.goToTab(4),
          ),
          const SizedBox(height: AppSpacing.xl),
          _OnlineToggleCard(
            isOnline: _isOnline,
            updating: _updatingStatus,
            enabled: !_verificationPending,
            onlineTodayLabel: _onlineTodayLabel,
            onChanged: _onStatusToggle,
          ),
          if (_isPeak && _isOnline) ...[
            const SizedBox(height: AppSpacing.md),
            const _PeakBanner(),
          ],
          if (_shiftBooking?.hasBooking == true) ...[
            const SizedBox(height: AppSpacing.md),
            _ShiftBanner(
              label: _shiftBooking!.label,
              time: '${_shiftBooking!.start}–${_shiftBooking!.end}',
            ),
          ],
          if (_showVerifiedBanner) ...[
            const SizedBox(height: AppSpacing.md),
            _VerifiedBanner(text: l10n.verificationApprovedToast),
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
          _EarningsStrip(
            earnings: ShiftService.earningsToday,
            orders: ShiftService.ordersToday,
            onlineHours: _onlineTodayLabel,
            onEarningsTap: () =>
                Navigator.pushNamed(context, AppRoutes.earnings),
            onOrdersTap: () =>
                Navigator.pushNamed(context, AppRoutes.deliveryHistory),
            onHoursTap: () =>
                Navigator.pushNamed(context, AppRoutes.attendance),
          ),
          const SizedBox(height: AppSpacing.md),
          _IncentiveProgressCard(progress: progress),
          const SizedBox(height: AppSpacing.xl),
          if (_hasActiveOrder)
            _ActiveOrderCard(
              onOpen: () =>
                  Navigator.pushNamed(context, AppRoutes.activeDelivery),
            )
          else
            _IdleOrderCard(isOnline: _isOnline),
          const SizedBox(height: AppSpacing.xl),
          _QuickLinksRow(
            onMap: () => ShellNavigation.instance.goToTab(2),
            onShifts: () => ShellNavigation.instance.goToTab(1),
            onSupport: () => Navigator.pushNamed(context, AppRoutes.support),
          ),
        ],
      ),
    );
  }
}

// ─── Top partner header ───────────────────────────────────────────────────────

class _PartnerHeader extends StatelessWidget {
  const _PartnerHeader({
    required this.name,
    required this.statusLabel,
    required this.statusType,
    required this.onProfile,
    required this.onNotifications,
  });

  final String name;
  final String statusLabel;
  final StatusType statusType;
  final VoidCallback onProfile;
  final VoidCallback onNotifications;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        GestureDetector(
          onTap: onProfile,
          child: CircleAvatar(
            radius: 26,
            backgroundColor: AppColors.primaryLight,
            child: Icon(Icons.person, color: AppColors.primary, size: 28),
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              StatusChip(label: statusLabel, type: statusType),
            ],
          ),
        ),
        IconButton(
          onPressed: onNotifications,
          icon: const Icon(Icons.notifications_outlined),
          color: AppColors.textPrimary,
        ),
      ],
    );
  }
}

// ─── Big online toggle ────────────────────────────────────────────────────────

class _OnlineToggleCard extends StatelessWidget {
  const _OnlineToggleCard({
    required this.isOnline,
    required this.updating,
    required this.enabled,
    required this.onlineTodayLabel,
    required this.onChanged,
  });

  final bool isOnline;
  final bool updating;
  final bool enabled;
  final String onlineTodayLabel;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final bg = isOnline ? AppColors.primary : AppColors.surfaceVariant;
    final fg = isOnline ? Colors.white : AppColors.textPrimary;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: isOnline
                ? AppColors.primary.withValues(alpha: 0.28)
                : AppColors.shadow,
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOnline ? l10n.youreOnline : l10n.goOnlineToReceive,
                  style: GoogleFonts.inter(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: fg,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isOnline
                      ? '${l10n.onlineForToday} $onlineTodayLabel'
                      : l10n.tapToStartReceiving,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: fg.withValues(alpha: 0.85),
                  ),
                ),
              ],
            ),
          ),
          if (updating)
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 2.5,
                color: fg,
              ),
            )
          else
            Switch.adaptive(
              value: isOnline,
              onChanged: enabled ? onChanged : null,
              activeThumbColor: Colors.white,
              activeTrackColor: Colors.white.withValues(alpha: 0.35),
            ),
        ],
      ),
    );
  }
}

// ─── Earnings strip ───────────────────────────────────────────────────────────

class _EarningsStrip extends StatelessWidget {
  const _EarningsStrip({
    required this.earnings,
    required this.orders,
    required this.onlineHours,
    required this.onEarningsTap,
    required this.onOrdersTap,
    required this.onHoursTap,
  });

  final String earnings;
  final String orders;
  final String onlineHours;
  final VoidCallback onEarningsTap;
  final VoidCallback onOrdersTap;
  final VoidCallback onHoursTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return DashboardCard(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      child: Row(
        children: [
          _StatCell(
            label: l10n.todaysEarnings,
            value: earnings,
            onTap: onEarningsTap,
          ),
          _divider(),
          _StatCell(
            label: l10n.orders,
            value: orders,
            onTap: onOrdersTap,
          ),
          _divider(),
          _StatCell(
            label: l10n.loginHours,
            value: onlineHours,
            onTap: onHoursTap,
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(
        width: 1,
        height: 40,
        color: AppColors.border,
      );
}

class _StatCell extends StatelessWidget {
  const _StatCell({
    required this.label,
    required this.value,
    required this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          child: Column(
            children: [
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Incentive / daily progress ───────────────────────────────────────────────

class _IncentiveProgressCard extends StatelessWidget {
  const _IncentiveProgressCard({required this.progress});

  final DailyProgress progress;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final remaining =
        (progress.ordersTarget - progress.ordersCompleted).clamp(0, 999);
    final pct = progress.ordersProgress.clamp(0.0, 1.0);

    return DashboardCard(
      onTap: () => Navigator.pushNamed(context, AppRoutes.performance),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.emoji_events_outlined, color: AppColors.warning, size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  remaining > 0
                      ? l10n.incentiveOrdersLeft(remaining)
                      : l10n.dailyTargetReached,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Text(
                '${progress.ordersCompleted}/${progress.ordersTarget}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: pct,
              minHeight: 8,
              backgroundColor: AppColors.surfaceVariant,
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Active / idle order ──────────────────────────────────────────────────────

class _ActiveOrderCard extends StatelessWidget {
  const _ActiveOrderCard({required this.onOpen});

  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return DashboardCard(
      onTap: onOpen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusChip(label: l10n.inProgress, type: StatusType.info),
              const Spacer(),
              Text(
                l10n.viewDetails,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _RouteLine(
            icon: Icons.storefront_outlined,
            title: l10n.pickUp,
            subtitle: l10n.placeholderStoreName,
          ),
          Padding(
            padding: const EdgeInsets.only(left: 15),
            child: Container(width: 2, height: 16, color: AppColors.border),
          ),
          _RouteLine(
            icon: Icons.location_on_outlined,
            title: l10n.dropOff,
            subtitle: l10n.placeholderDropAddress,
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onOpen,
                  child: Text(l10n.reachedStore),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: onOpen,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                  ),
                  child: Text(l10n.pickedUp),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RouteLine extends StatelessWidget {
  const _RouteLine({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 22, color: AppColors.primary),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                ),
              ),
              Text(
                subtitle,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _IdleOrderCard extends StatelessWidget {
  const _IdleOrderCard({required this.isOnline});

  final bool isOnline;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return DashboardCard(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: isOnline
                    ? AppColors.primaryLight
                    : AppColors.surfaceVariant,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isOnline
                    ? Icons.hourglass_top_rounded
                    : Icons.power_settings_new_rounded,
                color: isOnline ? AppColors.primary : AppColors.textMuted,
                size: 30,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              isOnline ? l10n.waitingForOrders : l10n.goOnlineToReceive,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              isOnline ? l10n.waitingForOrdersHint : l10n.tapToStartReceiving,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Banners & quick links ────────────────────────────────────────────────────

class _PeakBanner extends StatelessWidget {
  const _PeakBanner();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7ED),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDBA74)),
      ),
      child: Row(
        children: [
          const Text('🔥', style: TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              l10n.peakHoursBanner,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShiftBanner extends StatelessWidget {
  const _ShiftBanner({required this.label, required this.time});

  final String label;
  final String time;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        l10n.shiftBookedBanner(label, time),
        style: GoogleFonts.inter(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
      ),
    );
  }
}

class _VerifiedBanner extends StatelessWidget {
  const _VerifiedBanner({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
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
              text,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickLinksRow extends StatelessWidget {
  const _QuickLinksRow({
    required this.onMap,
    required this.onShifts,
    required this.onSupport,
  });

  final VoidCallback onMap;
  final VoidCallback onShifts;
  final VoidCallback onSupport;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Row(
      children: [
        _QuickChip(icon: Icons.map_outlined, label: l10n.map, onTap: onMap),
        const SizedBox(width: 8),
        _QuickChip(
          icon: Icons.schedule_outlined,
          label: l10n.myShifts,
          onTap: onShifts,
        ),
        const SizedBox(width: 8),
        _QuickChip(
          icon: Icons.support_agent_outlined,
          label: l10n.support,
          onTap: onSupport,
        ),
      ],
    );
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(height: 4),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 11,
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

// ─── Verification notice (unchanged logic) ────────────────────────────────────

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
    final border = rejected ? const Color(0xFFFECACA) : const Color(0xFFFDE68A);
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
                color: isDark
                    ? Colors.black26
                    : Colors.white.withValues(alpha: 0.7),
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
