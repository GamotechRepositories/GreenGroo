import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/crop_plan.dart';

class CropsScreen extends StatefulWidget {
  const CropsScreen({super.key});

  @override
  State<CropsScreen> createState() => _CropsScreenState();
}

class _CropsScreenState extends State<CropsScreen> {
  int _selectedTabIndex = 0; // 0: Active Crops, 1: Crop Planning Lifecycle

  final List<CropPlan> _mockCrops = [
    CropPlan(
      id: 'GGC-CRP-001',
      cropName: 'Brinjal',
      variety: 'Pusa Purple Long',
      farmLocation: 'Shree Ganesh Farm, Plot A',
      farmAreaAcres: 1.5,
      sowingDate: DateTime(2026, 6, 15),
      expectedHarvestDate: DateTime(2026, 10, 14),
      currentStage: 'Harvest Readiness',
      estimatedProductionKg: 850,
      status: 'Active',
    ),
    CropPlan(
      id: 'GGC-CRP-002',
      cropName: 'Tomato',
      variety: 'Hybrid Abhinav',
      farmLocation: 'Shree Ganesh Farm, Plot B',
      farmAreaAcres: 2.0,
      sowingDate: DateTime(2026, 7, 1),
      expectedHarvestDate: DateTime(2026, 11, 2),
      currentStage: 'Crop Growth Monitoring',
      estimatedProductionKg: 1200,
      status: 'Active',
    ),
    CropPlan(
      id: 'GGC-CRP-003',
      cropName: 'Onion',
      variety: 'Nashik Red',
      farmLocation: 'Shree Ganesh Farm, Plot C',
      farmAreaAcres: 1.0,
      sowingDate: DateTime(2026, 8, 10),
      expectedHarvestDate: DateTime(2026, 12, 1),
      currentStage: 'Sowing/Plantation Completed',
      estimatedProductionKg: 2000,
      status: 'Active',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Crops & Planning'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
          ),
        ],
      ),
      body: Column(
        children: [
          // Tab Toggle Header
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: ChoiceChip(
                    label: const Text('Active Crops'),
                    selected: _selectedTabIndex == 0,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: _selectedTabIndex == 0 ? Colors.white : AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedTabIndex = 0);
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ChoiceChip(
                    label: const Text('26 Stages Lifecycle'),
                    selected: _selectedTabIndex == 1,
                    selectedColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: _selectedTabIndex == 1 ? Colors.white : AppColors.textSecondary,
                      fontWeight: FontWeight.bold,
                    ),
                    onSelected: (selected) {
                      if (selected) setState(() => _selectedTabIndex = 1);
                    },
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Tab Content
          Expanded(
            child: _selectedTabIndex == 0 ? _buildActiveCropsList() : _buildLifecycleStagesList(),
          ),
        ],
      ),
    );
  }

  Widget _buildActiveCropsList() {
    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _mockCrops.length,
      separatorBuilder: (_, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final crop = _mockCrops[index];
        final currentStageIdx = CropPlan.allStages.indexOf(crop.currentStage);
        final progress = currentStageIdx >= 0 ? (currentStageIdx + 1) / CropPlan.allStages.length : 0.5;

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
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${crop.cropName} (${crop.variety})',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      Text(
                        crop.farmLocation,
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${crop.farmAreaAcres} Acres',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Current Stage Badge
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, color: AppColors.primary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Current Agricultural Stage', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                          Text(
                            crop.currentStage,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      'Stage ${currentStageIdx + 1}/26',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),

              // Stage progress bar
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: progress,
                  backgroundColor: AppColors.borderLight,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                  minHeight: 6,
                ),
              ),
              const SizedBox(height: 12),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Est. Production: ${crop.estimatedProductionKg} Kg',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  OutlinedButton(
                    onPressed: () {
                      setState(() => _selectedTabIndex = 1);
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    ),
                    child: const Text('Update Stage', style: TextStyle(fontSize: 11, color: AppColors.primary)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLifecycleStagesList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: CropPlan.allStages.length,
      itemBuilder: (context, index) {
        final stageName = CropPlan.allStages[index];
        final isCompleted = index < 20;
        final isCurrent = index == 20;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isCurrent ? AppColors.primaryLight : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isCurrent ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? AppColors.primary
                      : isCurrent
                          ? AppColors.primary
                          : Colors.grey.shade200,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, size: 16, color: Colors.white)
                      : Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isCurrent ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  stageName,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                    color: isCurrent ? AppColors.primary : AppColors.textPrimary,
                  ),
                ),
              ),
              if (isCurrent)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Text('In Progress', style: TextStyle(color: Colors.white, fontSize: 10)),
                ),
            ],
          ),
        );
      },
    );
  }
}
