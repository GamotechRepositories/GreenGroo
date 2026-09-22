import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import 'add_crop_screen.dart';
import 'crop_planning_screen.dart';
import '../products/add_product_screen.dart';

class CropDetailScreen extends StatelessWidget {
  final CropItem crop;

  const CropDetailScreen({super.key, required this.crop});

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete crop?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        content: const Text('This will also remove the crop plan. This cannot be undone.', style: TextStyle(fontSize: 13, color: AppColors.muted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogCtx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.muted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              FarmerState().deleteCrop(crop.id);
              Navigator.pop(dialogCtx); // close dialog
              Navigator.pop(context); // go back from detail
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Crop deleted successfully'), backgroundColor: Colors.red),
              );
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final businessId = crop.businessId;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(crop.cropName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: AppColors.primary),
            tooltip: 'Edit Crop',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => AddCropScreen(editCrop: crop)),
              );
            },
          ),
          IconButton(
            icon: Icon(Icons.delete_outline, color: Colors.red.shade600),
            tooltip: 'Delete Crop',
            onPressed: () => _confirmDelete(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card matching CropDetailPage.jsx
            Container(
              width: double.infinity,
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
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              crop.cropName,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${crop.variety} • ${crop.farmName} • ${crop.farmLocation}',
                              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          crop.status,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Copyable Business ID
                  InkWell(
                    onTap: () {
                      Clipboard.setData(ClipboardData(text: businessId));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Crop ID copied to clipboard'), duration: Duration(seconds: 2)),
                      );
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            businessId,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                              color: AppColors.primaryDark,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Icon(Icons.copy, size: 12, color: AppColors.primary),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Action Buttons matching CropDetailPage
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.add_shopping_cart, size: 16),
                    label: const Text('Add Product', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => AddProductScreen(prefilledCrop: crop.cropName)),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primaryDark,
                      side: const BorderSide(color: AppColors.primary),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.timeline, size: 16),
                    label: const Text('Plan Production', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const CropPlanningScreen()),
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Crop Details Section matching EXCEL_PANEL
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
                      border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: const Text(
                      'Crop Details (तपशील)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                  ),
                  _DetailRow(label: 'Crop Name', value: crop.cropName),
                  _DetailRow(label: 'Crop ID', value: businessId, isMonospace: true),
                  _DetailRow(label: 'Variety', value: crop.variety),
                  _DetailRow(label: 'Area', value: '${crop.acreage} ${crop.areaUnit}'),
                  _DetailRow(label: 'Sowing Date', value: crop.sowingDate),
                  _DetailRow(label: 'Expected Harvest Date', value: crop.estHarvestDate),
                  _DetailRow(label: 'Estimated Quantity', value: '${crop.estimatedQuantity.toStringAsFixed(0)} ${crop.unit}'),
                  _DetailRow(label: 'Farming Method', value: crop.farmingMethod),
                  _DetailRow(label: 'Irrigation Type', value: crop.irrigationType),
                  _DetailRow(label: 'Organic / Conventional', value: crop.farmingType),
                  _DetailRow(label: 'Soil Type', value: crop.soilType),
                  _DetailRow(label: 'Farm Name', value: crop.farmName),
                  _DetailRow(label: 'Farm Location', value: crop.farmLocation, isLast: true),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // 26-Stage Planning Progress
            Container(
              width: double.infinity,
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
                      const Text(
                        '26-Stage Lifecycle Progress',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                      Text(
                        'टप्पा ${crop.stageIndex + 1}/26',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: crop.progress,
                      backgroundColor: AppColors.borderLight,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'सध्याचा टप्पा: ${crop.status}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isMonospace;
  final bool isLast;

  const _DetailRow({
    required this.label,
    required this.value,
    this.isMonospace = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
      decoration: BoxDecoration(
        border: isLast ? null : Border(bottom: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: isMonospace ? 'monospace' : null,
                color: isMonospace ? AppColors.primaryDark : AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
