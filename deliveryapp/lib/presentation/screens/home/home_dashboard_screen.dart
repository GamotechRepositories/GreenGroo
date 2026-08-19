import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/location_service.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/rider_live_service.dart';
import '../../../data/services/shift_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../shell/shell_navigation.dart';
import '../active_delivery/active_delivery_screen.dart';
import '../shifts/select_shift_screen.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/dialogs/order_dispatch_dialog.dart';
import '../../widgets/icons/line_icon.dart';

const _kRupee = '\u20B9';

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
  Timer? _offerPoll;
  bool _isShowingOffer = false;
  AreaManagerInfo? _areaManager;
  bool _loadingManager = false;
  String? _lastVerificationStatus;
  bool _showVerifiedBanner = false;
  List<GigInfo> _homeGigs = [];

  Future<void> _loadGigsData() async {
    try {
      final gigs = await ShiftService.instance.fetchGigs();
      if (mounted) {
        setState(() {
          _homeGigs = gigs;
        });
      }
    } catch (_) {}
  }

  /// Active order status check
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

  @override
  void initState() {
    super.initState();
    _lastVerificationStatus =
        AuthService.instance.deliveryBoy?.verificationStatus;
    _isOnline = AuthService.instance.deliveryBoy?.isOnline ?? false;
    if (_isOnline) {
      _startHeartbeat();
      _startOfferPoll();
    }
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

  void _startOfferPoll() {
    _offerPoll?.cancel();
    _offerPoll = Timer.periodic(const Duration(seconds: 2), (_) {
      _checkOrderOffers();
    });
  }

  void _stopOfferPoll() {
    _offerPoll?.cancel();
    _offerPoll = null;
  }

  Future<void> _checkOrderOffers() async {
    if (!_isOnline || _isShowingOffer || !mounted) return;
    final offer = await OrderService.instance.checkForOffer();
    if (offer != null && !_isShowingOffer && mounted) {
      _isShowingOffer = true;
      await OrderDispatchDialog.show(
        context,
        offer: offer,
        onAccept: () async {
          final success = await OrderService.instance.acceptOffer(offer.orderId);
          _isShowingOffer = false;
          if (success && mounted) {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const ActiveDeliveryScreen()),
            );
          }
        },
        onDecline: () async {
          await OrderService.instance.declineOffer(offer.orderId);
          _isShowingOffer = false;
        },
      );
      _isShowingOffer = false;
    }
  }

  Future<void> _loadLiveData() async {
    await RiderLiveService.instance.refreshLoginHours();
    await _loadGigsData();
    final storeId = await _resolveStoreId();
    if (storeId != null) {
      await RiderLiveService.instance.refreshPeakHours(storeId);
    }
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
    _offerPoll?.cancel();
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
    });

    try {
      if (value) {
        // Prompt Rider to Turn ON GPS / Location before going online
        final proceed = await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.location_on_rounded, color: Color(0xFF059669), size: 28),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Turn ON Location / GPS',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            content: const Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Before going online, please ensure your phone\'s Location / GPS is turned ON.',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.black87),
                ),
                SizedBox(height: 10),
                Text(
                  'Your GPS location will be verified against the assigned Dark Store (Pune Aundh/Balewadi geofence) to start your shift hours.',
                  style: TextStyle(fontSize: 13, color: Colors.black54),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                ),
                icon: const Icon(Icons.gps_fixed_rounded, color: Colors.white, size: 18),
                label: const Text(
                  'Location ON — Check & Go Online',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
                onPressed: () => Navigator.pop(ctx, true),
              ),
            ],
          ),
        );

        if (proceed != true) {
          setState(() {
            _isOnline = false;
            _updatingStatus = false;
          });
          return;
        }

        // Automatic Device Location Detection via LocationService
        final position = await LocationService.instance.getCurrentLocation();
        if (position == null) {
          if (!mounted) return;
          setState(() {
            _isOnline = false;
            _updatingStatus = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please enable location access and GPS on your phone to go online.'),
              backgroundColor: Colors.orange,
            ),
          );
          return;
        }

        // Going ONLINE: Mandatory Shift & Real GPS Location Verification
        final result = await ShiftService.instance.goOnlineWithLocation(
          position.latitude,
          position.longitude,
        );

        if (!mounted) return;

        if (!result.success) {
          setState(() {
            _isOnline = false;
            _updatingStatus = false;
          });

          showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Row(
                children: [
                  Icon(
                    result.code == 'NO_SHIFT_BOOKED' ? Icons.calendar_today_rounded : Icons.location_off_rounded,
                    color: Colors.orange,
                  ),
                  const SizedBox(width: 8),
                  Text(result.code == 'NO_SHIFT_BOOKED' ? 'Shift Required' : 'Location Check Failed'),
                ],
              ),
              content: Text(result.message),
              actions: [
                if (result.code == 'NO_SHIFT_BOOKED')
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const SelectShiftScreen()),
                      );
                    },
                    child: const Text('Select Shift Slot', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  )
                else
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('OK'),
                  ),
              ],
            ),
          );
          return;
        }

        setState(() {
          _isOnline = true;
          _updatingStatus = false;
        });
        _startHeartbeat();
        _startOfferPoll();

        // Start Live Location Stream while Rider is Online
        LocationService.instance.startLiveTracking(
          onPositionUpdate: (pos) {
            // Sends live GPS updates to backend during heartbeat
            AuthService.instance.sendHeartbeat();
          },
        );

        // Show Shift Start Countdown / Verified Alert
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.timer_rounded, color: Color(0xFF059669), size: 28),
                SizedBox(width: 8),
                Text('Shift Verified & Checked In!'),
              ],
            ),
            content: Text(
              result.message,
              style: const TextStyle(fontSize: 14, height: 1.4, color: Colors.black87),
            ),
            actions: [
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      } else {
        // Going OFFLINE
        LocationService.instance.stopLiveTracking();
        await ShiftService.instance.goOffline();

        if (!mounted) return;
        setState(() {
          _isOnline = false;
          _updatingStatus = false;
        });
        _stopHeartbeat();
        _stopOfferPoll();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _updatingStatus = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not update status: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    Theme.of(context);
    final isVerified = AuthService.instance.deliveryBoy?.isVerified ?? false;
    final earningsToday = ShiftService.earningsToday;
    const walletBalance = '${_kRupee}1,250.00';
    const weekEarnings = '${_kRupee}4,350.00';
    const completedToday = '8';
    const distanceToday = '120 km';
    const milestoneCurrent = 8;
    const milestoneTarget = 13;
    const bonusAmount = '${_kRupee}200';
    const orderEarnings = '${_kRupee}45.00';

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.lg,
        MediaQuery.of(context).padding.top + AppSpacing.sm,
        AppSpacing.lg,
        AppSpacing.xl,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _HeaderWithOnlineToggle(
            name: _partnerName,
            isVerified: isVerified,
            isOnline: _isOnline,
            updatingStatus: _updatingStatus,
            verificationPending: _verificationPending,
            onStatusToggle: _onStatusToggle,
            onProfileTap: () => Navigator.pushNamed(context, AppRoutes.profile),
          ),
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
          if (_homeGigs.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.md),
            _GigDetailsHeaderCard(
              gig: _homeGigs.first,
              onBookTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SelectShiftScreen()),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          _TodaysProgressCard(
            earnings: earningsToday,
            trips: distanceToday,
            sessions: '${RiderLiveService.instance.loginHoursToday} hrs',
            gigsHistory: '${ShiftService.ordersToday} Gigs',
          ),
          const SizedBox(height: AppSpacing.md),
          if (_homeGigs.isNotEmpty) ...[
            _LiveGigIncentiveProgressCard(
              gigs: _homeGigs,
              onTapMore: () => ShellNavigation.instance.goToTab(1),
            ),
            const SizedBox(height: AppSpacing.md),
          ],
          _AllOffersSectionCard(
            gigs: _homeGigs,
            onSeeAll: () => ShellNavigation.instance.goToTab(1),
          ),
          const SizedBox(height: AppSpacing.md),
          _FullWidthPromoCard(
            title: l10n.earnBonus,
            subtitle: l10n.earnBonusSubtitle,
            icon: LineIconName.gift,
            background: const Color(0xFFFFF7ED),
            iconBackground: const Color(0xFFFFEDD5),
            iconColor: const Color(0xFFEA580C),
            onTap: () => Navigator.pushNamed(context, AppRoutes.earnings),
          ),
          const SizedBox(height: AppSpacing.md),
          _FullWidthPromoCard(
            title: l10n.referAndEarn,
            subtitle: l10n.referAndEarnSubtitle,
            icon: LineIconName.users,
            background: const Color(0xFFEFF6FF),
            iconBackground: const Color(0xFFDBEAFE),
            iconColor: const Color(0xFF2563EB),
            onTap: () {},
          ),
          if (_hasActiveOrder || _isOnline) ...[
            const SizedBox(height: AppSpacing.md),
            if (_hasActiveOrder)
              _ActiveDeliveryCard(
                onOpen: () =>
                    Navigator.pushNamed(context, AppRoutes.activeDelivery),
                continueLabel: l10n.continueDelivery,
              )
            else
              _IncomingOrderCard(
                title: l10n.currentOrder,
                pickUpLabel: l10n.pickUp,
                dropOffLabel: l10n.dropOff,
                distanceLabel: l10n.kmAway('2.4'),
                earningsAmount: orderEarnings,
                earningsLabel: l10n.orderEarnings,
                acceptLabel: l10n.acceptOrder,
              ),
          ],
          const SizedBox(height: AppSpacing.xl),
          Text(
            l10n.quickActions,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
          _QuickActionsRow(
            myOrdersLabel: l10n.myOrders,
            earningsLabel: l10n.earnings,
            incentivesLabel: l10n.incentives,
            supportLabel: l10n.support,
            profileLabel: l10n.profile,
            onMyOrders: () =>
                Navigator.pushNamed(context, AppRoutes.deliveryHistory),
            onEarnings: () => Navigator.pushNamed(context, AppRoutes.earnings),
            onIncentives: () =>
                Navigator.pushNamed(context, AppRoutes.earnings),
            onSupport: () => Navigator.pushNamed(context, AppRoutes.support),
            onProfile: () => Navigator.pushNamed(context, AppRoutes.profile),
          ),
        ],
      ),
    );
  }
}

