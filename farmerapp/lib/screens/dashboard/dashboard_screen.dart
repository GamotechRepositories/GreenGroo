import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../crops/add_crop_screen.dart';
import '../crops/crop_planning_screen.dart';
import '../products/add_product_screen.dart';
import '../notifications/notifications_screen.dart';
import '../documents/documents_screen.dart';
import '../schemes/schemes_screen.dart';
import '../main_shell.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isScrolled = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final scrolled = _scrollController.hasClients && _scrollController.offset > 24;
    if (scrolled != _isScrolled) {
      setState(() => _isScrolled = scrolled);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _makePhoneCall(String phone) async {
    final cleanPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (cleanPhone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('फोन नंबर उपलब्ध नाही')),
      );
      return;
    }
    final uri = Uri.parse('tel:$cleanPhone');
    try {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('कॉल करता आला नाही: $cleanPhone')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final state = FarmerState();
        final profile = state.profile;
        final crops = state.crops;
        final products = state.products;

        final liveOrders = state.orders.where((o) {
          final s = o.status.toUpperCase();
          return s != 'DELETED' && s != 'DELETED_ORDER';
        }).toList();

        // Real order status counts
        final newOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'NEW' || s == 'PENDING';
        }).length;

        final acceptedOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'ACCEPTED' || s == 'CONFIRMED';
        }).length;

        final preparingOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'PREPARING' || s == 'PACKING';
        }).length;

        final readyPickupOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'READY_FOR_PICKUP' || s.contains('READY');
        }).length;

        final completedOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'COMPLETED' || s == 'DELIVERED';
        }).length;

        final rejectedOrdersCount = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'REJECTED' || s == 'CANCELLED';
        }).length;

        final settledOrders = liveOrders.where(_isEarningOrder).toList();
        final totalEarned = settledOrders.fold<double>(0, (sum, o) => sum + _orderAmount(o));
        final pendingEarned = settledOrders.where((o) => !_isPaidOrder(o)).fold<double>(0, (sum, o) => sum + _orderAmount(o));

        // Real monthly earnings calculation
        final now = DateTime.now();
        final thisMonthOrders = settledOrders.where((o) {
          if (o.createdAt.isEmpty) return true;
          try {
            final d = DateTime.parse(o.createdAt);
            return d.year == now.year && d.month == now.month;
          } catch (_) {
            return true;
          }
        }).toList();
        final monthlyEarned = thisMonthOrders.fold<double>(0, (sum, o) => sum + _orderAmount(o));
        final paidEarned = liveOrders.where(_isPaidOrder).fold<double>(0, (sum, o) => sum + _orderAmount(o));

        final totalStock = state.totalStockKg;

        // Real profile details
        final firstName = profile.fullName.trim().isEmpty ? 'शेतकरी' : profile.fullName.trim().split(RegExp(r'\s+')).first;
        final placeParts = [profile.village, profile.taluka].where((part) => part.trim().isNotEmpty).toList();
        final place = placeParts.isNotEmpty
            ? placeParts.join(', ')
            : (profile.district.trim().isNotEmpty ? profile.district.trim() : 'स्थान नोंदणी बाकी');

        final acres = profile.totalAcres;
        final acreText = acres > 0
            ? (acres == acres.roundToDouble() ? acres.toInt().toString() : acres.toStringAsFixed(1))
            : '0';

        final totalCropsCount = crops.length;
        final kyc = profile.kycStatus.trim().toUpperCase();
        final kycVerified = kyc.contains('VERIF') || kyc.contains('APPROV');

        // Real formatted metric values
        final totalProductsVal = '${products.length}';
        final harvestOrdersVal = '${liveOrders.length}';
        final totalStockVal = totalStock > 0 ? '${totalStock.toStringAsFixed(0)} Kg' : '0 Kg';
        final totalEarningsVal = '₹ ${_formatRupees(totalEarned)}';
        final pendingPayoutVal = '₹ ${_formatRupees(pendingEarned)}';
        final paidPayoutVal = '₹ ${_formatRupees(paidEarned)}';
        final monthlyEarningsVal = '₹ ${_formatRupees(monthlyEarned)}';

        // Real pickup orders
        final pickupOrders = liveOrders.where((o) {
          final s = o.status.toUpperCase();
          return s == 'READY_FOR_PICKUP' || s.contains('READY') || s == 'ACCEPTED';
        }).toList();

        final topPadding = MediaQuery.of(context).padding.top;
        final heroHeight = topPadding + kToolbarHeight + 138.0;

        return Scaffold(
          backgroundColor: const Color(0xFFF6F8F5),
          extendBodyBehindAppBar: true,
          appBar: AppBar(
            backgroundColor: _isScrolled ? Colors.white : Colors.transparent,
            elevation: _isScrolled ? 2.5 : 0,
            shadowColor: Colors.black.withValues(alpha: 0.08),
            surfaceTintColor: Colors.transparent,
            systemOverlayStyle: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
            ),
            leading: IconButton(
              icon: const Icon(Icons.menu_rounded, color: Color(0xFF1F2937), size: 26),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            titleSpacing: 0,
            title: Row(
              children: [
                InkWell(
                  onTap: () => MainShell.setTab(context, 4),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: profile.profilePhoto.trim().isNotEmpty
                            ? const Color(0xFF16A34A)
                            : const Color(0xFFC8E6C9),
                        width: 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: profile.profilePhoto.trim().isNotEmpty
                        ? AppImageWidget(
                            imageStr: profile.profilePhoto,
                            width: 38,
                            height: 38,
                            fit: BoxFit.cover,
                            fallback: const Center(
                              child: Icon(Icons.person_rounded, color: Color(0xFF16A34A), size: 22),
                            ),
                          )
                        : const Center(
                            child: Icon(Icons.agriculture_rounded, color: Color(0xFF16A34A), size: 22),
                          ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        'GreenGrocc Farmer',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1F2937),
                          letterSpacing: -0.2,
                        ),
                      ),
                      Text(
                        'स्वागत आहे, $firstName',
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF6B7280),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                    },
                    icon: const Icon(Icons.notifications_outlined, color: Color(0xFF1F2937), size: 26),
                    tooltip: 'सूचना (Notifications)',
                  ),
                  if (state.unreadNotificationCount > 0)
                    Positioned(
                      top: 10,
                      right: 11,
                      child: Container(
                        width: 9,
                        height: 9,
                        decoration: const BoxDecoration(
                          color: Color(0xFFDC2626),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 6),
            ],
          ),
          body: SingleChildScrollView(
            controller: _scrollController,
            padding: EdgeInsets.zero,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. HERO BANNER WITH FARMER BACKGROUND
                Container(
                  width: double.infinity,
                  height: heroHeight,
                  margin: EdgeInsets.zero,
                  padding: EdgeInsets.zero,
                  decoration: const BoxDecoration(
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
                  ),
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Background image from assets
                        Image.asset(
                          'assets/images/farmer_hero_bg.jpg',
                          fit: BoxFit.cover,
                          alignment: const Alignment(0.65, -0.65),
                          errorBuilder: (context, error, stackTrace) => Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFFE8F5E9), Color(0xFF81C784)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                          ),
                        ),
                        // Gradient fade overlay for crisp text readability
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                stops: const [0.0, 0.46, 0.78, 1.0],
                                colors: [
                                  Colors.white.withValues(alpha: 0.96),
                                  Colors.white.withValues(alpha: 0.88),
                                  Colors.white.withValues(alpha: 0.20),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                        // Hero Content positioned neatly below navbar
                        Padding(
                          padding: EdgeInsets.fromLTRB(
                            16,
                            topPadding + kToolbarHeight + 4,
                            16,
                            14,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Text(
                                'शेतीतून समृद्धी,\nआपल्या हातातच!',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF14532D),
                                  height: 1.25,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: const [
                                  Icon(Icons.eco_rounded, size: 13, color: Color(0xFF16A34A)),
                                  SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      'चांगले शेती नियोजन, उत्तम उत्पादन,\nआणि अधिक उत्पन्न!',
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF1F2937),
                                        height: 1.35,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.eco, size: 12, color: Color(0xFF16A34A)),
                                  const SizedBox(width: 3),
                                  Container(
                                    width: 32,
                                    height: 2.5,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF16A34A).withValues(alpha: 0.7),
                                      borderRadius: BorderRadius.circular(2),
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
                ),

                // 2. 👨🌾 REAL FARMER + FARM SUMMARY CARD
                Container(
                  margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF0F4725), Color(0xFF165D32)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F4725).withValues(alpha: 0.28),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      // 1. My Farm Section (Real Acres & Real Location)
                      Expanded(
                        flex: 11,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: const [
                                Icon(Icons.eco, color: Color(0xFF86EFAC), size: 13),
                                SizedBox(width: 3),
                                Text(
                                  'माझे शेत',
                                  style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              acres > 0 ? '$acreText Acre' : 'शेती आकार नोंदवा',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: acres > 0 ? 17 : 13,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.location_on, color: Color(0xFF86EFAC), size: 11),
                                const SizedBox(width: 2),
                                Expanded(
                                  child: Text(
                                    place,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white70, fontSize: 9.5),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Divider
                      Container(
                        height: 44,
                        width: 1,
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        color: Colors.white24,
                      ),

                      // 2. Real Crops Count & Crop Badges
                      Expanded(
                        flex: 9,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Row(
                              children: const [
                                Icon(Icons.grass_rounded, color: Color(0xFFFDE047), size: 13),
                                SizedBox(width: 3),
                                Text(
                                  'एकूण पिके',
                                  style: TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '$totalCropsCount',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: crops.isNotEmpty
                                  ? crops.take(3).map((c) => Padding(
                                      padding: const EdgeInsets.only(right: 3),
                                      child: _cropBadge(_getCropEmoji(c.cropName)),
                                    )).toList()
                                  : [
                                      InkWell(
                                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen())),
                                        child: const Text('+ पिक जोडा', style: TextStyle(color: Color(0xFF86EFAC), fontSize: 9, fontWeight: FontWeight.bold)),
                                      ),
                                    ],
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 6),

                      // 3. Real KYC Status Pill Button
                      InkWell(
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => const DocumentsScreen()));
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.08),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                kycVerified ? Icons.check_circle_rounded : Icons.pending_rounded,
                                color: kycVerified ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                                size: 13,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                kycVerified ? 'KYC VERIFIED' : 'KYC PENDING',
                                style: TextStyle(
                                  color: kycVerified ? const Color(0xFF15803D) : const Color(0xFFB45309),
                                  fontSize: 8.5,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.1,
                                ),
                              ),
                              const SizedBox(width: 1),
                              Icon(
                                Icons.chevron_right_rounded,
                                color: kycVerified ? const Color(0xFF15803D) : const Color(0xFFB45309),
                                size: 13,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 3. ⚡ QUICK ACTIONS (जलद कृती)
                _sectionHeader(
                  icon: Icons.flash_on_rounded,
                  iconColor: const Color(0xFFD97706),
                  title: 'QUICK ACTIONS',
                  marathiTitle: 'जलद कृती',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.eco_rounded,
                          iconColor: const Color(0xFF16A34A),
                          bgColor: const Color(0xFFEBF7EE),
                          title: 'Add Crop',
                          subTitle: 'पिक जोडा',
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen())),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.inventory_2_rounded,
                          iconColor: const Color(0xFF2563EB),
                          bgColor: const Color(0xFFEFF6FF),
                          title: 'Add Product',
                          subTitle: 'उत्पादन जोडा',
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen())),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.calendar_month_rounded,
                          iconColor: const Color(0xFFD97706),
                          bgColor: const Color(0xFFFFFBEB),
                          title: 'Crop Planning',
                          subTitle: 'पीक नियोजन',
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanningScreen())),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _ActionCard(
                          icon: Icons.local_shipping_rounded,
                          iconColor: const Color(0xFFDC2626),
                          bgColor: const Color(0xFFFEF2F2),
                          title: 'Ready Pickup',
                          subTitle: 'उचल साठी तयार',
                          onTap: () => MainShell.setTab(context, 2),
                        ),
                      ),
                    ],
                  ),
                ),

                // 4. 📊 REAL FARM OVERVIEW (शेत थेट आढावा)
                _sectionHeader(
                  icon: Icons.analytics_outlined,
                  iconColor: const Color(0xFF16A34A),
                  title: 'FARM OVERVIEW',
                  marathiTitle: 'शेत थेट आढावा',
                  actionLabel: 'View Details',
                  onAction: () => MainShell.setTab(context, 3),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _OverviewStatCard(
                          icon: Icons.inventory_2_outlined,
                          iconColor: const Color(0xFF16A34A),
                          iconBg: const Color(0xFFDCFCE7),
                          label: 'Products',
                          value: totalProductsVal,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _OverviewStatCard(
                          icon: Icons.warehouse_outlined,
                          iconColor: const Color(0xFF059669),
                          iconBg: const Color(0xFFD1FAE5),
                          label: 'Stock',
                          value: totalStockVal,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _OverviewStatCard(
                          icon: Icons.grass_rounded,
                          iconColor: const Color(0xFF2563EB),
                          iconBg: const Color(0xFFDBEAFE),
                          label: 'Crops',
                          value: '$totalCropsCount',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _OverviewStatCard(
                          icon: Icons.agriculture_rounded,
                          iconColor: const Color(0xFFEA580C),
                          iconBg: const Color(0xFFFFEDD5),
                          label: 'Harvest',
                          value: harvestOrdersVal,
                        ),
                      ),
                    ],
                  ),
                ),

                // 5. 📦 REAL ORDERS PIPELINE (ऑर्डर्स स्थिती)
                _sectionHeader(
                  icon: Icons.inventory_rounded,
                  iconColor: const Color(0xFF2563EB),
                  title: 'ORDERS',
                  marathiTitle: 'ऑर्डर्स स्थिती',
                  actionLabel: 'View All →',
                  onAction: () => MainShell.setTab(context, 2),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 6 Real Status Counts Grid (3 columns x 2 rows)
                        Row(
                          children: [
                            Expanded(child: _OrderStatusChip(label: 'New', count: '$newOrdersCount', color: const Color(0xFF2563EB), bgColor: const Color(0xFFEFF6FF))),
                            const SizedBox(width: 6),
                            Expanded(child: _OrderStatusChip(label: 'Accepted', count: '$acceptedOrdersCount', color: const Color(0xFF4F46E5), bgColor: const Color(0xFFEEF2FF))),
                            const SizedBox(width: 6),
                            Expanded(child: _OrderStatusChip(label: 'Preparing', count: '$preparingOrdersCount', color: const Color(0xFFD97706), bgColor: const Color(0xFFFFFBEB))),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Expanded(child: _OrderStatusChip(label: 'Ready Pickup', count: '$readyPickupOrdersCount', color: const Color(0xFFEA580C), bgColor: const Color(0xFFFFEDD5))),
                            const SizedBox(width: 6),
                            Expanded(child: _OrderStatusChip(label: 'Completed', count: '$completedOrdersCount', color: const Color(0xFF16A34A), bgColor: const Color(0xFFEBF7EE))),
                            const SizedBox(width: 6),
                            Expanded(child: _OrderStatusChip(label: 'Rejected', count: '$rejectedOrdersCount', color: const Color(0xFFDC2626), bgColor: const Color(0xFFFEF2F2))),
                          ],
                        ),
                        const SizedBox(height: 10),
                        const Divider(height: 1, color: Color(0xFFF3F4F6)),
                        const SizedBox(height: 10),
                        // Real Latest Order Snapshot (or clear empty message)
                        if (liveOrders.isNotEmpty) ...[
                          Builder(builder: (context) {
                            final latest = liveOrders.first;
                            return Row(
                              children: [
                                Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFEBF7EE),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Center(
                                    child: Text(
                                      _getCropEmoji(latest.productName.isNotEmpty ? latest.productName : latest.cropName),
                                      style: const TextStyle(fontSize: 18),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '#${latest.orderCode.isNotEmpty ? latest.orderCode : latest.id} • ${latest.productName.isNotEmpty ? latest.productName : latest.cropName}',
                                        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        '${latest.quantity} ${latest.unit} • ₹ ${_formatRupees(latest.totalAmount)} • ${latest.status}',
                                        style: const TextStyle(fontSize: 9.5, color: Color(0xFF6B7280)),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                                InkWell(
                                  onTap: () => MainShell.setTab(context, 2),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF16A34A),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Text(
                                      'Manage',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }),
                        ] else ...[
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
                                child: const Icon(Icons.inbox_outlined, size: 18, color: Color(0xFF94A3B8)),
                              ),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Text(
                                  'अद्याप कोणतीही ऑर्डर आलेली नाही. उत्पादने जोडा.',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                                ),
                              ),
                              TextButton(
                                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen())),
                                child: const Text('+ उत्पादन जोडा', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF16A34A))),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),

                // 6. 🚚 REAL UPCOMING PICKUP (आगामी वाहन उचल / पिकअप)
                _sectionHeader(
                  icon: Icons.local_shipping_rounded,
                  iconColor: const Color(0xFF2563EB),
                  title: 'UPCOMING PICKUP',
                  marathiTitle: 'आगामी वाहन उचल',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: pickupOrders.isNotEmpty
                        ? Builder(builder: (context) {
                            final currentPickup = pickupOrders.first;
                            final phoneToCall = currentPickup.buyerPhone.isNotEmpty ? currentPickup.buyerPhone : '1800123456';

                            return Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.local_shipping_rounded, color: Color(0xFF2563EB), size: 22),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Order #${currentPickup.orderCode.isNotEmpty ? currentPickup.orderCode : currentPickup.id}',
                                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                                          ),
                                          Text(
                                            'खरेदीदार: ${currentPickup.buyerName.isNotEmpty ? currentPickup.buyerName : 'GreenGrocc Buyer'}',
                                            style: const TextStyle(fontSize: 10.5, color: Color(0xFF6B7280)),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFEF3C7),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        currentPickup.status,
                                        style: const TextStyle(color: Color(0xFFB45309), fontSize: 10, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Divider(height: 1, color: Color(0xFFF3F4F6)),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('तारीख / वेळ', style: TextStyle(fontSize: 9.5, color: Color(0xFF6B7280))),
                                        const SizedBox(height: 2),
                                        Text(
                                          currentPickup.pickupDate.isNotEmpty ? currentPickup.pickupDate : 'लवकरच',
                                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                                        ),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('उत्पादन व माल', style: TextStyle(fontSize: 9.5, color: Color(0xFF6B7280))),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${currentPickup.quantity} ${currentPickup.unit}',
                                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                                        ),
                                      ],
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('रक्कम', style: TextStyle(fontSize: 9.5, color: Color(0xFF6B7280))),
                                        const SizedBox(height: 2),
                                        Text(
                                          '₹ ${_formatRupees(currentPickup.totalAmount)}',
                                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: const Color(0xFF2563EB),
                                          side: const BorderSide(color: Color(0xFF2563EB)),
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                        icon: const Icon(Icons.phone_rounded, size: 14),
                                        label: const Text('संपर्क (Call)', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                        onPressed: () => _makePhoneCall(phoneToCall),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF16A34A),
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                        ),
                                        icon: const Icon(Icons.check_circle_outline, size: 14),
                                        label: const Text('तपशील पहा', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                                        onPressed: () => MainShell.setTab(context, 2),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            );
                          })
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const SizedBox(height: 6),
                              const Icon(Icons.local_shipping_outlined, size: 36, color: Color(0xFF94A3B8)),
                              const SizedBox(height: 6),
                              const Text(
                                'सध्या कोणतीही उचल नियोजित नाही',
                                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'नवीन ऑर्डर आल्यानंतर पिकअप माहिती येथे दिसेल.',
                                style: TextStyle(fontSize: 10.5, color: Color(0xFF6B7280)),
                              ),
                              const SizedBox(height: 10),
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF16A34A),
                                  side: const BorderSide(color: Color(0xFF16A34A)),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                icon: const Icon(Icons.list_alt_rounded, size: 14),
                                label: const Text('ऑर्डर्स तपासा', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                onPressed: () => MainShell.setTab(context, 2),
                              ),
                            ],
                          ),
                  ),
                ),

                // 7. 💰 REAL EARNINGS (उत्पन्न तपशील - Total | Monthly | Pending | Paid)
                _sectionHeader(
                  icon: Icons.account_balance_wallet_rounded,
                  iconColor: const Color(0xFF16A34A),
                  title: 'EARNINGS',
                  marathiTitle: 'उत्पन्न तपशील',
                  actionLabel: 'पासबुक पहा →',
                  onAction: () => MainShell.setTab(context, 3),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      Expanded(
                        child: _EarningsMetricCard(
                          label: 'Total',
                          marathi: 'एकूण उत्पन्न',
                          amount: totalEarningsVal,
                          icon: Icons.account_balance_wallet,
                          color: const Color(0xFF16A34A),
                          bgColor: const Color(0xFFDCFCE7),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _EarningsMetricCard(
                          label: 'Monthly',
                          marathi: 'या महिन्याचे',
                          amount: monthlyEarningsVal,
                          icon: Icons.calendar_today_rounded,
                          color: const Color(0xFF2563EB),
                          bgColor: const Color(0xFFDBEAFE),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _EarningsMetricCard(
                          label: 'Pending',
                          marathi: 'प्रलंबित रक्कम',
                          amount: pendingPayoutVal,
                          icon: Icons.hourglass_top_rounded,
                          color: const Color(0xFFD97706),
                          bgColor: const Color(0xFFFEF3C7),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _EarningsMetricCard(
                          label: 'Paid',
                          marathi: 'खात्यात जमा',
                          amount: paidPayoutVal,
                          icon: Icons.verified_rounded,
                          color: const Color(0xFF059669),
                          bgColor: const Color(0xFFD1FAE5),
                        ),
                      ),
                    ],
                  ),
                ),

                // 8. 📈 REAL EARNINGS TREND — LINE CHART
                _sectionHeader(
                  icon: Icons.show_chart_rounded,
                  iconColor: const Color(0xFF16A34A),
                  title: 'EARNINGS TREND',
                  marathiTitle: 'उत्पन्न कल — Line Chart',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _EarningsTrendLineChart(
                    orders: settledOrders,
                    totalEarned: totalEarned,
                    monthlyEarned: monthlyEarned,
                  ),
                ),

                // 9. 📦 REAL ORDERS STATUS — BAR CHART
                _sectionHeader(
                  icon: Icons.bar_chart_rounded,
                  iconColor: const Color(0xFF2563EB),
                  title: 'ORDERS STATUS',
                  marathiTitle: 'ऑर्डर स्थिती — Bar Chart',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _OrderStatusBaChart(
                    newCount: newOrdersCount,
                    acceptedCount: acceptedOrdersCount,
                    preparingCount: preparingOrdersCount,
                    readyCount: readyPickupOrdersCount,
                    completedCount: completedOrdersCount,
                    rejectedCount: rejectedOrdersCount,
                  ),
                ),

                // 10. ⚠️ REAL PRODUCT-WISE REJECTION % CHART
                _sectionHeader(
                  icon: Icons.donut_large_rounded,
                  iconColor: const Color(0xFFDC2626),
                  title: 'PRODUCT REJECTION %',
                  marathiTitle: 'उत्पादनानुसार नाकारलेले — Donut Chart',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _ProductRejectionRateChart(
                    products: products,
                    orders: liveOrders,
                  ),
                ),

                // 11. 🌾 REAL CROP-WISE PRODUCTION — BAR CHART
                _sectionHeader(
                  icon: Icons.grass_rounded,
                  iconColor: const Color(0xFF059669),
                  title: 'CROP PRODUCTION',
                  marathiTitle: 'पिकानुसार उत्पादन — Bar Chart',
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: _CropProductionBarChart(
                    crops: crops,
                  ),
                ),

                // 12. 🏛️ REAL GOVERNMENT SCHEMES (शासकीय योजना व अनुदान)
                _sectionHeader(
                  icon: Icons.account_balance_rounded,
                  iconColor: const Color(0xFF7C3AED),
                  title: 'GOVERNMENT SCHEMES',
                  marathiTitle: 'शासकीय योजना',
                  actionLabel: 'सर्व योजना →',
                  onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen())),
                ),
                SizedBox(
                  height: 140,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: state.schemes.isNotEmpty
                        ? state.schemes.take(4).map((s) => _SchemeMiniCard(
                              title: s.title,
                              benefit: s.subsidyPercent.isNotEmpty ? s.subsidyPercent : s.maxAmount,
                              category: s.category,
                              color: const Color(0xFF16A34A),
                              bgColor: const Color(0xFFF0FDF4),
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen())),
                            )).toList()
                        : [
                            _SchemeMiniCard(
                              title: 'PM-Kisan Nidhi',
                              benefit: '₹ 6,000 / वर्ष',
                              category: 'थेट बँक खात्यात हप्ता',
                              color: const Color(0xFF16A34A),
                              bgColor: const Color(0xFFF0FDF4),
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen())),
                            ),
                            const SizedBox(width: 10),
                            _SchemeMiniCard(
                              title: 'महाडीबीटी ठिबक सिंचन',
                              benefit: '८०% अनुदान',
                              category: 'सिंचन साहित्य सहाय्य',
                              color: const Color(0xFF2563EB),
                              bgColor: const Color(0xFFEFF6FF),
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen())),
                            ),
                            const SizedBox(width: 10),
                            _SchemeMiniCard(
                              title: 'पीक विमा योजना (PMFBY)',
                              benefit: '₹ १ मध्ये विमा',
                              category: 'हवामान नुकसान भरपाई',
                              color: const Color(0xFFD97706),
                              bgColor: const Color(0xFFFFFBEB),
                              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SchemesScreen())),
                            ),
                          ],
                  ),
                ),

                // 9. 🔔 REAL NOTIFICATIONS (महत्त्वाच्या सूचना)
                _sectionHeader(
                  icon: Icons.notifications_active_rounded,
                  iconColor: const Color(0xFFDC2626),
                  title: 'NOTIFICATIONS',
                  marathiTitle: 'महत्त्वाच्या सूचना',
                  actionLabel: 'सर्व सूचना →',
                  onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 36),
                  child: InkWell(
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFFFEF2F2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.notifications_rounded, color: Color(0xFFDC2626), size: 20),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  liveOrders.isNotEmpty
                                      ? 'ऑर्डर #${liveOrders.first.orderCode.isNotEmpty ? liveOrders.first.orderCode : liveOrders.first.id} अपडेट: ${liveOrders.first.status}'
                                      : (kycVerified
                                          ? 'आपले शेतकरी खाते व केवायसी पडताळणी पूर्ण झाली आहे.'
                                          : 'केवायसी व बँक पडताळणीसाठी कागदपत्रे अपलोड करा.'),
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  liveOrders.isNotEmpty
                                      ? '${liveOrders.first.productName} • एकूण ₹ ${_formatRupees(liveOrders.first.totalAmount)}'
                                      : 'नवीन ऑर्डर्स, हवामान आणि पेमेंट सूचनांसाठी येथे टॅप करा.',
                                  style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFF9CA3AF), size: 20),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // SECTION HEADER HELPER
  // ---------------------------------------------------------------------------
  Widget _sectionHeader({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String marathiTitle,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: iconColor),
              const SizedBox(width: 6),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF111827),
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                '($marathiTitle)',
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF6B7280),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          if (actionLabel != null && onAction != null)
            InkWell(
              onTap: onAction,
              child: Text(
                actionLabel,
                style: const TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF16A34A),
                ),
              ),
            ),
        ],
      ),
    );
  }

  static Widget _cropBadge(String emoji) {
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white30, width: 0.8),
      ),
      child: Center(
        child: Text(emoji, style: const TextStyle(fontSize: 9.5)),
      ),
    );
  }

  static String _getCropEmoji(String cropName) {
    final name = cropName.toLowerCase();
    if (name.contains('tomat') || name.contains('टोमॅटो')) return '🍅';
    if (name.contains('chill') || name.contains('मिरची') || name.contains('mirchi')) return '🌶️';
    if (name.contains('maize') || name.contains('मका') || name.contains('corn')) return '🌽';
    if (name.contains('onion') || name.contains('कांदा')) return '🧅';
    if (name.contains('potato') || name.contains('बटाटा')) return '🥔';
    if (name.contains('cotton') || name.contains('कापूस')) return '🌾';
    if (name.contains('soybean') || name.contains('सोयाबीन')) return '🌱';
    if (name.contains('wheat') || name.contains('गहू')) return '🌾';
    if (name.contains('rice') || name.contains('तांदूळ') || name.contains('भात')) return '🌾';
    if (name.contains('sugar') || name.contains('ऊस')) return '🎋';
    if (name.contains('garlic') || name.contains('लसूण')) return '🧄';
    if (name.contains('ginger') || name.contains('आले')) return '🫚';
    return '🌿';
  }


  static String _formatRupees(double val) {
    final intVal = val.toInt();
    if (intVal >= 1000) {
      final s = intVal.toString();
      final lastThree = s.substring(s.length - 3);
      final rest = s.substring(0, s.length - 3);
      return '${rest.replaceAllMapped(RegExp(r'\B(?=(\d{2})+(?!\d))'), (match) => ',')},$lastThree';
    }
    return intVal.toString();
  }
}

