import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/location_service.dart';
import '../../../data/services/order_service.dart';
import '../../../data/services/rider_live_service.dart';
import '../../../data/services/shift_service.dart';
import '../../../l10n/app_localizations.dart';
import '../shifts/select_shift_screen.dart';
import '../../widgets/dialogs/order_dispatch_dialog.dart';

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
  TodayProgressData _todayProgress = TodayProgressData.fallback;
  bool _loadingProgress = false;

  Future<void> _fetchTodayProgress() async {
    if (_loadingProgress) return;
    setState(() => _loadingProgress = true);
    try {
      final data = await RiderLiveService.instance.fetchTodayProgress();
      if (mounted) {
        setState(() {
          _todayProgress = data;
          _loadingProgress = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _todayProgress = TodayProgressData.fallback;
          _loadingProgress = false;
        });
      }
    }
  }

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
    _loadGigsData();
    _fetchTodayProgress();
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
    if (!_isOnline || _hasActiveOrder || _isShowingOffer) return;
    try {
      final offer = await OrderService.instance.checkForOffer();
      if (offer != null && mounted && !_isShowingOffer) {
        _isShowingOffer = true;
        await OrderDispatchDialog.show(
          context,
          offer: offer,
          onAccept: () async {
            final ok = await OrderService.instance.acceptOffer(offer.orderId);
            if (ok && mounted) {
              await AuthService.instance.fetchMe();
              if (mounted) {
                setState(() {
                  _isOnline = true;
                });
                Navigator.pushNamed(context, AppRoutes.activeDelivery);
              }
            }
          },
          onDecline: () async {
            await OrderService.instance.declineOffer(offer.orderId);
          },
        );
        _isShowingOffer = false;
      }
    } catch (_) {
      _isShowingOffer = false;
    }
  }

  Future<void> _refreshVerificationInfo() async {
    final boy = await AuthService.instance.fetchMe();
    if (!mounted) return;

    final status = boy?.verificationStatus ?? 'pending';
    if (_lastVerificationStatus == 'pending' && status == 'approved') {
      setState(() {
        _showVerifiedBanner = true;
      });
      Future.delayed(const Duration(seconds: 5), () {
        if (mounted) setState(() => _showVerifiedBanner = false);
      });
    }
    _lastVerificationStatus = status;
    setState(() {});

    if (boy != null && (boy.isVerificationPending || status == 'rejected')) {
      _fetchAreaManagerDetails();
    }
  }

  Future<void> _fetchAreaManagerDetails() async {
    if (_loadingManager) return;
    setState(() => _loadingManager = true);
    final mgr =
        _areaManager ?? await AuthService.instance.fetchAreaManager();
    if (mounted) {
      setState(() {
        _areaManager = mgr;
        _loadingManager = false;
      });
    }
  }

  Future<void> _loadLiveData() async {
    await RiderLiveService.instance.refreshLoginHours();
    if (mounted) {
      await RiderLiveService.instance.refreshPeakHours('store_1');
      setState(() {});
    }
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
    _heartbeat = Timer.periodic(const Duration(seconds: 30), (_) {
      AuthService.instance.sendHeartbeat();
    });
  }

  void _stopHeartbeat() {
    _heartbeat?.cancel();
    _heartbeat = null;
  }

  Future<void> _onStatusToggle() async {
    if (_updatingStatus) return;

    final targetOnline = !_isOnline;

    if (targetOnline) {
      final isVerified =
          AuthService.instance.deliveryBoy?.isVerified ?? false;
      if (!isVerified) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Account verification required to go online.'),
            backgroundColor: AppColors.warning,
          ),
        );
        return;
      }
    }

    setState(() => _updatingStatus = true);

    try {
      if (targetOnline) {
        final pos = await LocationService.instance.getCurrentLocation();
        final lat = pos?.latitude ?? 18.559;
        final lng = pos?.longitude ?? 73.7868;

        final res = await ShiftService.instance.goOnlineWithLocation(lat, lng);

        if (!mounted) return;

        if (res.success) {
          setState(() {
            _isOnline = true;
          });
          _startHeartbeat();
          _startOfferPoll();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res.message),
              backgroundColor: AppColors.success,
            ),
          );
        } else {
          setState(() {
            _isOnline = false;
          });

          if (res.code == 'SHIFT_REQUIRED') {
            _showShiftRequiredDialog(res.message);
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(res.message),
                backgroundColor: AppColors.error,
                duration: const Duration(seconds: 4),
              ),
            );
          }
        }
      } else {
        final ok = await ShiftService.instance.goOffline();
        if (!mounted) return;

        if (ok) {
          setState(() {
            _isOnline = false;
          });
          _stopHeartbeat();
          _stopOfferPoll();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('You are now Offline.'),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Failed to update status.'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _updatingStatus = false);
      }
    }
  }

  void _showShiftRequiredDialog(String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(Icons.schedule_rounded, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(
              'Shift Slot Required',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Text(
          message,
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const SelectShiftScreen()),
              );
            },
            child: const Text('Book Shift Slot'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Column(
      children: [
        // FIXED / STICKY TOP HEADER
        Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.md,
            MediaQuery.of(context).padding.top + AppSpacing.xs,
            AppSpacing.md,
            AppSpacing.xs,
          ),
          child: _TopHeaderSection(
            name: _partnerName,
            isOnline: _isOnline,
            isVerified: AuthService.instance.deliveryBoy?.isVerified ?? false,
            onProfileTap: () => Navigator.pushNamed(context, AppRoutes.profile),
            onDrawerTap: () => Scaffold.of(context).openDrawer(),
          ),
        ),

        // SCROLLABLE CONTENT BETWEEN HEADER AND BOTTOM BAR
        Expanded(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.md,
              AppSpacing.xs,
              AppSpacing.md,
              AppSpacing.xl * 2,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // VERIFICATION NOTICE IF PENDING / REJECTED
                if (_showVerifiedBanner) ...[
                  _VerifiedBanner(text: l10n.verificationApprovedToast),
                  const SizedBox(height: 14),
                ],
                if (_verificationPending ||
                    AuthService.instance.deliveryBoy?.verificationStatus == 'rejected') ...[
                  _VerificationNoticeCard(
                    pending: _verificationPending,
                    rejected: AuthService.instance.deliveryBoy?.verificationStatus == 'rejected',
                    manager: _areaManager,
                    loading: _loadingManager,
                  ),
                  const SizedBox(height: 14),
                ],

                // ACTIVE ORDER CARD IF ON DELIVERY
                if (_hasActiveOrder) ...[
                  _ActiveDeliveryCard(
                    onOpen: () => Navigator.pushNamed(context, AppRoutes.activeDelivery),
                    continueLabel: l10n.continueDelivery,
                  ),
                  const SizedBox(height: 14),
                ],

                // 2. FEATURED INCENTIVE / GIG BANNER CARD (Only shown if backend has registered gigs for the store)
                if (_homeGigs.isNotEmpty) ...[
                  _FeaturedGigBannerCard(
                    gig: _homeGigs.first,
                    totalGigsCount: _homeGigs.length,
                    onViewGigs: () => Navigator.pushNamed(context, AppRoutes.gigs),
                    onBookAndGoOnline: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => SelectShiftScreen(
                          onBookingDone: _fetchTodayProgress,
                        ),
                      ),
                    ).then((_) => _fetchTodayProgress()),
                  ),
                  const SizedBox(height: 14),
                ],

                // 3. GO ONLINE DIRECT BANNER CARD
                _GoOnlineBannerCard(
                  isOnline: _isOnline,
                  updatingStatus: _updatingStatus,
                  onStatusToggle: _onStatusToggle,
                ),
                const SizedBox(height: 18),

                // 4. TODAY'S PROGRESS SECTION
                _TodaysProgressSectionCard(
                  data: _todayProgress,
                  isLoading: _loadingProgress,
                  onViewAll: () => Navigator.pushNamed(context, AppRoutes.earnings),
                ),
                const SizedBox(height: 18),

                // 5. INCENTIVE PROGRESS & BONUS LEVELS CARD (Only shown if backend has registered gigs for the store)
                if (_homeGigs.isNotEmpty) ...[
                  _LiveGigIncentiveProgressCard(
                    gig: _homeGigs.first,
                  ),
                  const SizedBox(height: 14),
                ],

                // 6. PROMOTIONAL ACTION CARDS
                _PromotionalActionCards(
                  onExploreBonuses: () => Navigator.pushNamed(context, AppRoutes.earnings),
                  onReferNow: () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Referral link copied to clipboard!')),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// 1. Top Header with Menu Button, Name, Verified Tick, Offline/Online status & Avatar
class _TopHeaderSection extends StatelessWidget {
  const _TopHeaderSection({
    required this.name,
    required this.isOnline,
    required this.isVerified,
    required this.onProfileTap,
    required this.onDrawerTap,
  });

  final String name;
  final bool isOnline;
  final bool isVerified;
  final VoidCallback onProfileTap;
  final VoidCallback onDrawerTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Drawer Hamburger Menu Icon
        InkWell(
          onTap: onDrawerTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.all(4.0),
            child: Icon(Icons.menu_rounded, size: 28, color: AppColors.textPrimary),
          ),
        ),
        const SizedBox(width: 12),

        // Name + Verified Tick Icon & Status Pill
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      name,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        height: 1.2,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isVerified) ...[
                    const SizedBox(width: 6),
                    // Verified Checkmark Tick Badge (Only shown when rider verification is approved)
                    const Icon(
                      Icons.verified_rounded,
                      color: Color(0xFF059669),
                      size: 19,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 4),
              // Status Pill Tag
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: isOnline
                      ? (ThemeController.instance.isDark ? const Color(0xFF064E3B) : const Color(0xFFDCFCE7))
                      : (ThemeController.instance.isDark ? const Color(0xFF1E293B) : const Color(0xFFF3F4F6)),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isOnline
                        ? (ThemeController.instance.isDark ? const Color(0xFF047857) : const Color(0xFF86EFAC))
                        : (ThemeController.instance.isDark ? const Color(0xFF334155) : const Color(0xFFE5E7EB)),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF34D399) : const Color(0xFF9CA3AF),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? AppLocalizations.of(context).online : AppLocalizations.of(context).offline,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOnline
                            ? (ThemeController.instance.isDark ? const Color(0xFF6EE7B7) : const Color(0xFF15803D))
                            : (ThemeController.instance.isDark ? const Color(0xFFCBD5E1) : const Color(0xFF4B5563)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Profile Avatar with Green Border Ring
        GestureDetector(
          onTap: onProfileTap,
          child: Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primary, width: 2),
              image: DecorationImage(
                image: AssetImage(AppAssets.deliveryScooter),
                fit: BoxFit.cover,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// 2. Featured Incentive Banner Card (Lunch Incentive / Gig)
class _FeaturedGigBannerCard extends StatelessWidget {
  const _FeaturedGigBannerCard({
    required this.gig,
    required this.totalGigsCount,
    required this.onViewGigs,
    required this.onBookAndGoOnline,
  });

  final GigInfo? gig;
  final int totalGigsCount;
  final VoidCallback onViewGigs;
  final VoidCallback onBookAndGoOnline;

  @override
  Widget build(BuildContext context) {
    final rawTitle = gig?.title ?? 'Lunch Incentive';
    final title = rawTitle.toLowerCase().contains('lunch')
        ? AppLocalizations.of(context).lunchIncentive
        : rawTitle.toLowerCase().contains('dinner')
            ? AppLocalizations.of(context).dinnerIncentive
            : rawTitle;
    final timeStr = gig != null
        ? '${gig!.startTime} - ${gig!.endTime}'
        : '05:00 PM - 07:00 PM';
    final bonus = gig?.bonusAmount ?? 180;
    final desc = (gig?.description.isNotEmpty == true)
        ? gig!.description
        : AppLocalizations.of(context).specialGigDesc;
    final bool hasMultipleGigs = totalGigsCount > 1;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: Color(0xFF047857),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Icon(Icons.star_rounded, color: Color(0xFFFACC15), size: 26),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time_outlined,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          timeStr,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      AppLocalizations.of(context).earnUpToExtra('$_kRupee$bonus'),
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF047857),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      desc,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    side: BorderSide(
                      color: hasMultipleGigs ? const Color(0xFF059669) : const Color(0xFFE2E8F0),
                      width: 1.5,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: hasMultipleGigs ? onViewGigs : null,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppLocalizations.of(context).viewAllGigs,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: hasMultipleGigs ? const Color(0xFF059669) : const Color(0xFF94A3B8),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Icon(
                          Icons.chevron_right_rounded,
                          size: 18,
                          color: hasMultipleGigs ? const Color(0xFF059669) : const Color(0xFF94A3B8),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF047857),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  onPressed: onBookAndGoOnline,
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.center,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          AppLocalizations.of(context).bookAndGoOnline,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.chevron_right_rounded, size: 18, color: Colors.white),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// 3. Go Online Direct Banner Card
class _GoOnlineBannerCard extends StatelessWidget {
  const _GoOnlineBannerCard({
    required this.isOnline,
    required this.updatingStatus,
    required this.onStatusToggle,
  });

  final bool isOnline;
  final bool updatingStatus;
  final VoidCallback onStatusToggle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
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
                  isOnline
                      ? AppLocalizations.of(context).youAreOnline
                      : AppLocalizations.of(context).goOnlineToReceiveOrders,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.25,
                  ),
                ),
                const SizedBox(height: 6),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shopping_bag_outlined, size: 13, color: Color(0xFF047857)),
                          const SizedBox(width: 3),
                          Text(
                            AppLocalizations.of(context).moreOrders,
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 5),
                        child: Text(
                          '|',
                          style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFFCBD5E1)),
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 14,
                            height: 14,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(color: const Color(0xFF047857), width: 1),
                            ),
                            child: const Center(
                              child: Text(
                                '₹',
                                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF047857), height: 1),
                              ),
                            ),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            AppLocalizations.of(context).moreEarnings,
                            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: isOnline ? const Color(0xFFDC2626) : const Color(0xFF047857),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: updatingStatus ? null : onStatusToggle,
            child: updatingStatus
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(5),
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.power_settings_new_rounded,
                          color: isOnline ? const Color(0xFFDC2626) : const Color(0xFF047857),
                          size: 16,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isOnline ? AppLocalizations.of(context).goOffline : AppLocalizations.of(context).goOnline,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
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

