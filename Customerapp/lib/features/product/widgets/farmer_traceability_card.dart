import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../config/env.dart';
import '../../../core/utils/department_utils.dart';
import '../../../features/auth/auth_controller.dart';
import '../../../features/orders/orders_controller.dart';
import '../../../models/order.dart';
import '../../../models/product.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/common/app_network_image.dart';

const Color _green = Color(0xFF0A6C38);
const Color _lightGreen = Color(0xFFF6FBF4);
const Color _border = Color(0xFFDDEADB);
const Color _tabActiveBg = Color(0xFFCCEAD7);
const Color _slate900 = Color(0xFF0F172A);
const Color _slate700 = Color(0xFF334155);
const Color _slate500 = Color(0xFF64748B);

/// "Meet Your Farmer" section matching the frontend product detail layout exactly:
/// 1. Meet Your Farmer card (Photo, Name, Location, Land, View Profile ->)
/// 2. Pill Tabs: Details | Nutrition | Reviews
/// 3. Product Information card with Name, Variety, Harvest Date, Packing Date, Source, Status, and Bullet points.
class FarmerTraceabilityCard extends ConsumerStatefulWidget {
  const FarmerTraceabilityCard({super.key, required this.product});

  final Product product;

  static String qrPayload(Product product) {
    final f = product.farmer;
    final lines = <String>['GreenGrocc Farm Traceability', ''];
    void add(String label, String value) {
      if (value.trim().isNotEmpty) lines.add('$label: ${value.trim()}');
    }

    add('Product', product.name);
    add('Farmer', f.name);
    add('Location', f.location);
    add('Experience', f.experience);
    add('Total area', f.totalArea);
    add('Cultivation area', f.cultivationArea);
    add('Farming method', f.agricultureMethod);
    add('Certification', product.certification);
    add('Current crop', f.currentCrop);
    add('Last crop', f.lastCropTaken);
    add('Crop cycle', f.cropCycle);
    add('Water source', f.waterSource);
    add('Soil type', f.soilType);
    add('Farm tools', f.farmTools);
    add('Harvested on', f.harvestingDate);
    add('Packed on', f.packingDate);
    if (f.crops.isNotEmpty) {
      lines.add('Crops:');
      for (final c in f.crops) {
        final parts = [
          c.name,
          if (c.variety.isNotEmpty) '(${c.variety})',
          if (c.area.isNotEmpty) '- ${c.area}',
          if (c.status.isNotEmpty) '[${c.status}]',
        ].where((s) => s.trim().isNotEmpty).join(' ');
        lines.add('  • $parts');
      }
    }
    add('About', f.bio);
    if (product.id.isNotEmpty) {
      lines
        ..add('')
        ..add('${Env.websiteAssetUrl}/product/${product.id}');
    }
    return lines.join('\n');
  }

  @override
  ConsumerState<FarmerTraceabilityCard> createState() => _FarmerTraceabilityCardState();
}