// ---------------------------------------------------------------------------
// SUB-WIDGETS & CARDS
// ---------------------------------------------------------------------------


class _OrderStatusChip extends StatelessWidget {
  final String label;
  final String count;
  final Color color;
  final Color bgColor;

  const _OrderStatusChip({
    required this.label,
    required this.count,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          Text(
            count,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: color),
          ),
          const SizedBox(height: 1),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}


class _EarningsMetricCard extends StatelessWidget {
  final String label;
  final String marathi;
  final String amount;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _EarningsMetricCard({
    required this.label,
    required this.marathi,
    required this.amount,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(6)),
                child: Icon(icon, size: 11, color: color),
              ),
              const SizedBox(width: 3),
              Expanded(
                child: Text(
                  label,
                  style: const TextStyle(fontSize: 9, color: Color(0xFF6B7280), fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            amount,
            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w900, color: Color(0xFF111827)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            marathi,
            style: const TextStyle(fontSize: 7.5, color: Color(0xFF9CA3AF)),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _SchemeMiniCard extends StatelessWidget {
  final String title;
  final String benefit;
  final String category;
  final Color color;
  final Color bgColor;
  final VoidCallback onTap;

  const _SchemeMiniCard({
    required this.title,
    required this.benefit,
    required this.category,
    required this.color,
    required this.bgColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: 150,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                benefit,
                style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF111827), height: 1.2),
            ),
            const Spacer(),
            Text(
              category,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 8.5, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  'अर्ज करा',
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: color),
                ),
                const SizedBox(width: 2),
                Icon(Icons.arrow_forward_rounded, size: 10, color: color),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color bgColor;
  final String title;
  final String subTitle;
  final VoidCallback onTap;

  const _ActionCard({
    required this.icon,
    required this.iconColor,
    required this.bgColor,
    required this.title,
    required this.subTitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 3),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 20, color: iconColor),
            const SizedBox(height: 4),
            Text(
              title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subTitle,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 9,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewStatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final String value;

  const _OverviewStatCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(7),
                ),
                child: Icon(icon, size: 13, color: iconColor),
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 9,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF111827),
            ),
          ),
        ],
      ),
    );
  }
}


