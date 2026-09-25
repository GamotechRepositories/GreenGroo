import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/app_loader.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../crops/add_crop_screen.dart';
import '../crops/crop_planning_screen.dart';
import '../products/add_product_screen.dart';
import '../notifications/notifications_screen.dart';
import '../main_shell.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

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
        final pendingHarvest = liveOrders.where((o) => !_isClosedOrder(o)).length;
        final settledOrders = liveOrders.where(_isEarningOrder).toList();
        final totalEarned = settledOrders.fold<double>(0, (sum, o) => sum + _orderAmount(o));
        final pendingEarned = settledOrders.where((o) => !_isPaidOrder(o)).fold<double>(0, (sum, o) => sum + _orderAmount(o));
        final totalStock = state.totalStockKg;
        final grades = _gradeTotals(liveOrders, products);
        final firstName = profile.fullName.trim().isEmpty ? 'शेतकरी' : profile.fullName.trim().split(RegExp(r'\s+')).first;
        final place = [profile.village, profile.taluka, profile.district].where((part) => part.trim().isNotEmpty).join(', ');
        final farmLabel = profile.farmName.trim().isEmpty ? 'शेत' : profile.farmName.trim();
        final acres = profile.totalAcres;
        final acreText = acres == acres.roundToDouble() ? acres.toInt().toString() : acres.toStringAsFixed(1);
        final farmDetails = <String>[
          '${crops.length} पिके लागवडीखाली',
          if (profile.soilType.trim().isNotEmpty) profile.soilType.trim(),
          if (profile.irrigationType.trim().isNotEmpty) profile.irrigationType.trim(),
        ].join(' • ');
        final kyc = profile.kycStatus.trim().toUpperCase();
        final kycVerified = kyc.contains('VERIF') || kyc.contains('APPROV');

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.agriculture, color: AppColors.primary, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'GreenGrocc Farmer',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      Text(
                        'स्वागत आहे, $firstName',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
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
                    icon: const Icon(Icons.notifications_outlined, color: AppColors.primary, size: 26),
                    tooltip: 'सर्व सूचना (All Notifications)',
                  ),
                  if (state.unreadNotificationCount > 0)
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        child: Center(
                          child: Text(
                            '${state.unreadNotificationCount > 9 ? '9+' : state.unreadNotificationCount}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              height: 1,
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 4),
            ],
          ),
          body: !state.dashboardReady
              ? const AppLoader(message: 'माहिती लोड होत आहे...')
              : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Farm Banner with Weather & KYC
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              place.isEmpty ? '—' : place,
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white24,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              kycVerified ? 'KYC Verified ✓' : 'KYC ${kyc.isEmpty ? 'PENDING' : kyc}',
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        '$farmLabel ($acreText ${profile.totalFarmAreaUnit})',
                        style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        farmDetails,
                        style: const TextStyle(color: Colors.white70, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Live Backend Status Strip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                  decoration: BoxDecoration(
                    color: state.isConnectedToBackend ? Colors.green.shade50 : Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: state.isConnectedToBackend ? Colors.green.shade300 : Colors.amber.shade300),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        state.isConnectedToBackend ? Icons.check_circle : Icons.cloud_queue,
                        size: 15,
                        color: state.isConnectedToBackend ? Colors.green.shade800 : Colors.amber.shade900,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          state.isConnectedToBackend
                              ? 'Live Backend Connected (${state.backendUrl.replaceAll("https://", "").replaceAll("http://", "")})'
                              : 'Connecting to Backend / Offline Mode',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: state.isConnectedToBackend ? Colors.green.shade800 : Colors.amber.shade900,
                          ),
                        ),
                      ),
                      if (state.isLoadingFromBackend)
                        const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // Quick Action Bar
                Row(
                  children: [
                    Expanded(
                      child: _QuickBtn(
                        icon: Icons.add_circle_outline,
                        label: 'Add Crop',
                        color: AppColors.primary,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen())),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _QuickBtn(
                        icon: Icons.inventory_2_outlined,
                        label: 'Add Product',
                        color: Colors.blue.shade700,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen())),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _QuickBtn(
                        icon: Icons.timeline,
                        label: 'Planning',
                        color: Colors.amber.shade800,
                        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanningScreen())),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Requirements Stat Cards matching DashboardPage.jsx
                const Text(
                  'Dashboard Overview (थेट आढावा)',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        title: 'Total Products',
                        value: '${products.length}',
                        icon: Icons.inventory_2,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatCard(
                        title: 'Harvest Orders',
                        value: '${liveOrders.length}',
                        icon: Icons.assignment,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        title: 'Pending Harvest',
                        value: '$pendingHarvest',
                        icon: Icons.hourglass_top,
                        color: Colors.purple.shade700,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatCard(
                        title: 'Total Stock',
                        value: '${totalStock.toStringAsFixed(0)} Kg',
                        icon: Icons.scale,
                        color: Colors.teal.shade700,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: _StatCard(
                        title: 'Total Earnings',
                        value: '₹ ${totalEarned.toStringAsFixed(0)}',
                        icon: Icons.account_balance_wallet,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _StatCard(
                        title: 'Pending Payout',
                        value: '₹ ${pendingEarned.toStringAsFixed(0)}',
                        icon: Icons.pending_actions,
                        color: AppColors.warning,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 22),

                // Ongoing Crop Plans with Lifecycle Progress
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Expanded(
                      child: Text(
                        'Ongoing Crop Plans (पीक नियोजन)',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanningScreen()));
                      },
                      child: const Text('View All →', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (crops.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(bottom: 12),
                    child: Text(
                      'कोणतेही पीक नियोजन नाही',
                      style: TextStyle(fontSize: 12, color: AppColors.muted),
                    ),
                  ),
                ...crops.take(2).map((crop) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${crop.cropName} (${crop.variety})',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  'टप्पा ${crop.stageIndex + 1}/26',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'सध्याचा टप्पा: ${crop.status}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                          ),
                          const SizedBox(height: 8),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: LinearProgressIndicator(
                              value: crop.progress,
                              backgroundColor: AppColors.borderLight,
                              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                              minHeight: 6,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('अपेक्षित काढणी: ${crop.estHarvestDate}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                              InkWell(
                                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CropPlanningScreen())),
                                child: const Text('प्रगती बदला →', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
                const SizedBox(height: 20),

                // Product Grade Summary Box matching web ProductGradeChart
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'All Products Quality Grade Summary',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _GradeMetric(
                              title: 'Grade A',
                              qty: _qtyLabel(grades.$1),
                              bgColor: AppColors.gradeAHead,
                              textColor: AppColors.gradeAText,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _GradeMetric(
                              title: 'Grade B',
                              qty: _qtyLabel(grades.$2),
                              bgColor: AppColors.gradeBHead,
                              textColor: AppColors.gradeBText,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _GradeMetric(
                              title: 'Grade C',
                              qty: _qtyLabel(grades.$3),
                              bgColor: AppColors.gradeCHead,
                              textColor: AppColors.gradeCText,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        );
      },
    );
  }
}

bool _isClosedOrder(FarmerOrderItem order) {
  final status = order.status.toUpperCase();
  return status.contains('COMPLET') ||
      status.contains('DELIVER') ||
      status.contains('REJECT') ||
      status.contains('CANCEL') ||
      status.contains('GRADE_CONFIRM');
}

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

(double, double, double) _gradeTotals(List<FarmerOrderItem> orders, List<ProductItem> products) {
  var gradeA = 0.0;
  var gradeB = 0.0;
  var gradeC = 0.0;
  for (final order in orders) {
    gradeA += order.gradeAQty > 0 ? order.gradeAQty : order.shownAQty;
    gradeB += order.gradeBQty > 0 ? order.gradeBQty : order.shownBQty;
    gradeC += order.gradeCQty > 0 ? order.gradeCQty : order.shownCQty;
  }
  if (gradeA <= 0 && gradeB <= 0 && gradeC <= 0) {
    for (final product in products) {
      if (product.gradeAQty > 0 || product.gradeBQty > 0 || product.gradeCQty > 0) {
        gradeA += product.gradeAQty;
        gradeB += product.gradeBQty;
        gradeC += product.gradeCQty;
        continue;
      }
      final qty = product.unit.toLowerCase() == 'quintal' ? product.stockQuantity * 100 : product.stockQuantity;
      final grade = product.grade.toUpperCase();
      if (grade.contains('C')) {
        gradeC += qty;
      } else if (grade.contains('B')) {
        gradeB += qty;
      } else if (grade.contains('A')) {
        gradeA += qty;
      }
    }
  }
  return (gradeA, gradeB, gradeC);
}

String _qtyLabel(double qty) {
  final text = qty == qty.roundToDouble() ? qty.toInt().toString() : qty.toStringAsFixed(1);
  return '$text Kg';
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 11, color: AppColors.muted)),
              Icon(icon, size: 18, color: color),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}

class _QuickBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }
}

class _GradeMetric extends StatelessWidget {
  final String title;
  final String qty;
  final Color bgColor;
  final Color textColor;

  const _GradeMetric({
    required this.title,
    required this.qty,
    required this.bgColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(title, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor)),
          const SizedBox(height: 4),
          Text(qty, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: textColor)),
        ],
      ),
    );
  }
}
