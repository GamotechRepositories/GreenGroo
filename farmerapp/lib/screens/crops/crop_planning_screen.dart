import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class CropPlanningScreen extends StatefulWidget {
  const CropPlanningScreen({super.key});

  @override
  State<CropPlanningScreen> createState() => _CropPlanningScreenState();
}

class _CropPlanningScreenState extends State<CropPlanningScreen> {
  final Map<String, bool> _expanded = {};

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final crops = FarmerState().crops;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Crop Planning (पीक नियोजन)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('26-Stage Lifecycle Tracking & Reports', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Info Banner
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.timeline, color: AppColors.primary, size: 24),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'प्रत्येक पिकाचा पेरणीपासून ते काढणीपर्यंतचा २६ टप्प्यांचा थेट ट्रॅकिंग व अहवाल अपलोड करा.',
                          style: TextStyle(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                Text(
                  'Ongoing Crop Plans (${crops.length})',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                const SizedBox(height: 10),

                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: crops.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final crop = crops[index];
                    final isExp = _expanded[crop.id] ?? false;

                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            crop.cropName,
                                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            'वाण: ${crop.variety} • क्षेत्र: ${crop.acreage} Acre',
                                            style: const TextStyle(fontSize: 12, color: AppColors.muted),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryLight,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        'टप्पा ${crop.stageIndex + 1}/26',
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Current Stage Indicator
                                Row(
                                  children: [
                                    const Icon(Icons.check_circle_outline, size: 16, color: AppColors.primary),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        'सध्याचा टप्पा: ${crop.status}',
                                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.text),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),

                                // Progress Bar
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: LinearProgressIndicator(
                                    value: crop.progress,
                                    backgroundColor: AppColors.borderLight,
                                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                                    minHeight: 7,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('पेरणी: ${crop.sowingDate}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                                    Text('अपेक्षित काढणी: ${crop.estHarvestDate}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                                  ],
                                ),
                                const SizedBox(height: 12),

                                // Action Buttons: Advance Stage & Upload Report
                                Row(
                                  children: [
                                    Expanded(
                                      child: OutlinedButton.icon(
                                        style: OutlinedButton.styleFrom(
                                          foregroundColor: AppColors.primary,
                                          side: const BorderSide(color: AppColors.primary),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                        ),
                                        icon: const Icon(Icons.upload_file, size: 16),
                                        label: const Text('प्रमाणपत्र अपलोड', style: TextStyle(fontSize: 12)),
                                        onPressed: () => _openCertUploadModal(context, crop),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                        ),
                                        icon: const Icon(Icons.arrow_forward, size: 16),
                                        label: const Text('पुढील टप्पा', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                        onPressed: () => _advanceCropStage(context, crop),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // Toggle Timeline
                          InkWell(
                            onTap: () {
                              setState(() {
                                _expanded[crop.id] = !isExp;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: const BoxDecoration(
                                border: Border(top: BorderSide(color: AppColors.border)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isExp ? 'संपूर्ण २६ टप्पे लपवा' : 'संपूर्ण २६ टप्पे पहा (View Full Timeline)',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                                  ),
                                  Icon(isExp ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down, size: 20, color: AppColors.primary),
                                ],
                              ),
                            ),
                          ),

                          // 26 Stages Full Timeline
                          if (isExp)
                            Container(
                              padding: const EdgeInsets.all(16),
                              color: AppColors.background,
                              child: ListView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: FarmerConstants.cropStatuses.length,
                                itemBuilder: (context, sIdx) {
                                  final stageName = FarmerConstants.cropStatuses[sIdx];
                                  final isDone = sIdx <= crop.stageIndex;
                                  final isCurrent = sIdx == crop.stageIndex;

                                  return Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Column(
                                        children: [
                                          Container(
                                            width: 22,
                                            height: 22,
                                            decoration: BoxDecoration(
                                              color: isDone ? AppColors.primary : Colors.white,
                                              shape: BoxShape.circle,
                                              border: Border.all(color: isDone ? AppColors.primary : AppColors.muted),
                                            ),
                                            child: Center(
                                              child: isDone
                                                  ? const Icon(Icons.check, size: 14, color: Colors.white)
                                                  : Text('${sIdx + 1}', style: const TextStyle(fontSize: 10, color: AppColors.muted)),
                                            ),
                                          ),
                                          if (sIdx < FarmerConstants.cropStatuses.length - 1)
                                            Container(
                                              width: 2,
                                              height: 26,
                                              color: isDone ? AppColors.primary : AppColors.border,
                                            ),
                                        ],
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Padding(
                                          padding: const EdgeInsets.only(top: 2),
                                          child: Text(
                                            stageName,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                                              color: isCurrent ? AppColors.primary : (isDone ? AppColors.text : AppColors.muted),
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (!isDone)
                                        TextButton(
                                          style: TextButton.styleFrom(padding: EdgeInsets.zero, visualDensity: VisualDensity.compact),
                                          onPressed: () {
                                            FarmerState().updateCropStage(crop.id, stageName);
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('टप्पा "$stageName" सेट केला!')),
                                            );
                                          },
                                          child: const Text('सेट करा', style: TextStyle(fontSize: 11, color: AppColors.primary)),
                                        ),
                                    ],
                                  );
                                },
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _advanceCropStage(BuildContext context, CropItem crop) {
    if (crop.stageIndex < FarmerConstants.cropStatuses.length - 1) {
      final nextStage = FarmerConstants.cropStatuses[crop.stageIndex + 1];
      FarmerState().updateCropStage(crop.id, nextStage);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('पुढील टप्पा "$nextStage" वर अपडेट केले गेले!'),
          backgroundColor: AppColors.primary,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('हे पीक आधीच शेवटच्या "Completed" टप्प्यावर आहे.')),
      );
    }
  }

  void _openCertUploadModal(BuildContext context, CropItem crop) {
    String selectedCert = FarmerConstants.certificateTypes.first['type']!;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SafeArea(
              top: false,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 20,
                  right: 20,
                  top: 20,
                  bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'प्रमाणपत्र अपलोड (${crop.cropName})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),

                  const Text('प्रमाणपत्राचा प्रकार निवडा (Certificate Type)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: selectedCert,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    items: FarmerConstants.certificateTypes.map((c) {
                      return DropdownMenuItem(
                        value: c['type'],
                        child: Text('${c['icon']} ${c['label']}', style: const TextStyle(fontSize: 12)),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedCert = val);
                    },
                  ),
                  const SizedBox(height: 16),

                  // Simulated upload box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withOpacity(0.4), style: BorderStyle.solid),
                    ),
                    child: Column(
                      children: const [
                        Icon(Icons.cloud_upload_outlined, size: 40, color: AppColors.primary),
                        SizedBox(height: 8),
                        Text('PDF, JPG किंवा PNG फाईल निवडा', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        Text('कमाल मर्यादा: 10 MB', style: TextStyle(fontSize: 11, color: AppColors.muted)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('$selectedCert यशस्वीरीत्या अपलोड केले गेले!'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                      },
                      child: const Text('अपलोड करा (Submit Certificate)', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          );
        },
      );
    },
    );
  }
}