/// 4. Today's Progress Section Card (5 Metrics, 3 Rows)
class _TodaysProgressSectionCard extends StatelessWidget {
  const _TodaysProgressSectionCard({
    required this.data,
    required this.isLoading,
    required this.onViewAll,
  });

  final TodayProgressData data;
  final bool isLoading;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    final earningsStr = '₹${data.todayEarnings}';
    final tripsStr = '${data.completedTrips} ${data.completedTrips == 1 ? 'Trip' : 'Trips'}';
    final onlineStr = data.onlineTime;
    final shiftsStr = '${data.bookedShifts} ${data.bookedShifts == 1 ? 'Shift' : 'Shifts'}';
    final completedStr = '${data.completedShifts} Completed';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                l10n.todaysProgress,
                style: GoogleFonts.inter(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            InkWell(
              onTap: onViewAll,
              child: Row(
                children: [
                  Text(
                    l10n.viewAll,
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF059669),
                    ),
                  ),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: Color(0xFF059669),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E7EB)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: isLoading
              ? const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                  ),
                )
              : Column(
                  children: [
                    // ROW 1: Today's Earnings & Today's Trips
                    Row(
                      children: [
                        Expanded(
                          child: _MetricTile(
                            value: earningsStr,
                            label: l10n.todaysEarnings,
                          ),
                        ),
                        const _VerticalDivider(),
                        Expanded(
                          child: _MetricTile(
                            value: tripsStr,
                            label: l10n.trips,
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1, color: Color(0xFFF3F4F6)),
                    ),

                    // ROW 2: Today's Online Session & Today's Shifts Booked
                    Row(
                      children: [
                        Expanded(
                          child: _MetricTile(
                            value: onlineStr,
                            label: 'Online Time',
                          ),
                        ),
                        const _VerticalDivider(),
                        Expanded(
                          child: _MetricTile(
                            value: shiftsStr,
                            label: 'Shifts Booked',
                          ),
                        ),
                      ],
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1, color: Color(0xFFF3F4F6)),
                    ),

                    // ROW 3: Today's Completed Shifts
                    Row(
                      children: [
                        Expanded(
                          child: _MetricTile(
                            value: completedStr,
                            label: 'Completed Shifts',
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
        ),
      ],
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: AppColors.textSecondary,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}



class _VerticalDivider extends StatelessWidget {
  const _VerticalDivider();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 32,
      color: AppColors.cardBorder,
      margin: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}

/// 5. Incentive Progress & Bonus Levels Card
class _LiveGigIncentiveProgressCard extends StatelessWidget {
  const _LiveGigIncentiveProgressCard({required this.gig});

  final GigInfo? gig;

  @override
  Widget build(BuildContext context) {
    final title = gig?.title ?? 'Lunch Incentive';
    final tiers = gig?.tiers ?? [];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
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
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Current Earnings',
                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${_kRupee}0 / ${_kRupee}200',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(width: 24),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Current Bonus',
                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '+${_kRupee}18',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF059669),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  color: ThemeController.instance.isDark ? const Color(0xFF064E3B) : const Color(0xFFF0FDF4),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: Text('🎯🪙', style: TextStyle(fontSize: 34)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: 0.05,
              minHeight: 6,
              backgroundColor: AppColors.cardSubBorder,
              color: const Color(0xFF059669),
            ),
          ),
          const SizedBox(height: 8),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'Complete 12 more orders to get +${_kRupee}18 bonus',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textSecondary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '0 / 12 Orders',
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 14),

          Text(
            AppLocalizations.of(context).incentiveSlabsBonusLevels,
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 10),

          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: tiers.isNotEmpty
                  ? tiers.asMap().entries.map((e) {
                      final isFirst = e.key == 0;
                      return _SlabCard(
                        amount: '$_kRupee${e.value.minTarget}',
                        bonus: '+$_kRupee${e.value.bonusAmount}',
                        isSelected: isFirst,
                        isLocked: !isFirst,
                      );
                    }).toList()
                  : const [
                      _SlabCard(amount: '₹200', bonus: '+₹18', isSelected: true, isLocked: false),
                      _SlabCard(amount: '₹400', bonus: '+₹60', isSelected: false, isLocked: true),
                      _SlabCard(amount: '₹600', bonus: '+₹100', isSelected: false, isLocked: true),
                      _SlabCard(amount: '₹800', bonus: '+₹140', isSelected: false, isLocked: true),
                      _SlabCard(amount: '₹1000', bonus: '+₹180', isSelected: false, isLocked: true),
                    ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlabCard extends StatelessWidget {
  const _SlabCard({
    required this.amount,
    required this.bonus,
    required this.isSelected,
    this.isLocked = true,
  });

  final String amount;
  final String bonus;
  final bool isSelected;
  final bool isLocked;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isSelected
            ? (ThemeController.instance.isDark ? const Color(0xFF064E3B) : const Color(0xFFF0FDF4))
            : (isLocked ? AppColors.cardSubBg : AppColors.cardBackground),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isSelected
              ? (ThemeController.instance.isDark ? const Color(0xFF10B981) : const Color(0xFF059669))
              : AppColors.cardSubBorder,
          width: isSelected ? 1.5 : 1,
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isLocked) ...[
                const Icon(
                  Icons.lock_rounded,
                  size: 11,
                  color: Color(0xFF94A3B8),
                ),
                const SizedBox(width: 3),
              ],
              Text(
                amount,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isLocked ? AppColors.textMuted : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            bonus,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isLocked ? const Color(0xFF059669).withValues(alpha: 0.7) : const Color(0xFF059669),
            ),
          ),
        ],
      ),
    );
  }
}

