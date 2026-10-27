import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/utils/currency_formatter.dart';
import '../../models/farmer_trace.dart';
import '../../models/order.dart';
import '../../routes/route_paths.dart';
import '../auth/auth_controller.dart';
import '../orders/orders_controller.dart';
import '../orders/widgets/preorder_progress_steps.dart';
import '../../widgets/common/app_network_image.dart';

const Color _green = Color(0xFF0A6C38);
const Color _borderGreen = Color(0xFFDDEADB);
const Color _tabActiveBg = Color(0xFFCCEAD7);
const Color _slate900 = Color(0xFF0F172A);
const Color _slate700 = Color(0xFF334155);
const Color _slate500 = Color(0xFF64748B);

/// Farmer Profile Screen matching Screenshot 2 exactly:
/// 1. Clean AppBar with "< Farmer Profile" and Share button
/// 2. Farmer Card: Rounded rectangular photo, verified name in green, location, and land area
/// 3. Sub-tabs: About Farm (with Bio and 3 metric badges), Crops, Photos
/// 4. Pre-Orders section:
///    - If not logged in: "ऑर्डर्स ट्रॅक करण्यासाठी लॉगिन करा" with Login button
///    - If logged in & current pre-order exists: Displays Current Pre-Order Status with 8-step journey stepper, slot, and items
///    - In Past tab: Displays past pre-orders
class FarmerProfileScreen extends ConsumerStatefulWidget {
  const FarmerProfileScreen({super.key, this.farmer});

  final FarmerTrace? farmer;

  @override
  ConsumerState<FarmerProfileScreen> createState() => _FarmerProfileScreenState();
}