class _HeaderWithOnlineToggle extends StatelessWidget {
  const _HeaderWithOnlineToggle({
    required this.name,
    required this.isVerified,
    required this.isOnline,
    required this.updatingStatus,
    required this.verificationPending,
    required this.onStatusToggle,
    required this.onProfileTap,
  });

  final String name;
  final bool isVerified;
  final bool isOnline;
  final bool updatingStatus;
  final bool verificationPending;
  final ValueChanged<bool> onStatusToggle;
  final VoidCallback onProfileTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ROW 1: Menu Bar (3 lines) + Delivery Partner Name + Verified Badge + Profile Icon on far right
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Builder(
              builder: (ctx) => IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: const Icon(Icons.menu_rounded, size: 28, color: Colors.black87),
                onPressed: () => Scaffold.of(ctx).openDrawer(),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Row(
                children: [
                  Flexible(
                    child: Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isVerified) ...[
                    const SizedBox(width: 6),
                    const Icon(
                      Icons.verified_rounded,
                      size: 18,
                      color: Color(0xFF059669),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onProfileTap,
              child: Container(
                padding: const EdgeInsets.all(1.5),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.primary, width: 1.5),
                ),
                child: const CircleAvatar(
                  radius: 14,
                  backgroundColor: Color(0xFFDCFCE7),
                  backgroundImage: AssetImage('assets/splash/delivery_scooter.webp'),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // ROW 2: Online / Offline Toggle below the partner name
        _OnlineStatusCard(
          isOnline: isOnline,
          updating: updatingStatus,
          enabled: !verificationPending,
          onlineTitle: l10n.youAreOnline,
          offlineTitle: l10n.youAreOffline,
          subtitle: isOnline ? l10n.receiveDeliveryRequests : l10n.offlineDeliveryHint,
          onChanged: onStatusToggle,
        ),
      ],
    );
  }
}

class _WalletBalanceCard extends StatelessWidget {
  const _WalletBalanceCard({
    required this.balance,
    required this.todayEarnings,
    required this.weekEarnings,
    required this.onViewWallet,
  });

  final String balance;
  final String todayEarnings;
  final String weekEarnings;
  final VoidCallback onViewWallet;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0C831F), Color(0xFF086618)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -12,
            bottom: -8,
            child: LineIcon(
              LineIconName.walletOutline,
              size: 120,
              color: Colors.white.withValues(alpha: 0.08),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.walletBalance,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white.withValues(alpha: 0.9),
                      ),
                ),
                const SizedBox(height: 4),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Text(
                            balance,
                            style: Theme.of(context)
                                .textTheme
                                .headlineMedium
                                ?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 28,
                                ),
                          ),
                          LineIcon(
                            LineIconName.chevronRight,
                            size: 22,
                            color: Colors.white70,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Material(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      child: InkWell(
                        onTap: onViewWallet,
                        borderRadius: BorderRadius.circular(20),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                l10n.viewWallet,
                                style: Theme.of(context)
                                    .textTheme
                                    .labelMedium
                                    ?.copyWith(
                                      color: AppColors.primary,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(width: 4),
                              LineIcon(
                                LineIconName.wallet,
                                size: 16,
                                color: AppColors.primary,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                Divider(color: Colors.white.withValues(alpha: 0.25), height: 1),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: _WalletStat(
                        label: l10n.todaysEarnings,
                        value: todayEarnings,
                      ),
                    ),
                    Container(
                      width: 1,
                      height: 36,
                      color: Colors.white.withValues(alpha: 0.25),
                    ),
                    Expanded(
                      child: _WalletStat(
                        label: l10n.thisWeekEarnings,
                        value: weekEarnings,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _WalletStat extends StatelessWidget {
  const _WalletStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: Colors.white.withValues(alpha: 0.85),
              ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
        ),
      ],
    );
  }
}

class _OnlineStatusCard extends StatelessWidget {
  const _OnlineStatusCard({
    required this.isOnline,
    required this.updating,
    required this.enabled,
    required this.onlineTitle,
    required this.offlineTitle,
    required this.subtitle,
    required this.onChanged,
  });

  final bool isOnline;
  final bool updating;
  final bool enabled;
  final String onlineTitle;
  final String offlineTitle;
  final String subtitle;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: isOnline ? AppColors.primary : AppColors.offline,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isOnline ? onlineTitle : offlineTitle,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: isOnline
                            ? AppColors.primary
                            : AppColors.textPrimary,
                      ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
          if (updating)
            const SizedBox(
              width: 48,
              height: 28,
              child: Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            )
          else
            Switch.adaptive(
              value: isOnline,
              onChanged: enabled ? onChanged : null,
              activeThumbColor: AppColors.primary,
            ),
        ],
      ),
    );
  }
}