/// 6. Promotional Action Cards
class _PromotionalActionCards extends StatelessWidget {
  const _PromotionalActionCards({
    required this.onExploreBonuses,
    required this.onReferNow,
  });

  final VoidCallback onExploreBonuses;
  final VoidCallback onReferNow;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadow,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('🎁', style: TextStyle(fontSize: 30)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.earnBonusTitle,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF047857),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          l10n.earnBonusSubtitle,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    side: const BorderSide(color: Color(0xFF059669), width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  onPressed: onExploreBonuses,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        l10n.exploreBonuses,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF059669)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.cardBackground,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: [
              BoxShadow(
                color: AppColors.shadow,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('📣', style: TextStyle(fontSize: 30)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.referAndEarnTitle,
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1D4ED8),
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          l10n.referAndEarnSubtitle,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    side: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  onPressed: onReferNow,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        l10n.referNow,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2563EB),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(Icons.chevron_right_rounded, size: 16, color: Color(0xFF2563EB)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(
              color: Color(0xFF2563EB),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.two_wheeler_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delivery in Progress',
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E40AF),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Tap to view order details & navigation',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF1D4ED8),
                  ),
                ),
              ],
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: onOpen,
            child: Text(
              continueLabel,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
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
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFECFDF5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFA7F3D0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF059669)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: const Color(0xFF065F46),
              ),
            ),
          ),
        ],
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = rejected
        ? (isDark ? const Color(0xFF3F1D1D) : const Color(0xFFFEF2F2))
        : (isDark ? const Color(0xFF3B2F14) : const Color(0xFFFFFBEB));
    final border = rejected ? const Color(0xFFFECACA) : const Color(0xFFFDE68A);
    final iconColor = rejected ? AppColors.error : AppColors.warning;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
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
                      ? AppLocalizations.of(context).verificationRejectedTitle
                      : AppLocalizations.of(context).verificationPendingTitle,
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
              AppLocalizations.of(context).verificationPendingBody,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              AppLocalizations.of(context).verificationPendingDarkStoreHint,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ] else if (rejected) ...[
            Text(
              AppLocalizations.of(context).verificationRejectedBody,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.error,
                  ),
            ),
          ],
          if (loading) ...[
            const SizedBox(height: AppSpacing.md),
            const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ] else if (manager != null) ...[
            const SizedBox(height: AppSpacing.md),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.storefront_rounded, size: 18, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(
                        manager!.storeName,
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    manager!.storeAddress,
                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