class _FarmerTraceabilityCardState extends ConsumerState<FarmerTraceabilityCard> {
  int _activeTab = 0; // 0: Details, 1: Nutrition, 2: Reviews

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = ref.read(authControllerProvider);
      if (auth.isLoggedIn) {
        ref.read(ordersControllerProvider.notifier).loadOrders();
      }
    });
  }

  void _openQrDialog(BuildContext context, String data) {
    showDialog<void>(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Scan to trace this product',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: _slate900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Farmer, farm and harvest details',
                style: GoogleFonts.plusJakartaSans(fontSize: 12, color: _slate500),
              ),
              const SizedBox(height: 16),
              QrImageView(
                data: data,
                size: 240,
                backgroundColor: Colors.white,
                errorCorrectionLevel: QrErrorCorrectLevel.L,
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: Text(
                  'Close',
                  style: GoogleFonts.plusJakartaSans(
                    color: _green,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final f = product.farmer;
    final data = FarmerTraceabilityCard.qrPayload(product);

    final isPreOrderProduct = product.department == Department.preorder;
    final orders = ref.watch(ordersControllerProvider.select((s) => s.orders));

    Order? placedPreOrder;
    if (isPreOrderProduct) {
      for (final order in orders) {
        if (!order.isPreOrder) continue;
        final st = order.status.toLowerCase();
        if (st == 'cancelled' || st == 'canceled') continue;
        final hasItem = order.items.any((item) =>
            item.productId == product.id ||
            (item.name.trim().isNotEmpty &&
                item.name.trim().toLowerCase() == product.name.trim().toLowerCase()));
        if (hasItem) {
          placedPreOrder = order;
          break;
        }
      }
    }

    final rawName = f.name.trim();
    final displayName = rawName.isNotEmpty
        ? (rawName.startsWith('श्री.') || rawName.startsWith('श्री ') ? rawName : 'श्री. $rawName')
        : 'श्री. Anand Dhumal';

    final displayLocation = f.location.trim().isNotEmpty
        ? f.location.trim()
        : 'Shirur, Pune, Maharashtra';

    final area = f.cultivationArea.isNotEmpty ? f.cultivationArea : f.totalArea;
    final displayArea = area.trim().isNotEmpty ? area.trim() : '5 acres';

    final variety = product.varietyName.trim().isNotEmpty
        ? product.varietyName.trim()
        : (f.currentCrop.trim().isNotEmpty ? f.currentCrop.trim() : 'Allahabad Safeda');

    final harvestDate = f.harvestingDate.trim().isNotEmpty ? f.harvestingDate.trim() : '24 Oct 2026';
    final packingDate = f.packingDate.trim().isNotEmpty ? f.packingDate.trim() : '25 Oct 2026';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Section Title: Meet Your Farmer
        Text(
          'Meet Your Farmer',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: _slate900,
            letterSpacing: -0.3,
          ),
        ),
        const SizedBox(height: 10),

        if (isPreOrderProduct && placedPreOrder != null) ...[
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.eco_rounded, color: Color(0xFF16A34A), size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Farm Traceability Active',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: const Color(0xFF14532D),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Pre-order #${placedPreOrder.orderNumber.isNotEmpty ? placedPreOrder.orderNumber : (placedPreOrder.id.length > 6 ? placedPreOrder.id.substring(placedPreOrder.id.length - 6).toUpperCase() : placedPreOrder.id)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11.5,
                          color: const Color(0xFF166534),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: () {
                    context.push('/orders/${placedPreOrder!.id}/track?productId=${product.id}');
                  },
                  icon: const Icon(Icons.timeline_rounded, size: 14),
                  label: Text(
                    'View Traceability',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ],
            ),
          ),
        ],

        // 1. Meet Your Farmer Card
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x06000000),
                blurRadius: 8,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Farmer Photo (Rounded rectangle)
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: SizedBox(
                  width: 82,
                  height: 74,
                  child: f.farmerImage.isNotEmpty
                      ? AppNetworkImage(imageUrl: f.farmerImage, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFE6F5EA),
                          child: const Icon(Icons.person_rounded, color: _green, size: 44),
                        ),
                ),
              ),
              const SizedBox(width: 14),

              // Farmer Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            displayName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 15.5,
                              fontWeight: FontWeight.w900,
                              color: _green,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.verified_rounded, size: 16, color: _green),
                      ],
                    ),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: _green),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            displayLocation,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: _slate700,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.spa_outlined, size: 14, color: _green),
                        const SizedBox(width: 4),
                        Text(
                          displayArea,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: _slate700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // View Profile -> Button
                    InkWell(
                      onTap: () {
                        context.push(RoutePaths.farmerProfile, extra: f);
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4.5),
                        decoration: BoxDecoration(
                          border: Border.all(color: _green, width: 1.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'View Profile',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                                color: _green,
                              ),
                            ),
                            const SizedBox(width: 3),
                            const Icon(Icons.arrow_forward_rounded, size: 12, color: _green),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // 2. Pill Tabs Selector: [Details] [Nutrition] [Reviews]
        Container(
          padding: const EdgeInsets.all(3.5),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            children: [
              _buildPillTab(index: 0, label: 'Details'),
              _buildPillTab(index: 1, label: 'Nutrition'),
              _buildPillTab(index: 2, label: 'Reviews'),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // 3. Tab Content
        if (_activeTab == 0)
          _buildDetailsTab(
            product,
            variety,
            harvestDate,
            packingDate,
            displayLocation,
            data,
            isPreOrderProduct: isPreOrderProduct,
            placedPreOrder: placedPreOrder,
          )
        else if (_activeTab == 1)
          _buildNutritionTab(product)
        else
          _buildReviewsTab(product),
      ],
    );
  }

  Widget _buildPillTab({required int index, required String label}) {
    final active = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? _tabActiveBg : Colors.transparent,
            borderRadius: BorderRadius.circular(9),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: active ? FontWeight.w800 : FontWeight.w600,
              color: active ? _green : _slate500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailsTab(
    Product product,
    String variety,
    String harvestDate,
    String packingDate,
    String source,
    String qrData, {
    required bool isPreOrderProduct,
    required Order? placedPreOrder,
  }) {
    final features = product.features.isNotEmpty
        ? product.features
        : const [
            '100% natural & fresh harvest',
            'Naturally sweet & aromatic taste',
            'Rich in essential vitamins & nutrients',
            'Hand-picked at peak ripeness',
          ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Product Information',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 14),

          // Key-Value rows
          _buildInfoRow('Product Name', product.name),
          const SizedBox(height: 8),
          _buildInfoRow('Variety', variety),
          const SizedBox(height: 8),
          _buildInfoRow('Harvest Date', harvestDate),
          const SizedBox(height: 8),
          _buildInfoRow('Packing Date', packingDate),
          const SizedBox(height: 8),
          _buildInfoRow('Source', source),
          const SizedBox(height: 8),
          _buildStatusRow('Status', 'ताजी आवक · उपलब्ध (In Stock)'),

          // Description & bullet points
          if (product.description.isNotEmpty) ...[
            const SizedBox(height: 14),
            const Divider(color: Color(0xFFF1F5F9), height: 1),
            const SizedBox(height: 12),
            Text(
              product.description,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12.5,
                height: 1.45,
                color: _slate700,
              ),
            ),
          ],

          if (features.isNotEmpty) ...[
            const SizedBox(height: 10),
            for (final f in features)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ', style: TextStyle(color: _green, fontSize: 14, fontWeight: FontWeight.bold)),
                    Expanded(
                      child: Text(
                        f,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          height: 1.4,
                          color: _slate700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],

          // Traceability action:
          // If preorder-enabled product and customer placed preorder -> show View Farm Traceability
          // If preorder-enabled product and customer has NOT placed preorder -> do NOT show preorder traceability
          // If non-preorder product -> show standard QR traceability details
          if (isPreOrderProduct) ...[
            if (placedPreOrder != null) ...[
              const SizedBox(height: 14),
              GestureDetector(
                onTap: () {
                  context.push('/orders/${placedPreOrder.id}/track?productId=${product.id}');
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: _lightGreen,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.timeline_rounded, size: 22, color: _green),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'View Farm Traceability',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w800,
                                color: _green,
                              ),
                            ),
                            Text(
                              'Track pre-order harvest, dark store receipt & live status',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11,
                                color: _slate500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: _green),
                    ],
                  ),
                ),
              ),
            ],
          ] else ...[
            const SizedBox(height: 14),
            // Traceability QR Button for standard / non-preorder products
            GestureDetector(
              onTap: () => _openQrDialog(context, qrData),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: _lightGreen,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.qr_code_2_rounded, size: 24, color: _green),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'View Farm Traceability QR & Details',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _green,
                        ),
                      ),
                    ),
                    const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: _green),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        SizedBox(
          width: 105,
          child: Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
              color: _slate500,
            ),
          ),
        ),
        const Text(':  ', style: TextStyle(color: _slate500, fontSize: 12.5)),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
              color: _slate900,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatusRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: 105,
          child: Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
              color: _slate500,
            ),
          ),
        ),
        const Text(':  ', style: TextStyle(color: _slate500, fontSize: 12.5)),
        Container(
          width: 7,
          height: 7,
          decoration: const BoxDecoration(
            color: _green,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 5),
        Expanded(
          child: Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12.5,
              fontWeight: FontWeight.w800,
              color: _green,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNutritionTab(Product product) {
    final nutritionItems = const [
      ('Energy', '52 kcal'),
      ('Protein', '2.6 g'),
      ('Carbohydrates', '14.3 g'),
      ('Dietary Fiber', '5.4 g'),
      ('Vitamin C', '228 mg (High)'),
      ('Potassium', '417 mg'),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Nutritional Facts (Per 100g)',
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 12),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 2.3,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            children: [
              for (final item in nutritionItems)
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _lightGreen,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        item.$1,
                        style: GoogleFonts.plusJakartaSans(fontSize: 11, color: _slate500),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.$2,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
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

  Widget _buildReviewsTab(Product product) {
    final reviews = const [
      (
        'Rajesh Patel',
        'Pune, Maharashtra',
        5,
        'Extremely fresh and delicious! Soft texture and wonderful fragrance right out of the box.',
      ),
      (
        'Sunita Kulkarni',
        'Shirur',
        5,
        'Direct farm quality is noticeable. No chemical taste, delivered fresh the same day.',
      ),
      (
        'Amit Deshmukh',
        'Pune',
        4,
        'Good packaging and on-time delivery. Will definitely buy again.',
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: _border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Customer Reviews',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: _slate900,
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.star_rounded, size: 18, color: Color(0xFFF59E0B)),
                  const SizedBox(width: 4),
                  Text(
                    '${product.ratings > 0 ? product.ratings.toStringAsFixed(1) : "4.8"} / 5.0',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: _slate900,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          for (final r in reviews) ...[
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        r.$1,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
                        ),
                      ),
                      Row(
                        children: [
                          for (int i = 0; i < r.$3; i++)
                            const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    r.$2,
                    style: GoogleFonts.plusJakartaSans(fontSize: 10.5, color: _slate500),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    r.$4,
                    style: GoogleFonts.plusJakartaSans(fontSize: 12, height: 1.35, color: _slate700),
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