class _DailyStatsGrid extends StatelessWidget {
  const _DailyStatsGrid({
    required this.orders,
    required this.completed,
    required this.distance,
    required this.earnings,
    required this.ordersLabel,
    required this.completedLabel,
    required this.distanceLabel,
    required this.earningsLabel,
  });

  final String orders;
  final String completed;
  final String distance;
  final String earnings;
  final String ordersLabel;
  final String completedLabel;
  final String distanceLabel;
  final String earningsLabel;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.lg),
      child: IntrinsicHeight(
        child: Row(
          children: [
            _DailyStatItem(
              icon: LineIconName.shoppingBag,
              iconColor: AppColors.primary,
              value: orders,
              label: ordersLabel,
            ),
            _verticalDivider(),
            _DailyStatItem(
              icon: LineIconName.clock,
              iconColor: const Color(0xFFEA580C),
              value: completed,
              label: completedLabel,
            ),
            _verticalDivider(),
            _DailyStatItem(
              icon: LineIconName.route,
              iconColor: const Color(0xFF2563EB),
              value: distance,
              label: distanceLabel,
            ),
            _verticalDivider(),
            _DailyStatItem(
              icon: LineIconName.wallet,
              iconColor: const Color(0xFF7C3AED),
              value: earnings,
              label: earningsLabel,
            ),
          ],
        ),
      ),
    );
  }

  Widget _verticalDivider() => Container(
        width: 1,
        color: AppColors.border,
      );
}

