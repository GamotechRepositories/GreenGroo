import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import 'harvest_orders_screen.dart';
import '../main_shell.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: FarmerConstants.orderTabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allOrders = FarmerState().orders;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text('Farmer Orders (ऑर्डर्स)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            actions: [
              TextButton.icon(
                icon: const Icon(Icons.assignment, size: 16, color: AppColors.primary),
                label: const Text('Harvest Batches', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const HarvestOrdersScreen()));
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.muted,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              tabs: FarmerConstants.orderTabs.map((tab) {
                final count = allOrders.where((o) => o.status == tab).length;
                return Tab(text: '$tab ($count)');
              }).toList(),
            ),
          ),
          body: TabBarView(
            controller: _tabController,
            children: FarmerConstants.orderTabs.map((tabName) {
              final tabOrders = allOrders.where((o) => o.status == tabName).toList();

              if (tabOrders.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_bag_outlined, size: 48, color: AppColors.muted),
                      const SizedBox(height: 12),
                      Text('या वर्गात कोणतीही ऑर्डर नाही ($tabName)', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.muted)),
                    ],
                  ),
                );
              }

              return ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: tabOrders.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final order = tabOrders[index];
                  return _OrderCard(order: order);
                },
              );
            }).toList(),
          ),
        );
      },
    );
  }
}

class _OrderCard extends StatelessWidget {
  final FarmerOrderItem order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
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
                order.orderCode,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
              ),
              Text(
                '₹ ${order.totalAmount.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text('खरेदीदार: ${order.buyerName} • ${order.buyerPhone}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          const Divider(height: 18),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('उत्पादन व प्रमाण (Items)', style: TextStyle(fontSize: 10, color: AppColors.muted)),
                  Text(
                    '${order.productName} (${order.quantity.toStringAsFixed(0)} ${order.unit})',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('पिकअप वेळ', style: TextStyle(fontSize: 10, color: AppColors.muted)),
                  Text(
                    order.pickupSlot,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Order State Action Buttons
          _buildActionButtons(context),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    if (order.status == 'New Orders') {
      return Row(
        children: [
          Expanded(
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              onPressed: () => _rejectOrderDialog(context),
              child: const Text('नकार द्या (Reject)'),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 8),
              ),
              onPressed: () {
                FarmerState().updateOrderStatus(order.id, 'Preparing');
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('ऑर्डर स्वीकारली, तयारी सुरू केली (Preparing)!')),
                );
              },
              child: const Text('स्वीकारा (Accept)'),
            ),
          ),
        ],
      );
    } else if (order.status == 'Preparing') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.info,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
          ),
          icon: const Icon(Icons.check, size: 16),
          label: const Text('पिकअपसाठी तयार (Mark Ready for Pickup)'),
          onPressed: () {
            FarmerState().updateOrderStatus(order.id, 'Ready for Pickup');
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('ऑर्डर पिकअपसाठी तयार म्हणून चिन्हांकित केली!')),
            );
          },
        ),
      );
    } else if (order.status == 'Ready for Pickup') {
      return SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.success,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
          ),
          icon: const Icon(Icons.done_all, size: 16),
          label: const Text('हस्तांतरित पूर्ण (Mark Completed)'),
          onPressed: () {
            FarmerState().updateOrderStatus(order.id, 'Completed');
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('ऑर्डर यशस्वीरीत्या पूर्ण झाली! रक्कम खात्यात जमा होईल.')),
            );
          },
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: order.status == 'Completed' ? AppColors.successLight : AppColors.errorLight,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            order.status == 'Completed' ? 'ऑर्डर यशस्वीरीत्या पूर्ण ✓' : 'ऑर्डर नाकारली गेली ✕',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: order.status == 'Completed' ? AppColors.success : AppColors.error,
            ),
          ),
        ),
      );
    }
  }

  void _rejectOrderDialog(BuildContext context) {
    String reason = 'Stock Unavailable (साठा उपलब्ध नाही)';
    final reasons = [
      'Stock Unavailable (साठा उपलब्ध नाही)',
      'Quality Issue (गुणवत्ता समस्या)',
      'Pickup Issue (पिकअप अडचण)',
      'Quantity Mismatch (प्रमाणात तफावत)',
    ];

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: const Text('ऑर्डर नाकारण्याचे कारण'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: reasons.map((r) {
                  return RadioListTile<String>(
                    title: Text(r, style: const TextStyle(fontSize: 12)),
                    value: r,
                    groupValue: reason,
                    onChanged: (val) => setState(() => reason = val!),
                  );
                }).toList(),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('रद्द करा')),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                  onPressed: () {
                    FarmerState().updateOrderStatus(order.id, 'Rejected');
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('ऑर्डर नाकारली ($reason)')),
                    );
                  },
                  child: const Text('Confirm Reject'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}
