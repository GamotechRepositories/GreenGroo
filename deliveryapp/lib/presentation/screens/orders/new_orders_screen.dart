import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../widgets/cards/order_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class NewOrdersScreen extends StatelessWidget {
  const NewOrdersScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context) {
    final body = ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: const [
        OrderCard(
          storeName: 'Store Name',
          customerName: 'Customer Name',
          pickupAddress: 'Pickup address line',
          dropAddress: 'Drop address line',
          distance: '— km',
          estimatedEarnings: '₹ —',
          estimatedTime: '— min',
        ),
        SizedBox(height: AppSpacing.md),
        OrderCard(
          storeName: 'Store Name',
          customerName: 'Customer Name',
          pickupAddress: 'Pickup address line',
          dropAddress: 'Drop address line',
          distance: '— km',
          estimatedEarnings: '₹ —',
          estimatedTime: '— min',
        ),
        SizedBox(height: AppSpacing.md),
        OrderCard(
          storeName: 'Store Name',
          customerName: 'Customer Name',
          pickupAddress: 'Pickup address line',
          dropAddress: 'Drop address line',
          distance: '— km',
          estimatedEarnings: '₹ —',
          estimatedTime: '— min',
        ),
      ],
    );

    if (embedded) return body;

    return Scaffold(
      appBar: const CustomAppBar(
        title: 'New Orders',
        subtitle: 'Accept orders to start earning',
        showBackButton: true,
      ),
      body: body,
    );
  }
}