class _DailyStatItem extends StatelessWidget {
  const _DailyStatItem({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  final LineIconName icon;
  final Color iconColor;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          LineIcon(icon, size: 20, color: iconColor),
          const SizedBox(height: 6),
          Text(
            value,
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 10,
                ),
            textAlign: TextAlign.center,
            maxLines: 2,
          ),
        ],
      ),
    );
  }
}

class _MilestoneCard extends StatelessWidget {
  const _MilestoneCard({
    required this.current,
    required this.target,
    required this.remaining,
    required this.bonusAmount,
  });

  final int current;
  final int target;
  final int remaining;
  final String bonusAmount;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final progress = current / target;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: AppColors.primarySoft),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: LineIcon(
                LineIconName.gift,
                size: 26,
                color: AppColors.primary,
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.completeMoreDeliveriesBonus(remaining, bonusAmount),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                        height: 1.35,
                      ),
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progress,
                    minHeight: 6,
                    backgroundColor: Colors.white,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$current / $target',
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: AppColors.primary,
                    ),
              ),
              LineIcon(
                LineIconName.chevronRight,
                size: 18,
                color: AppColors.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LiveGigIncentiveProgressCard extends StatelessWidget {
  const _LiveGigIncentiveProgressCard({
    required this.gigs,
    required this.onTapMore,
  });

  final List<GigInfo> gigs;
  final VoidCallback onTapMore;

  @override
  Widget build(BuildContext context) {
    if (gigs.isEmpty) return const SizedBox.shrink();

    final activeGig = gigs.first;
    final isHoursBonus = activeGig.type == 'hours_bonus';
    final hasTiers = activeGig.tiers.isNotEmpty;

    // Active progress towards first target
    final currentProgressVal = 0; 
    final firstTier = hasTiers ? activeGig.tiers.first : null;
    final nextTarget = firstTier != null ? firstTier.minTarget : (isHoursBonus ? activeGig.targetHours : activeGig.targetEarnings);
    final nextBonus = firstTier != null ? firstTier.bonusAmount : activeGig.bonusAmount;

    final progressRatio = (nextTarget > 0) ? (currentProgressVal / nextTarget).clamp(0.0, 1.0) : 0.0;
    final remainingTarget = nextTarget - currentProgressVal > 0 ? nextTarget - currentProgressVal : 0;

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFDE68A), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD97706).withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Badge & Time Window
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFD97706),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.local_fire_department_rounded, color: Colors.white, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'ACTIVE STORE GIG',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '${activeGig.startTime} – ${activeGig.endTime}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFB45309),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          Text(
            activeGig.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF78350F),
            ),
          ),
          if (activeGig.description.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              activeGig.description,
              style: const TextStyle(fontSize: 11, color: Color(0xFFB45309)),
            ),
          ],
          const SizedBox(height: 12),

          // Progress Bar & Goal Status
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isHoursBonus
                        ? 'Current Progress: $currentProgressVal hrs'
                        : 'Current Earnings: \u20B9$currentProgressVal / \u20B9$nextTarget',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF92400E),
                    ),
                  ),
                  Text(
                    '+\u20B9$nextBonus Bonus',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF16A34A),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progressRatio,
                  minHeight: 8,
                  backgroundColor: Colors.white,
                  color: const Color(0xFFD97706),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                remainingTarget > 0
                    ? (isHoursBonus
                        ? 'Work $remainingTarget more hrs to claim +\u20B9$nextBonus!'
                        : 'Earn \u20B9$remainingTarget more in this window to claim +\u20B9$nextBonus bonus!')
                    : '🎉 Target reached! Bonus unlocked!',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFFB45309),
                ),
              ),
            ],
          ),

          if (hasTiers) ...[
            const SizedBox(height: 12),
            const Divider(color: Color(0xFFFDE68A), height: 1),
            const SizedBox(height: 10),
            const Text(
              'INCENTIVE SLABS & BONUS LEVELS',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: Color(0xFF92400E),
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: activeGig.tiers.map((t) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      currentProgressVal >= t.minTarget ? Icons.check_circle_rounded : Icons.lock_clock_rounded,
                      size: 14,
                      color: currentProgressVal >= t.minTarget ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      isHoursBonus
                          ? '${t.minTarget} hrs ➔ +\u20B9${t.bonusAmount}'
                          : '\u20B9${t.minTarget} ➔ +\u20B9${t.bonusAmount}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF78350F),
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ),
          ],
        ],
      ),
    );
  }
}