class _FarmerProfileScreenState extends ConsumerState<FarmerProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _orderFilter = 'upcoming'; // 'upcoming' | 'delivered' | 'past'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _shareProfile(String name, String location) {
    Share.share(
      'Meet our farmer $name from $location on GreenGrocc! Pure, farm-fresh produce sourced directly with complete traceability.\nhttps://greengrocc.com/farmer-profile',
      subject: '$name · GreenGrocc Farmer Profile',
    );
  }

  @override
  Widget build(BuildContext context) {
    final f = widget.farmer;

    final rawName = f?.name.trim() ?? '';
    final name = rawName.isNotEmpty
        ? (rawName.startsWith('श्री.') || rawName.startsWith('श्री ') ? rawName : 'श्री. $rawName')
        : 'श्री. Anand Dhumal';

    final location = f?.location.trim().isNotEmpty == true
        ? f!.location.trim()
        : 'Shirur, Pune, Maharashtra';

    final area = f != null && (f.cultivationArea.isNotEmpty || f.totalArea.isNotEmpty)
        ? (f.cultivationArea.isNotEmpty ? f.cultivationArea : f.totalArea)
        : '5 acres';

    final experience = f?.experience.trim().isNotEmpty == true
        ? f!.experience.trim()
        : '12 वर्षे शेतीचा अनुभव';

    final bio = f?.bio.trim().isNotEmpty == true
        ? f!.bio.trim()
        : 'Runs a desi cow dairy: milk is chilled to 4°C within 30 minutes of milking and bottled the same morning. Committed to sustainable, residue-tested farming in Shirur, Pune.';

    final crops = (f?.crops.isNotEmpty == true)
        ? f!.crops
        : const [
            FarmerCrop(
              name: 'Amul Gold Full Cream Milk, 500 ml Pouch',
              variety: 'Napier & lucerne fodder',
              area: '5 acres',
              status: 'ताजी आवक · उपलब्ध (In Stock)',
            ),
            FarmerCrop(
              name: 'Allahabad Safeda Guava (Peru)',
              variety: 'Allahabad Safeda',
              area: '5 acres',
              status: 'ताजी आवक · उपलब्ध (In Stock)',
            ),
          ];

    final auth = ref.watch(authControllerProvider);
    final ordersState = ref.watch(ordersControllerProvider);

    // Filter pre-orders
    final allPreOrders = ordersState.orders.where((o) => o.isPreOrder).toList();
    final currentPreOrders = allPreOrders
        .where((o) => o.status != 'delivered' && o.status != 'cancelled')
        .toList();
    final deliveredPreOrders = allPreOrders.where((o) => o.status == 'delivered').toList();
    final pastPreOrders = allPreOrders
        .where((o) => o.status == 'delivered' || o.status == 'cancelled')
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: _slate900,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Farmer Profile',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () => _shareProfile(name, location),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE2E8F0), height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Farmer Card matching Screenshot 2
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _borderGreen),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Farmer Photo (Rounded square)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      width: 96,
                      height: 104,
                      child: f?.farmerImage.isNotEmpty == true
                          ? AppNetworkImage(imageUrl: f!.farmerImage, fit: BoxFit.cover)
                          : Container(
                              color: const Color(0xFFE6F5EA),
                              child: const Icon(Icons.person_rounded, color: _green, size: 48),
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Farmer Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: _green,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.verified_rounded, size: 16, color: _green),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: _green),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                location,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: _slate700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.spa_outlined, size: 14, color: _green),
                            const SizedBox(width: 4),
                            Text(
                              area,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: _slate700,
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
            const SizedBox(height: 16),

            // 2. Sub-Tabs Container: About Farm | Crops | Photos
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _borderGreen),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TabBar(
                    controller: _tabController,
                    indicatorColor: _green,
                    indicatorWeight: 2.5,
                    labelColor: _green,
                    unselectedLabelColor: _slate500,
                    labelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13.5),
                    unselectedLabelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 13.5),
                    tabs: const [
                      Tab(text: 'About Farm'),
                      Tab(text: 'Crops'),
                      Tab(text: 'Photos'),
                    ],
                  ),
                  const Divider(color: Color(0xFFF1F5F9), height: 1),

                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: AnimatedBuilder(
                      animation: _tabController,
                      builder: (context, _) {
                        if (_tabController.index == 0) {
                          return _buildAboutFarmTab(bio, area, experience);
                        } else if (_tabController.index == 1) {
                          return _buildCropsTab(crops);
                        } else {
                          return _buildPhotosTab(f);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 3. Pre-Orders Section ("🌱 Pre-Orders")
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.eco_rounded, size: 20, color: _green),
                    const SizedBox(width: 6),
                    Text(
                      'Pre-Orders',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 16.5,
                        fontWeight: FontWeight.w900,
                        color: _slate900,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),

                // Filter Pills: [Upcoming] [Delivered] [Past]
                Container(
                  padding: const EdgeInsets.all(2.5),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildOrderFilterPill('upcoming', 'Upcoming (${currentPreOrders.length})'),
                      _buildOrderFilterPill('delivered', 'Delivered (${deliveredPreOrders.length})'),
                      _buildOrderFilterPill('past', 'Past (${pastPreOrders.length})'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Pre-Orders Content
            if (!auth.isLoggedIn)
              _buildNotLoggedInCard()
            else if (_orderFilter == 'upcoming')
              _buildUpcomingPreOrders(currentPreOrders)
            else if (_orderFilter == 'delivered')
              _buildPastPreOrders(deliveredPreOrders, 'Delivered')
            else
              _buildPastPreOrders(pastPreOrders, 'Past'),

            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderFilterPill(String filterKey, String label) {
    final active = _orderFilter == filterKey;
    return GestureDetector(
      onTap: () => setState(() => _orderFilter = filterKey),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: active ? _green : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 11,
            fontWeight: active ? FontWeight.w800 : FontWeight.w600,
            color: active ? Colors.white : _slate700,
          ),
        ),
      ),
    );
  }

  Widget _buildAboutFarmTab(String bio, String area, String experience) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About Farm',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          bio,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            height: 1.45,
            color: _slate700,
          ),
        ),
        const SizedBox(height: 16),

        // 3 Metric Badges matching Screenshot 2
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: Icons.spa_outlined,
                value: area.replaceAll('acres', 'एकर').replaceAll('acre', 'एकर'),
                label: 'जमीन',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.agriculture_outlined,
                value: experience.contains('वर्षे') ? experience.split(' ')[0] : '12 वर्षे',
                label: 'शेतीचा अनुभव',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.eco_outlined,
                value: '10+',
                label: 'पिकांचे प्रकार',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF4FAF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDEADB)),
      ),
      child: Column(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Color(0xFFE6F5EA),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: _green),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: _slate500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropsTab(List<FarmerCrop> crops) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Grown Crops & Varieties',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 10),
        for (final crop in crops)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F5EA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.grass_rounded, color: _green, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        crop.name,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
                        ),
                      ),
                      if (crop.variety.isNotEmpty)
                        Text(
                          'Variety: ${crop.variety} · ${crop.area}',
                          style: GoogleFonts.plusJakartaSans(fontSize: 11, color: _slate500),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F5EA),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'In Season',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: _green,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPhotosTab(FarmerTrace? f) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Farm & Orchard Gallery',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.3,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: f?.farmImage.isNotEmpty == true
                  ? AppNetworkImage(imageUrl: f!.farmImage, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFE6F5EA),
                      child: const Icon(Icons.landscape_rounded, color: _green, size: 36),
                    ),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: f?.farmerImage.isNotEmpty == true
                  ? AppNetworkImage(imageUrl: f!.farmerImage, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFE6F5EA),
                      child: const Icon(Icons.agriculture_rounded, color: _green, size: 36),
                    ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildNotLoggedInCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: const BoxDecoration(
              color: Color(0xFFF0F8F2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.local_shipping_outlined, color: _green, size: 28),
          ),
          const SizedBox(height: 12),
          Text(
            'ऑर्डर्स ट्रॅक करण्यासाठी लॉगिन करा',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'तुमच्या चालू ऑर्डर्सचे लाईव्ह ट्रॅकिंग आणि जुन्या ऑर्डर्स पाहण्यासाठी खात्यात लॉगिन करा.',
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              color: _slate500,
            ),
          ),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => ref.read(authControllerProvider.notifier).openAuthModal(AuthModalMode.login),
            style: FilledButton.styleFrom(
              backgroundColor: _green,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 11),
            ),
            child: Text(
              'Login / Sign In',
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingPreOrders(List<Order> currentOrders) {
    if (currentOrders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            const Icon(Icons.inbox_outlined, size: 40, color: _slate500),
            const SizedBox(height: 8),
            Text(
              'कोणतीही चालू प्री-ऑर्डर नाही (No Current Pre-Orders)',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: _slate900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'सध्या तुमची कोणतीही चालू प्री-ऑर्डर नाही. थेट शेतकऱ्यांकडून ताजी उत्पादने खरेदी करा!',
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _slate500),
            ),
            const SizedBox(height: 14),
            FilledButton(
              onPressed: () => context.push(RoutePaths.categories),
              style: FilledButton.styleFrom(
                backgroundColor: _green,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Shop Fresh Produce', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        for (final order in currentOrders)
          Builder(builder: (context) {
            final displayId = order.orderNumber.isNotEmpty
                ? order.orderNumber
                : (order.id.length > 8 ? order.id.substring(order.id.length - 6).toUpperCase() : order.id);
            final progressLabel = order.preOrderProgressLabel.isNotEmpty
                ? order.preOrderProgressLabel
                : (order.preOrderProgress.isNotEmpty
                    ? order.preOrderProgress.replaceAll('_', ' ').toUpperCase()
                    : 'In Progress');

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _borderGreen, width: 1.5),
                boxShadow: const [
                  BoxShadow(color: Color(0x06000000), blurRadius: 10, offset: Offset(0, 3)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Live Pre-Order Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: _green,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Live Pre-Order #$displayId',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w900,
                              color: _green,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                        decoration: BoxDecoration(
                          color: _tabActiveBg,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          progressLabel,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: _green,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Delivery Slot
                  if (order.preOrderSlot.isNotEmpty) ...[
                    Row(
                      children: [
                        const Icon(Icons.schedule_rounded, size: 14, color: _slate500),
                        const SizedBox(width: 4),
                        Text(
                          'Delivery Slot: ${order.preOrderSlot}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: _slate700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                  ],

                  // 8-Step Pre-Order Stepper
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: PreOrderProgressSteps(
                      progress: order.preOrderProgress,
                      label: order.preOrderProgressLabel,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Items list
                  for (final item in order.items)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2.5),
                      child: Row(
                        children: [
                          const Text('• ', style: TextStyle(color: _green, fontWeight: FontWeight.bold)),
                          Expanded(
                            child: Text(
                              '${item.name} × ${item.quantity}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: _slate700,
                              ),
                            ),
                          ),
                          Text(
                            formatInr(item.price * item.quantity),
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                              color: _slate900,
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 12),
                  const Divider(color: Color(0xFFF1F5F9), height: 1),
                  const SizedBox(height: 10),

                  // Total & Action Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total: ${formatInr(order.total)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w900,
                          color: _slate900,
                        ),
                      ),
                      InkWell(
                        onTap: () {
                          context.push('/orders/${order.id}');
                        },
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                          decoration: BoxDecoration(
                            color: _green,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Track Live Order',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_forward_rounded, size: 14, color: Colors.white),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _buildPastPreOrders(List<Order> orders, String title) {
    if (orders.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Column(
          children: [
            const Icon(Icons.history_rounded, size: 40, color: _slate500),
            const SizedBox(height: 8),
            Text(
              'No $title Pre-Orders',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: _slate900,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Your completed pre-orders will appear here.',
              style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _slate500),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        for (final order in orders)
          Builder(builder: (context) {
            final displayId = order.orderNumber.isNotEmpty
                ? order.orderNumber
                : (order.id.length > 8 ? order.id.substring(order.id.length - 6).toUpperCase() : order.id);

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Order #$displayId',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFE6F5EA),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          order.status == 'delivered' ? 'Delivered' : order.status,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: _green,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  for (final item in order.items)
                    Text(
                      '${item.name} × ${item.quantity}',
                      style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _slate700),
                    ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        formatInr(order.total),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          color: _slate900,
                        ),
                      ),
                      InkWell(
                        onTap: () => context.push('/orders/${order.id}'),
                        child: Row(
                          children: [
                            Text(
                              'View Details',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: _green,
                              ),
                            ),
                            const SizedBox(width: 2),
                            const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: _green),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