// ---------------------------------------------------------------------------
// HELPER METHODS PRESERVED
// ---------------------------------------------------------------------------

bool _isEarningOrder(FarmerOrderItem order) {
  final status = order.status.trim().toUpperCase();
  final quality = order.qualityStatus.trim().toUpperCase();
  if (status.contains('REJECT') || status.contains('CANCEL') || status.contains('DELETED')) return false;
  const open = {
    'PREPARING',
    'NEW',
    'PENDING',
    'CONFIRMED',
    'ACCEPTED',
    'READY_FOR_PICKUP',
    'IN_TRANSIT',
    'INSPECTION',
    'PACKING',
  };
  if (open.contains(status)) return false;
  return status.contains('COMPLET') ||
      status.contains('DELIVER') ||
      status == 'RECEIVED' ||
      status.contains('GRADE_CONFIRM') ||
      quality.contains('COMPLET') ||
      quality.contains('GRADE_CONFIRM');
}

bool _isPaidOrder(FarmerOrderItem order) {
  final status = order.paymentStatus.trim().toUpperCase();
  return status == 'PAID' || status == 'PAYMENT_COMPLETED' || status == 'COMPLETED' || status == 'PAYMENT RECEIVED';
}

double _orderAmount(FarmerOrderItem order) {
  if (order.totalAmount > 0) return order.totalAmount;
  return order.effectiveTotalAmount;
}