class _GigDetailsHeaderCard extends StatelessWidget {
  const _GigDetailsHeaderCard({
    required this.gig,
    required this.onBookTap,
  });

  final GigInfo gig;
  final VoidCallback onBookTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F0F172A),
            blurRadius: 18,
            offset: Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
            ),
            child: Row(
              children: [
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFF10B981),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text(
                      'g',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Gig details',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                    letterSpacing: -0.2,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, color: Color(0xFF10B981), size: 6),
                      SizedBox(width: 4),
                      Text(
                        'LIVE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${gig.title} (${gig.startTime} - ${gig.endTime}) 🎉',
                  style: const TextStyle(
                    color: Color(0xFF0F172A),
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  gig.description.isNotEmpty
                      ? gig.description
                      : 'Special Gig - you can go online even now',
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                InkWell(
                  onTap: () {},
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Know more',
                        style: TextStyle(
                          color: Color(0xFF0F172A),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      Icon(Icons.arrow_right_rounded, color: Color(0xFF0F172A), size: 18),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F172A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    onPressed: onBookTap,
                    child: const Text(
                      'Book and go online now',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, letterSpacing: -0.2),
                    ),
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

class _TodaysProgressCard extends StatelessWidget {
  const _TodaysProgressCard({
    required this.earnings,
    required this.trips,
    required this.sessions,
    required this.gigsHistory,
  });

  final String earnings;
  final String trips;
  final String sessions;
  final String gigsHistory;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x080F172A),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
            decoration: const BoxDecoration(
              color: Color(0xFF0F172A),
            ),
            child: const Row(
              children: [
                Icon(Icons.calendar_today_rounded, color: Colors.white, size: 14),
                SizedBox(width: 8),
                Text(
                  "Today's progress",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    letterSpacing: -0.2,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Column(
              children: [
                // ROW 1: Earnings & Trips
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            earnings,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF059669),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Row(
                            children: [
                              Text(
                                'Earnings ',
                                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                              ),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF64748B)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trips,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Row(
                            children: [
                              Text(
                                'Trips ',
                                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                              ),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF64748B)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // ROW 2: Sessions & History
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            sessions,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Row(
                            children: [
                              Text(
                                'Sessions ',
                                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                              ),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF64748B)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            gigsHistory,
                            style: GoogleFonts.inter(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF0F172A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 2),
                          const Row(
                            children: [
                              Text(
                                'History ',
                                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF64748B)),
                              ),
                              Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF64748B)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AllOffersSectionCard extends StatelessWidget {
  const _AllOffersSectionCard({
    required this.gigs,
    required this.onSeeAll,
  });

  final List<GigInfo> gigs;
  final VoidCallback onSeeAll;

  @override
  Widget build(BuildContext context) {
    final gig = gigs.isNotEmpty ? gigs.first : null;
    final title = gig != null ? gig.title : 'Store Peak Hour Bonus';
    final dateSub = gig != null ? '${gig.dateString} • ${gig.startTime} - ${gig.endTime}' : 'Active Store Incentive';
    final bonusMax = gig != null ? '\u20B9${gig.bonusAmount}' : '\u20B9150';

    final List<GigTierInfo> tiersList = (gig != null && gig.tiers.isNotEmpty)
        ? gig.tiers
        : (gig != null
            ? [
                GigTierInfo(
                  minTarget: gig.type == 'hours_bonus'
                      ? gig.targetHours
                      : (gig.targetEarnings > 0 ? gig.targetEarnings : 500),
                  bonusAmount: gig.bonusAmount > 0 ? gig.bonusAmount : 150,
                )
              ]
            : const [
                GigTierInfo(minTarget: 200, bonusAmount: 30),
                GigTierInfo(minTarget: 400, bonusAmount: 80),
                GigTierInfo(minTarget: 600, bonusAmount: 150),
              ]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'All offers',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
                letterSpacing: -0.3,
              ),
            ),
            InkWell(
              onTap: onSeeAll,
              child: const Row(
                children: [
                  Text(
                    'See All ',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  Icon(Icons.arrow_forward_rounded, size: 14, color: Color(0xFF0F172A)),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0F0F172A),
                blurRadius: 18,
                offset: Offset(0, 6),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: const BoxDecoration(
                  color: Color(0xFF0F172A),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            dateSub,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          bonusMax,
                          style: const TextStyle(
                            color: Color(0xFF10B981),
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                        const Text(
                          'Extra',
                          style: TextStyle(
                            color: Colors.white54,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(
                            width: 68,
                            child: Text(
                              'Incentive',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: tiersList.map((t) => Text(
                                '\u20B9${t.bonusAmount}',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF10B981),
                                ),
                              )).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(height: 2, color: const Color(0xFFE2E8F0)),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: tiersList.map((_) => Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.lock_rounded, size: 14, color: Color(0xFF94A3B8)),
                          )).toList(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const SizedBox(
                          width: 68,
                          child: Text(
                            'Earnings',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ),
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: tiersList.map((t) => Text(
                              '\u20B9${t.minTarget}',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            )).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FullWidthPromoCard extends StatelessWidget {
  const _FullWidthPromoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.background,
    required this.iconBackground,
    required this.iconColor,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final LineIconName icon;
  final Color background;
  final Color iconBackground;
  final Color iconColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBackground,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: LineIcon(icon, size: 24, color: iconColor),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              LineIcon(
                LineIconName.chevronRight,
                size: 20,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _IncomingOrderCard extends StatefulWidget {
  const _IncomingOrderCard({
    required this.title,
    required this.pickUpLabel,
    required this.dropOffLabel,
    required this.distanceLabel,
    required this.earningsAmount,
    required this.earningsLabel,
    required this.acceptLabel,
  });

  final String title;
  final String pickUpLabel;
  final String dropOffLabel;
  final String distanceLabel;
  final String earningsAmount;
  final String earningsLabel;
  final String acceptLabel;

  @override
  State<_IncomingOrderCard> createState() => _IncomingOrderCardState();
}

class _IncomingOrderCardState extends State<_IncomingOrderCard> {
  static const _totalSeconds = 30;
  late int _secondsLeft;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _secondsLeft = _totalSeconds;
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (_secondsLeft <= 0) {
        _timer?.cancel();
        return;
      }
      setState(() => _secondsLeft--);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String get _timerLabel {
    final m = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final s = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _OrderTimelineRail(),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          widget.pickUpLabel,
                          style: Theme.of(context).textTheme.labelSmall,
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            widget.distanceLabel,
                            style: Theme.of(context)
                                .textTheme
                                .labelSmall
                                ?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w600,
                                ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'DMart Store',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(
                      'Kothrud, Pune',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Text(
                      widget.dropOffLabel,
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Rahul Sharma',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(
                      'Baner, Pune',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              SizedBox(
                width: 108,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      widget.earningsAmount,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text(
                      widget.earningsLabel,
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.end,
                    ),
                    const SizedBox(height: AppSpacing.md),
                    SizedBox(
                      width: double.infinity,
                      height: 40,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: EdgeInsets.zero,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          widget.acceptLabel,
                          style: Theme.of(context)
                              .textTheme
                              .labelMedium
                              ?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      _timerLabel,
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActiveDeliveryCard extends StatelessWidget {
  const _ActiveDeliveryCard({
    required this.onOpen,
    required this.continueLabel,
  });

  final VoidCallback onOpen;
  final String continueLabel;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return DashboardCard(
      onTap: onOpen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.currentOrder,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _OrderTimelineRail(),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.pickUp, style: Theme.of(context).textTheme.labelSmall),
                    Text(
                      'DMart Store',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text('Kothrud, Pune', style: Theme.of(context).textTheme.bodySmall),
                    const SizedBox(height: AppSpacing.md),
                    Text(l10n.dropOff, style: Theme.of(context).textTheme.labelSmall),
                    Text(
                      'Rahul Sharma',
                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    Text('Baner, Pune', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: onOpen,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: Text(
                continueLabel,
                style: Theme.of(context).textTheme.labelLarge?.copyWith(
                      color: Colors.white,
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OrderTimelineRail extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 16,
      child: Column(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
            ),
          ),
          Container(
            width: 2,
            height: 52,
            margin: const EdgeInsets.symmetric(vertical: 2),
            child: CustomPaint(
              painter: _DashedLinePainter(color: AppColors.border),
            ),
          ),
          Container(
            width: 10,
            height: 10,
            decoration: const BoxDecoration(
              color: Color(0xFFF59E0B),
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}

class _DashedLinePainter extends CustomPainter {
  _DashedLinePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2;
    const dashHeight = 4.0;
    const gap = 3.0;
    var y = 0.0;
    while (y < size.height) {
      canvas.drawLine(
        Offset(size.width / 2, y),
        Offset(size.width / 2, y + dashHeight),
        paint,
      );
      y += dashHeight + gap;
    }
  }

  @override
  bool shouldRepaint(covariant _DashedLinePainter oldDelegate) =>
      oldDelegate.color != color;
}

class _QuickActionsRow extends StatelessWidget {
  const _QuickActionsRow({
    required this.myOrdersLabel,
    required this.earningsLabel,
    required this.incentivesLabel,
    required this.supportLabel,
    required this.profileLabel,
    required this.onMyOrders,
    required this.onEarnings,
    required this.onIncentives,
    required this.onSupport,
    required this.onProfile,
  });

  final String myOrdersLabel;
  final String earningsLabel;
  final String incentivesLabel;
  final String supportLabel;
  final String profileLabel;
  final VoidCallback onMyOrders;
  final VoidCallback onEarnings;
  final VoidCallback onIncentives;
  final VoidCallback onSupport;
  final VoidCallback onProfile;

  @override
  Widget build(BuildContext context) {
    final items = [
      (LineIconName.receipt, myOrdersLabel, onMyOrders),
      (LineIconName.wallet, earningsLabel, onEarnings),
      (LineIconName.trophy, incentivesLabel, onIncentives),
      (LineIconName.headset, supportLabel, onSupport),
      (LineIconName.person, profileLabel, onProfile),
    ];

    return Row(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: _QuickActionTile(
              icon: items[i].$1,
              label: items[i].$2,
              onTap: items[i].$3,
            ),
          ),
        ],
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final LineIconName icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      onTap: onTap,
      padding: const EdgeInsets.symmetric(
        vertical: AppSpacing.md,
        horizontal: AppSpacing.xs,
      ),
      child: Column(
        children: [
          LineIcon(icon, size: 22, color: AppColors.primary),
          const SizedBox(height: 6),
          Text(
            label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
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
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primarySoft),
      ),
      child: Row(
        children: [
          LineIcon(LineIconName.verified, size: 20, color: AppColors.primary),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
// â”€â”€â”€ Verification notice (unchanged logic) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
