import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  final List<Map<String, dynamic>> _mockOrders = const [
    {
      'orderNumber': 'ORD-FRM-9021',
      'produce': 'Brinjal (Pusa Purple Long)',
      'quantity': '150 Kg',
      'totalAmount': '₹5,250',
      'pickupDate': 'Today, 4:00 PM',
      'driverName': 'Dattatray Shinde',
      'status': 'Ready for Pickup',
      'statusColor': AppColors.primary,
    },
    {
      'orderNumber': 'ORD-FRM-9018',
      'produce': 'Hybrid Tomatoes (Grade A)',
      'quantity': '200 Kg',
      'totalAmount': '₹5,600',
      'pickupDate': 'Tomorrow, 9:00 AM',
      'driverName': 'Assigned Driver',
      'status': 'Preparing',
      'statusColor': Colors.amber,
    },
    {
      'orderNumber': 'ORD-FRM-8994',
      'produce': 'Nashik Red Onions',
      'quantity': '300 Kg',
      'totalAmount': '₹9,600',
      'pickupDate': 'Yesterday',
      'driverName': 'Completed & Settled',
      'status': 'Completed',
      'statusColor': AppColors.success,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Harvest Orders & Pickups'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _mockOrders.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final order = _mockOrders[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order['orderNumber'] as String,
                      style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 13),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: (order['statusColor'] as Color).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        order['status'] as String,
                        style: TextStyle(color: order['statusColor'] as Color, fontWeight: FontWeight.bold, fontSize: 10),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  order['produce'] as String,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Qty: ${order['quantity']}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    Text('Payout: ${order['totalAmount']}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  ],
                ),
                const SizedBox(height: 8),
                const Divider(height: 1),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.local_shipping_outlined, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      'Pickup: ${order['pickupDate']}',
                      style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