// ---------------------------------------------------------------------------
// 4 REAL ANALYTICS CHARTS (LINE CHART, BAR CHARTS, REJECTION %)
// ---------------------------------------------------------------------------

class _EarningsTrendLineChart extends StatelessWidget {
  final List<FarmerOrderItem> orders;
  final double totalEarned;
  final double monthlyEarned;

  const _EarningsTrendLineChart({
    required this.orders,
    required this.totalEarned,
    required this.monthlyEarned,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final List<({String label, double amount})> monthlyData = [];
    const monthNames = ['जाने', 'फेब्रु', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टें', 'ऑक्टो', 'नोव्हें', 'डिसें'];

    for (int i = 5; i >= 0; i--) {
      final monthDate = DateTime(now.year, now.month - i, 1);
      final monthName = monthNames[monthDate.month - 1];

      final sum = orders.where((o) {
        if (o.createdAt.isEmpty) return false;
        try {
          final d = DateTime.parse(o.createdAt);
          return d.year == monthDate.year && d.month == monthDate.month;
        } catch (_) {
          return false;
        }
      }).fold<double>(0.0, (acc, o) => acc + _orderAmount(o));

      monthlyData.add((label: monthName, amount: sum));
    }

    if (monthlyData.every((m) => m.amount == 0) && totalEarned > 0) {
      monthlyData[monthlyData.length - 1] = (label: monthlyData.last.label, amount: totalEarned);
    }

    final maxVal = monthlyData.fold<double>(1000.0, (m, item) => item.amount > m ? item.amount : m);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'मासिक उत्पन्न कल (Monthly Trend)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'चालू महिना: ₹ ${_DashboardScreenState._formatRupees(monthlyEarned)}',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: const [
                    Icon(Icons.trending_up_rounded, size: 13, color: Color(0xFF16A34A)),
                    SizedBox(width: 3),
                    Text(
                      'Live Trend',
                      style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 130,
            width: double.infinity,
            child: CustomPaint(
              painter: _EarningsLinePainter(
                data: monthlyData.map((m) => m.amount).toList(),
                labels: monthlyData.map((m) => m.label).toList(),
                maxVal: maxVal,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'एकूण उत्पन्न: ₹ ${_DashboardScreenState._formatRupees(totalEarned)}',
                style: const TextStyle(fontSize: 10, color: Color(0xFF6B7280)),
              ),
              const Text(
                'गेले ६ महिने',
                style: TextStyle(fontSize: 10, color: Color(0xFF9CA3AF)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarningsLinePainter extends CustomPainter {
  final List<double> data;
  final List<String> labels;
  final double maxVal;

  _EarningsLinePainter({
    required this.data,
    required this.labels,
    required this.maxVal,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final paintLine = Paint()
      ..color = const Color(0xFF16A34A)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final paintGrid = Paint()
      ..color = const Color(0xFFF3F4F6)
      ..strokeWidth = 1.0;

    final paintDotFill = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final paintDotStroke = Paint()
      ..color = const Color(0xFF16A34A)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    final bottomPadding = 20.0;
    final chartHeight = size.height - bottomPadding;
    final chartWidth = size.width;

    // Draw horizontal grid lines
    for (int i = 0; i <= 3; i++) {
      final y = chartHeight * (i / 3.0);
      canvas.drawLine(Offset(0, y), Offset(chartWidth, y), paintGrid);
    }

    final count = data.length;
    final stepX = chartWidth / (count - 1);
    final points = <Offset>[];

    for (int i = 0; i < count; i++) {
      final x = i * stepX;
      final normalized = (data[i] / maxVal).clamp(0.0, 1.0);
      final y = chartHeight - (normalized * (chartHeight - 12)) - 6;
      points.add(Offset(x, y));
    }

    // Build curved path
    final path = Path();
    final fillPath = Path();

    if (points.isNotEmpty) {
      path.moveTo(points[0].dx, points[0].dy);
      fillPath.moveTo(points[0].dx, chartHeight);
      fillPath.lineTo(points[0].dx, points[0].dy);

      for (int i = 0; i < points.length - 1; i++) {
        final p0 = points[i];
        final p1 = points[i + 1];
        final controlX1 = p0.dx + (p1.dx - p0.dx) / 2;
        final controlY1 = p0.dy;
        final controlX2 = p0.dx + (p1.dx - p0.dx) / 2;
        final controlY2 = p1.dy;

        path.cubicTo(controlX1, controlY1, controlX2, controlY2, p1.dx, p1.dy);
        fillPath.cubicTo(controlX1, controlY1, controlX2, controlY2, p1.dx, p1.dy);
      }

      fillPath.lineTo(points.last.dx, chartHeight);
      fillPath.close();

      final fillPaint = Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF16A34A).withValues(alpha: 0.28),
            const Color(0xFF16A34A).withValues(alpha: 0.0),
          ],
        ).createShader(Rect.fromLTWH(0, 0, chartWidth, chartHeight));

      canvas.drawPath(fillPath, fillPaint);
      canvas.drawPath(path, paintLine);

      final textPainter = TextPainter(textDirection: TextDirection.ltr);

      for (int i = 0; i < points.length; i++) {
        final pt = points[i];

        canvas.drawCircle(pt, 4.5, paintDotFill);
        canvas.drawCircle(pt, 4.5, paintDotStroke);

        if (i == points.length - 1) {
          final pulsePaint = Paint()
            ..color = const Color(0xFF16A34A).withValues(alpha: 0.2)
            ..style = PaintingStyle.fill;
          canvas.drawCircle(pt, 8.0, pulsePaint);
        }

        if (i < labels.length) {
          textPainter.text = TextSpan(
            text: labels[i],
            style: TextStyle(
              fontSize: 9.5,
              color: i == points.length - 1 ? const Color(0xFF16A34A) : const Color(0xFF6B7280),
              fontWeight: i == points.length - 1 ? FontWeight.bold : FontWeight.normal,
            ),
          );
          textPainter.layout();
          textPainter.paint(
            canvas,
            Offset(pt.dx - (textPainter.width / 2), size.height - textPainter.height),
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _EarningsLinePainter oldDelegate) {
    return oldDelegate.data != data || oldDelegate.maxVal != maxVal;
  }
}

class _OrderStatusBaChart extends StatelessWidget {
  final int newCount;
  final int acceptedCount;
  final int preparingCount;
  final int readyCount;
  final int completedCount;
  final int rejectedCount;

  const _OrderStatusBaChart({
    required this.newCount,
    required this.acceptedCount,
    required this.preparingCount,
    required this.readyCount,
    required this.completedCount,
    required this.rejectedCount,
  });

  @override
  Widget build(BuildContext context) {
    final total = newCount + acceptedCount + preparingCount + readyCount + completedCount + rejectedCount;
    final maxCount = [newCount, acceptedCount, preparingCount, readyCount, completedCount, rejectedCount]
        .fold<int>(1, (m, c) => c > m ? c : m);

    final items = [
      (label: 'नवीन', sub: 'New', count: newCount, color: const Color(0xFF2563EB)),
      (label: 'स्वीकृत', sub: 'Acpt', count: acceptedCount, color: const Color(0xFF0284C7)),
      (label: 'तयार', sub: 'Prep', count: preparingCount, color: const Color(0xFFD97706)),
      (label: 'उचल', sub: 'Ready', count: readyCount, color: const Color(0xFF7C3AED)),
      (label: 'पूर्ण', sub: 'Done', count: completedCount, color: const Color(0xFF16A34A)),
      (label: 'नाकार', sub: 'Rej', count: rejectedCount, color: const Color(0xFFDC2626)),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'ऑर्डर स्थिती वितरण (Orders Status)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'एकूण: $total',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 146,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: items.map((item) {
                final barHeight = maxCount > 0 ? (item.count / maxCount * 70).clamp(6.0, 70.0) : 6.0;
                return Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '${item.count}',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: item.count > 0 ? item.color : const Color(0xFF9CA3AF),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        height: barHeight,
                        width: 24,
                        decoration: BoxDecoration(
                          color: item.count > 0 ? item.color : const Color(0xFFE5E7EB),
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(5)),
                          gradient: item.count > 0
                              ? LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    item.color,
                                    item.color.withValues(alpha: 0.7),
                                  ],
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        item.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                      ),
                      Text(
                        item.sub,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 8, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductRejectionRateChart extends StatelessWidget {
  final List<ProductItem> products;
  final List<FarmerOrderItem> orders;

  const _ProductRejectionRateChart({
    required this.products,
    required this.orders,
  });

  @override
  Widget build(BuildContext context) {
    if (products.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: const [
            Icon(Icons.donut_large_rounded, size: 30, color: Color(0xFF94A3B8)),
            SizedBox(height: 6),
            Text(
              'कोणतीही उत्पादने नोंदवलेली नाहीत',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
            ),
          ],
        ),
      );
    }

    final List<({String title, String category, double totalOrdered, double rejected, double rate})> list = [];

    for (final p in products) {
      final titleLower = p.productName.trim().toLowerCase();
      final matchedOrders = orders.where((o) {
        final cLower = o.cropName.trim().toLowerCase();
        final vLower = o.variety.trim().toLowerCase();
        return cLower.contains(titleLower) || titleLower.contains(cLower) || (vLower.isNotEmpty && titleLower.contains(vLower));
      }).toList();

      double ord = matchedOrders.fold<double>(0.0, (acc, o) => acc + o.quantity);
      double rej = matchedOrders.fold<double>(0.0, (acc, o) => acc + o.rejectedQuantity);

      if (ord == 0) {
        ord = p.stockQuantity;
      }

      final rate = ord > 0 ? (rej / ord * 100).clamp(0.0, 100.0) : 0.0;
      list.add((title: p.productName, category: p.category, totalOrdered: ord, rejected: rej, rate: rate));
    }

    final totalOrderedAll = list.fold<double>(0.0, (acc, item) => acc + item.totalOrdered);
    final totalRejectedAll = list.fold<double>(0.0, (acc, item) => acc + item.rejected);
    final overallRejectionRate = totalOrderedAll > 0 ? (totalRejectedAll / totalOrderedAll * 100).clamp(0.0, 100.0) : 0.0;
    final totalAcceptedAll = (totalOrderedAll - totalRejectedAll).clamp(0.0, double.infinity);
    final overallAcceptanceRate = (100.0 - overallRejectionRate).clamp(0.0, 100.0);

    const colors = [
      Color(0xFFEF4444),
      Color(0xFFF97316),
      Color(0xFF8B5CF6),
      Color(0xFF06B6D4),
      Color(0xFFF59E0B),
    ];

    final List<({String label, double value, Color color})> slices = [];

    slices.add((
      label: 'मंजूर माल',
      value: totalAcceptedAll > 0 ? totalAcceptedAll : (totalRejectedAll == 0 ? 100.0 : 0.0),
      color: const Color(0xFF16A34A),
    ));

    int cIdx = 0;
    for (final item in list) {
      if (item.rejected > 0) {
        slices.add((
          label: item.title,
          value: item.rejected,
          color: colors[cIdx % colors.length],
        ));
        cIdx++;
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'उत्पादनानुसार नाकारलेले प्रमाण % (Donut Chart)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: totalRejectedAll > 0 ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  totalRejectedAll > 0 ? '${totalRejectedAll.toStringAsFixed(0)} Kg नाकारले' : '०% रिजेक्शन ✓',
                  style: TextStyle(
                    fontSize: 9.5,
                    fontWeight: FontWeight.bold,
                    color: totalRejectedAll > 0 ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(
                width: 125,
                height: 125,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CustomPaint(
                      size: const Size(125, 125),
                      painter: _DonutChartPainter(
                        slices: slices,
                        strokeWidth: 16.0,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${overallRejectionRate.toStringAsFixed(1)}%',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: overallRejectionRate > 0 ? const Color(0xFFDC2626) : const Color(0xFF16A34A),
                          ),
                        ),
                        Text(
                          overallRejectionRate > 0 ? 'नाकारलेले' : 'मंजूर माल',
                          style: const TextStyle(fontSize: 8.5, color: Color(0xFF6B7280), fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF16A34A),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 5),
                        const Expanded(
                          child: Text(
                            'मंजूर माल (Accepted)',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
                          ),
                        ),
                        Text(
                          '${overallAcceptanceRate.toStringAsFixed(0)}%',
                          style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ...list.map((item) {
                      final hasRejection = item.rejected > 0;
                      final sIdx = slices.indexWhere((s) => s.label == item.title);
                      final dotColor = sIdx != -1 ? slices[sIdx].color : const Color(0xFF9CA3AF);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 5),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: hasRejection ? dotColor : const Color(0xFF9CA3AF).withValues(alpha: 0.4),
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 5),
                            Text(
                              _DashboardScreenState._getCropEmoji(item.title),
                              style: const TextStyle(fontSize: 10),
                            ),
                            const SizedBox(width: 3),
                            Expanded(
                              child: Text(
                                item.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 9, color: Color(0xFF4B5563)),
                              ),
                            ),
                            Text(
                              hasRejection ? '${item.rejected.toStringAsFixed(0)} Kg (${item.rate.toStringAsFixed(1)}%)' : '०%',
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: hasRejection ? FontWeight.bold : FontWeight.normal,
                                color: hasRejection ? dotColor : const Color(0xFF9CA3AF),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).take(4),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: overallRejectionRate <= 5.0 ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: overallRejectionRate <= 5.0 ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  overallRejectionRate <= 5.0 ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                  size: 13,
                  color: overallRejectionRate <= 5.0 ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    overallRejectionRate <= 5.0
                        ? 'उत्कृष्ट दर्जा! ९५%+ माल थेट मंजूर झाला आहे.'
                        : 'माल नाकारणे कमी करण्यासाठी काढणीनंतर योग्य प्रतवारी व पॅकिंग करा.',
                    style: TextStyle(
                      fontSize: 8.5,
                      color: overallRejectionRate <= 5.0 ? const Color(0xFF15803D) : const Color(0xFFB45309),
                      fontWeight: FontWeight.w500,
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

class _DonutChartPainter extends CustomPainter {
  final List<({String label, double value, Color color})> slices;
  final double strokeWidth;

  _DonutChartPainter({
    required this.slices,
    this.strokeWidth = 16.0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final total = slices.fold<double>(0.0, (acc, s) => acc + s.value);

    if (total <= 0) {
      final paint = Paint()
        ..color = const Color(0xFF16A34A)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth;
      canvas.drawCircle(center, radius, paint);
      return;
    }

    var startAngle = -pi / 2;

    for (final slice in slices) {
      if (slice.value <= 0) continue;
      final sweepAngle = (slice.value / total) * 2 * pi;

      final paint = Paint()
        ..color = slice.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.butt;

      canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutChartPainter oldDelegate) {
    return oldDelegate.slices != slices || oldDelegate.strokeWidth != strokeWidth;
  }
}

class _CropProductionBarChart extends StatelessWidget {
  final List<CropItem> crops;

  const _CropProductionBarChart({
    required this.crops,
  });

  @override
  Widget build(BuildContext context) {
    if (crops.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Column(
          children: const [
            Icon(Icons.grass_outlined, size: 30, color: Color(0xFF94A3B8)),
            SizedBox(height: 6),
            Text(
              'अद्याप कोणतीही पिके नोंदवलेली नाहीत',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
            ),
          ],
        ),
      );
    }

    final totalAcreage = crops.fold<double>(0.0, (acc, c) => acc + c.acreage);
    final maxAcreage = crops.fold<double>(0.1, (acc, c) => c.acreage > acc ? c.acreage : acc);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'पिकानुसार उत्पादन क्षमता (Crop Production)',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF111827)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${totalAcreage.toStringAsFixed(1)} Acre एकूण',
                  style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          ...crops.map((c) {
            final pct = totalAcreage > 0 ? (c.acreage / totalAcreage * 100) : 0.0;
            final ratio = maxAcreage > 0 ? (c.acreage / maxAcreage).clamp(0.05, 1.0) : 0.05;

            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(_DashboardScreenState._getCropEmoji(c.cropName), style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(
                            c.cropName,
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
                          ),
                          if (c.variety.isNotEmpty) ...[
                            const SizedBox(width: 4),
                            Text(
                              '(${c.variety})',
                              style: const TextStyle(fontSize: 9.5, color: Color(0xFF6B7280)),
                            ),
                          ],
                        ],
                      ),
                      Text(
                        '${c.acreage} ${c.areaUnit} (${pct.toStringAsFixed(0)}%)',
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF16A34A)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: ratio,
                      backgroundColor: const Color(0xFFF3F4F6),
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'अंदाजे काढणी: ${c.estHarvestDate.isNotEmpty ? c.estHarvestDate : "तारीख बाकी"}',
                        style: const TextStyle(fontSize: 8.5, color: Color(0xFF6B7280)),
                      ),
                      Text(
                        'वाढ: ${(c.progress * 100).toInt()}%',
                        style: const TextStyle(fontSize: 8.5, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}


