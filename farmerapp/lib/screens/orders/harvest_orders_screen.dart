import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class HarvestOrdersScreen extends StatelessWidget {
  const HarvestOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final harvestOrders = FarmerState().harvestOrders;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Harvest Orders (काढणी ऑर्डर्स)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('Grade A / B / C Harvest Batches & Pickups', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info Card
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.assignment_outlined, color: AppColors.primary, size: 24),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'शेतमालाची काढणी व प्रतवारी (Grading) नुसार पिकअप लॉट तयार करा.',
                          style: TextStyle(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  'Harvest Batches (${harvestOrders.length})',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                const SizedBox(height: 10),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: harvestOrders.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, index) {
                    final item = harvestOrders[index];
                    return _HarvestOrderCard(item: item);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HarvestOrderCard extends StatelessWidget {
  final HarvestOrderItem item;
  const _HarvestOrderCard({required this.item});

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
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.cropName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                  const SizedBox(height: 2),
                  Text('बॅच: ${item.batchCode}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: item.status == 'Completed' ? AppColors.successLight : AppColors.infoLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  item.status,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: item.status == 'Completed' ? AppColors.success : AppColors.info,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Grade A / B / C breakdown table
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                _GradeCol(
                  title: 'Grade A',
                  qty: '${item.gradeAQty.toStringAsFixed(0)} ${item.unit}',
                  headColor: AppColors.gradeAHead,
                  textColor: AppColors.gradeAText,
                ),
                _GradeCol(
                  title: 'Grade B',
                  qty: '${item.gradeBQty.toStringAsFixed(0)} ${item.unit}',
                  headColor: AppColors.gradeBHead,
                  textColor: AppColors.gradeBText,
                ),
                _GradeCol(
                  title: 'Grade C',
                  qty: '${item.gradeCQty.toStringAsFixed(0)} ${item.unit}',
                  headColor: AppColors.gradeCHead,
                  textColor: AppColors.gradeCText,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 13, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Text('काढणी: ${item.harvestDate}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                ],
              ),
              Text(
                'एकूण: ${item.totalQty.toStringAsFixed(0)} ${item.unit}',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.text),
              ),
            ],
          ),
          const SizedBox(height: 6),

          Row(
            children: [
              const Icon(Icons.access_time, size: 13, color: AppColors.muted),
              const SizedBox(width: 4),
              Text('पिकअप स्लॉट: ${item.pickupSlot}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
            ],
          ),
        ],
      ),
    );
  }
}

class _GradeCol extends StatelessWidget {
  final String title;
  final String qty;
  final Color headColor;
  final Color textColor;

  const _GradeCol({
    required this.title,
    required this.qty,
    required this.headColor,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 4),
            color: headColor,
            child: Center(
              child: Text(
                title,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor),
              ),
            ),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Center(
              child: Text(
                qty,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.text),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
