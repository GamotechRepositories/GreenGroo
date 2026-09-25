import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class CropPlanningScreen extends StatefulWidget {
  const CropPlanningScreen({super.key});

  @override
  State<CropPlanningScreen> createState() => _CropPlanningScreenState();
}

class _CropPlanningScreenState extends State<CropPlanningScreen> {
  final Map<String, bool> _expanded = {};
  
  // Custom stage lists per crop ID (allows adding intermediate stages)
  final Map<String, List<Map<String, dynamic>>> _cropStages = {};

  // Store custom logged entries & uploads per cropId & stageIndex
  final Map<String, Map<int, Map<String, dynamic>>> _stageLogs = {};

  List<Map<String, dynamic>> _getStagesForCrop(String cropId) {
    if (!_cropStages.containsKey(cropId) || _cropStages[cropId]!.isEmpty) {
      _cropStages[cropId] = List<Map<String, dynamic>>.from(
        FarmerConstants.cropPlanning22Stages.map((s) => Map<String, dynamic>.from(s)),
      );
    }
    return _cropStages[cropId]!;
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final crops = FarmerState().crops;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            elevation: 0.5,
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Crop Planning (पीक नियोजन)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                Text('२२ टप्पे • फोटो/PDF अपलोड • नियोजन', style: TextStyle(fontSize: 10.5, color: AppColors.muted)),
              ],
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Compact Top Strip
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.timeline_rounded, color: AppColors.primary, size: 16),
                      SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '२२ टप्प्यांचे पीक नियोजन • अहवाल/फोटो अपलोड • मध्यभागी टप्पे जोडा',
                          style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),

                // Crops List
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: crops.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final crop = crops[index];
                    final isExpanded = _expanded[crop.id] ?? (index == 0);
                    final stagesList = _getStagesForCrop(crop.id);
                    final progress = (crop.stageIndex + 1) / stagesList.length;

                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Compact Crop Header
                          InkWell(
                            onTap: () {
                              setState(() {
                                _expanded[crop.id] = !isExpanded;
                              });
                            },
                            borderRadius: BorderRadius.circular(8),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              child: Row(
                                children: [
                                  Container(
                                    width: 34,
                                    height: 34,
                                    decoration: BoxDecoration(
                                      color: AppColors.primaryLight,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: const Center(
                                      child: Text('🌾', style: TextStyle(fontSize: 18)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Text(
                                              crop.cropName,
                                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                                            ),
                                            const SizedBox(width: 6),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                              decoration: BoxDecoration(
                                                color: AppColors.primary.withValues(alpha: 0.08),
                                                borderRadius: BorderRadius.circular(3),
                                              ),
                                              child: Text(
                                                crop.businessId,
                                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'वाण: ${crop.variety} • ${crop.acreage} ${crop.areaUnit} • लागवड: ${crop.sowingDate}',
                                          style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Expanded(
                                              child: ClipRRect(
                                                borderRadius: BorderRadius.circular(3),
                                                child: LinearProgressIndicator(
                                                  value: progress.clamp(0.0, 1.0),
                                                  backgroundColor: Colors.grey.shade200,
                                                  valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                                                  minHeight: 4,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              'टप्पा ${crop.stageIndex + 1}/${stagesList.length} (${(progress * 100).round()}%)',
                                              style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppColors.primary),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Icon(
                                    isExpanded ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                    size: 18,
                                    color: AppColors.muted,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Compact Sub Action Bar
                          if (isExpanded)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF1F5F9),
                                border: Border.symmetric(horizontal: BorderSide(color: Color(0xFFE2E8F0))),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  InkWell(
                                    onTap: () => _openAddCustomStageModal(context, crop),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.add_circle_outline, size: 13, color: Colors.teal.shade800),
                                          const SizedBox(width: 4),
                                          Text(
                                            '+ नवीन टप्पा जोडा',
                                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.teal.shade800),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  InkWell(
                                    onTap: () => _advanceCropStage(context, crop),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: const [
                                          Text('पुढील टप्पा', style: TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold)),
                                          SizedBox(width: 2),
                                          Icon(Icons.arrow_forward_ios, size: 9, color: Colors.white),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                          // Timeline Stages (Ultra Compact & Understandable)
                          if (isExpanded)
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: ListView.separated(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: stagesList.length,
                                separatorBuilder: (context, sIdx) {
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2),
                                    child: Row(
                                      children: [
                                        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 0.5, height: 8)),
                                        InkWell(
                                          onTap: () => _openAddCustomStageModal(context, crop, insertAfterIndex: sIdx),
                                          borderRadius: BorderRadius.circular(8),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: Colors.teal.shade200),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Icon(Icons.add, size: 10, color: Colors.teal.shade700),
                                                Text(
                                                  ' मध्यभागी टप्पा जोडा',
                                                  style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: Colors.teal.shade800),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        Expanded(child: Divider(color: Colors.grey.shade300, thickness: 0.5, height: 8)),
                                      ],
                                    ),
                                  );
                                },
                                itemBuilder: (context, sIdx) {
                                  final stage = stagesList[sIdx];
                                  final stageNumber = sIdx + 1;
                                  final stageName = stage['name'] as String;
                                  final marathiName = (stage['marathi'] ?? stageName) as String;
                                  final displayReq = (stage['display'] ?? 'नोंद व अहवाल') as String;
                                  final iconStr = (stage['icon'] ?? '🌱') as String;
                                  final canRepeat = stage['canRepeat'] as bool? ?? false;
                                  final isCustom = stage['isCustom'] as bool? ?? false;

                                  final isDone = sIdx <= crop.stageIndex;
                                  final isCurrent = sIdx == crop.stageIndex;

                                  final cropLogs = _stageLogs[crop.id] ?? {};
                                  final stageLog = cropLogs[sIdx];
                                  final attachments = (stageLog?['attachments'] as List<dynamic>?) ?? [];

                                  return Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isCurrent ? const Color(0xFFF0FDF4) : Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: isCurrent ? AppColors.primary : (isDone ? Colors.green.shade200 : const Color(0xFFE2E8F0)),
                                        width: isCurrent ? 1.2 : 0.8,
                                      ),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        // Header Row: Number + Icon + Title + Tags
                                        Row(
                                          crossAxisAlignment: CrossAxisAlignment.center,
                                          children: [
                                            // Stage Number Circle
                                            Container(
                                              width: 20,
                                              height: 20,
                                              decoration: BoxDecoration(
                                                color: isDone ? AppColors.primary : Colors.grey.shade200,
                                                shape: BoxShape.circle,
                                              ),
                                              child: Center(
                                                child: isDone
                                                    ? const Icon(Icons.check, size: 12, color: Colors.white)
                                                    : Text(
                                                        '$stageNumber',
                                                        style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppColors.muted),
                                                      ),
                                              ),
                                            ),
                                            const SizedBox(width: 6),
                                            Text(iconStr, style: const TextStyle(fontSize: 12)),
                                            const SizedBox(width: 4),
                                            Expanded(
                                              child: RichText(
                                                overflow: TextOverflow.ellipsis,
                                                text: TextSpan(
                                                  children: [
                                                    TextSpan(
                                                      text: 'टप्पा $stageNumber: $marathiName ',
                                                      style: TextStyle(
                                                        fontSize: 11.5,
                                                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.w600,
                                                        color: isCurrent ? AppColors.primaryDark : (isDone ? AppColors.text : const Color(0xFF475569)),
                                                      ),
                                                    ),
                                                    TextSpan(
                                                      text: '($stageName)',
                                                      style: const TextStyle(fontSize: 9.5, color: AppColors.muted),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            if (isCustom)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                                                margin: const EdgeInsets.only(right: 3),
                                                decoration: BoxDecoration(
                                                  color: Colors.teal.shade50,
                                                  borderRadius: BorderRadius.circular(3),
                                                  border: Border.all(color: Colors.teal.shade200),
                                                ),
                                                child: Text('Custom', style: TextStyle(fontSize: 8, color: Colors.teal.shade800, fontWeight: FontWeight.bold)),
                                              ),
                                            if (isCurrent)
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                                decoration: BoxDecoration(
                                                  color: AppColors.primary,
                                                  borderRadius: BorderRadius.circular(3),
                                                ),
                                                child: const Text('सध्याचा', style: TextStyle(fontSize: 8.5, color: Colors.white, fontWeight: FontWeight.bold)),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 4),

                                        // Requirement Tag (Compact & Clean)
                                        Container(
                                          width: double.infinity,
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFF1F5F9),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            '📋 दाखवायचे: $displayReq',
                                            style: const TextStyle(fontSize: 9.5, color: Color(0xFF334155), fontWeight: FontWeight.w500),
                                          ),
                                        ),

                                        // Logged Data details (Compact Grid / Tag View)
                                        if (stageLog != null) ...[
                                          const SizedBox(height: 4),
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(4),
                                              border: Border.all(color: const Color(0xFFE2E8F0)),
                                            ),
                                            child: Wrap(
                                              spacing: 8,
                                              runSpacing: 2,
                                              children: [
                                                if (stageLog['date'] != null)
                                                  Text('📅 ${stageLog['date']}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.text)),
                                                if (stageLog['activity'] != null)
                                                  Text('🚜 काम: ${stageLog['activity']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['soilReport'] != null)
                                                  Text('🧪 अहवाल: ${stageLog['soilReport']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['seedName'] != null)
                                                  Text('🌱 बियाणे: ${stageLog['seedName']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['treatment'] != null)
                                                  Text('💊 प्रक्रिया: ${stageLog['treatment']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['variety'] != null)
                                                  Text('🌾 वाण: ${stageLog['variety']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['fertilizerName'] != null)
                                                  Text('🧪 खत: ${stageLog['fertilizerName']} (${stageLog['quantity'] ?? ''})', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['irrigationType'] != null)
                                                  Text('💧 पाणी: ${stageLog['irrigationType']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['observation'] != null)
                                                  Text('👀 निरीक्षण: ${stageLog['observation']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['sprayName'] != null)
                                                  Text('🔄 फवारणी: ${stageLog['sprayName']} (${stageLog['dose'] ?? ''})', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['height'] != null)
                                                  Text('📏 उंची: ${stageLog['height']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['product'] != null)
                                                  Text('📦 औषध: ${stageLog['product']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['expectedHarvestDate'] != null)
                                                  Text('📅 काढणी: ${stageLog['expectedHarvestDate']}', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                                if (stageLog['harvestDate'] != null)
                                                  Text('✅ काढणी: ${stageLog['harvestDate']} (${stageLog['expectedQuantity'] ?? ''})', style: const TextStyle(fontSize: 10, color: Color(0xFF1E293B))),
                                              ],
                                            ),
                                          ),
                                          // Compact Repeats List
                                          if (stageLog['repeats'] != null && (stageLog['repeats'] as List).isNotEmpty)
                                            Padding(
                                              padding: const EdgeInsets.only(top: 2, left: 2),
                                              child: Text(
                                                '🔄 फवारण्या (${(stageLog['repeats'] as List).length}): ${(stageLog['repeats'] as List).map((r) => "${r['date']} (${r['spray']})").join(' • ')}',
                                                style: const TextStyle(fontSize: 9.5, color: Colors.orange, fontWeight: FontWeight.w600),
                                              ),
                                            ),
                                        ],

                                        // Compact Attachments List (Sleek Micro-Chips)
                                        if (attachments.isNotEmpty) ...[
                                          const SizedBox(height: 4),
                                          Wrap(
                                            spacing: 4,
                                            runSpacing: 4,
                                            children: attachments.asMap().entries.map((entry) {
                                              final attIdx = entry.key;
                                              final a = entry.value as Map<String, dynamic>;
                                              final isPdfFile = a['isPdf'] == true || a['name'].toString().toLowerCase().endsWith('.pdf');

                                              return InkWell(
                                                onTap: () => _openAttachmentPreviewModal(context, crop, sIdx, a, attIdx),
                                                borderRadius: BorderRadius.circular(4),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                  decoration: BoxDecoration(
                                                    color: isPdfFile ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                                                    borderRadius: BorderRadius.circular(4),
                                                    border: Border.all(color: isPdfFile ? const Color(0xFFFECACA) : const Color(0xFFBBF7D0)),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(
                                                        isPdfFile ? Icons.picture_as_pdf : Icons.image,
                                                        size: 11,
                                                        color: isPdfFile ? Colors.red.shade700 : Colors.green.shade700,
                                                      ),
                                                      const SizedBox(width: 4),
                                                      ConstrainedBox(
                                                        constraints: const BoxConstraints(maxWidth: 130),
                                                        child: Text(
                                                          '${a['name']}',
                                                          style: TextStyle(
                                                            fontSize: 9.5,
                                                            fontWeight: FontWeight.bold,
                                                            color: isPdfFile ? Colors.red.shade900 : Colors.green.shade900,
                                                          ),
                                                          overflow: TextOverflow.ellipsis,
                                                        ),
                                                      ),
                                                      const SizedBox(width: 3),
                                                      Text('(${a['size'] ?? ''})', style: const TextStyle(fontSize: 8.5, color: AppColors.muted)),
                                                      const SizedBox(width: 2),
                                                      const Icon(Icons.remove_red_eye_outlined, size: 10, color: AppColors.primary),
                                                    ],
                                                  ),
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                        ],

                                        const SizedBox(height: 6),

                                        // Action Buttons (Compact Wrap)
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          children: [
                                            // 📤 Upload Doc/Photo Button
                                            InkWell(
                                              onTap: () => _openStageUploadModal(context, crop, sIdx, marathiName),
                                              borderRadius: BorderRadius.circular(4),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: Colors.blue.shade50,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: Colors.blue.shade200),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(Icons.cloud_upload_outlined, size: 11, color: Colors.blue.shade800),
                                                    const SizedBox(width: 3),
                                                    Text('📤 अपलोड', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.blue.shade900)),
                                                  ],
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 4),

                                            // Repeat Spray Button
                                            if (canRepeat) ...[
                                              InkWell(
                                                onTap: () => _openRepeatSprayModal(context, crop, sIdx, marathiName),
                                                borderRadius: BorderRadius.circular(4),
                                                child: Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                  decoration: BoxDecoration(
                                                    color: Colors.orange.shade50,
                                                    borderRadius: BorderRadius.circular(4),
                                                    border: Border.all(color: Colors.orange.shade200),
                                                  ),
                                                  child: Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.replay, size: 11, color: Colors.orange.shade800),
                                                      const SizedBox(width: 3),
                                                      Text('🔄 फवारणी', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.orange.shade900)),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 4),
                                            ],

                                            // Log / Edit Entry Button
                                            InkWell(
                                              onTap: () => _openStageLogModal(context, crop, sIdx),
                                              borderRadius: BorderRadius.circular(4),
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: isCurrent ? AppColors.primary : Colors.grey.shade100,
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: isCurrent ? AppColors.primary : Colors.grey.shade300),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(Icons.edit, size: 10, color: isCurrent ? Colors.white : AppColors.text),
                                                    const SizedBox(width: 3),
                                                    Text(
                                                      stageLog == null ? 'नोंद करा' : 'बदल करा',
                                                      style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: isCurrent ? Colors.white : AppColors.text),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),

                                            // Set Active Stage Button
                                            if (!isDone) ...[
                                              const SizedBox(width: 4),
                                              InkWell(
                                                onTap: () {
                                                  FarmerState().updateCropStage(crop.id, stageName);
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(content: Text('टप्पा "$marathiName" सेट केला!')),
                                                  );
                                                },
                                                borderRadius: BorderRadius.circular(4),
                                                child: Padding(
                                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 3),
                                                  child: const Text('सेट करा', style: TextStyle(fontSize: 9.5, color: AppColors.primary, fontWeight: FontWeight.bold)),
                                                ),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
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
    final stagesList = _getStagesForCrop(crop.id);
    if (crop.stageIndex < stagesList.length - 1) {
      final nextStage = stagesList[crop.stageIndex + 1];
      FarmerState().updateCropStage(crop.id, nextStage['name']);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('पुढील टप्पा "${nextStage['marathi'] ?? nextStage['name']}" वर अपडेट केले गेले!'),
          backgroundColor: AppColors.primary,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('हे पीक आधीच शेवटच्या टप्प्यावर आहे.')),
      );
    }
  }

  // -------------------------------------------------------------
  // 1) ADD CUSTOM / INTERMEDIATE STAGE MODAL
  // -------------------------------------------------------------
  void _openAddCustomStageModal(BuildContext context, CropItem crop, {int? insertAfterIndex}) {
    final stagesList = _getStagesForCrop(crop.id);
    int selectedPosition = insertAfterIndex != null ? (insertAfterIndex + 1) : stagesList.length;

    final nameMarathiCtrl = TextEditingController();
    final nameEngCtrl = TextEditingController();
    final displayReqCtrl = TextEditingController(text: 'Date + Activity');
    String selectedIcon = '🌱';
    bool canRepeatSpray = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final bottomPadding = MediaQuery.of(context).padding.bottom;
            final keyboardInset = MediaQuery.of(context).viewInsets.bottom;

            return SafeArea(
              top: false,
              bottom: true,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  bottom: keyboardInset + (bottomPadding > 0 ? bottomPadding : 12) + 12,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            '+ नवीन टप्पा जोडा (Add Stage in Between)',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                          IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => Navigator.pop(context)),
                        ],
                      ),
                      const Divider(height: 12),

                      const Text('टप्पा कुठे जोडायचा? (Insert Position)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      DropdownButtonFormField<int>(
                        initialValue: selectedPosition.clamp(0, stagesList.length),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                        items: [
                          ...List.generate(stagesList.length, (i) {
                            final st = stagesList[i];
                            return DropdownMenuItem<int>(
                              value: i + 1,
                              child: Text('टप्पा ${i + 1} नंतर: ${st['marathi'] ?? st['name']}', style: const TextStyle(fontSize: 10.5), overflow: TextOverflow.ellipsis),
                            );
                          }),
                          DropdownMenuItem<int>(
                            value: stagesList.length,
                            child: const Text('शेवटी (At the End)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                          ),
                        ],
                        onChanged: (val) {
                          if (val != null) setModalState(() => selectedPosition = val);
                        },
                      ),
                      const SizedBox(height: 10),

                      const Text('टप्प्याचे नाव - मराठीत (Stage Name in Marathi)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      TextField(
                        controller: nameMarathiCtrl,
                        style: const TextStyle(fontSize: 11.5),
                        decoration: InputDecoration(
                          hintText: 'उदा. तणनाशक फवारणी / विशेष ड्रेंचिंग',
                          hintStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                      const SizedBox(height: 10),

                      const Text('Stage Name in English', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      TextField(
                        controller: nameEngCtrl,
                        style: const TextStyle(fontSize: 11.5),
                        decoration: InputDecoration(
                          hintText: 'e.g. Herbicide Spray / Micronutrient Drenching',
                          hintStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                      const SizedBox(height: 10),

                      const Text('काय दाखवायचे? (Display Requirement)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      TextField(
                        controller: displayReqCtrl,
                        style: const TextStyle(fontSize: 11.5),
                        decoration: InputDecoration(
                          hintText: 'उदा. Date + Activity + Spray Name',
                          hintStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Icon & Repeat Spray Checkbox
                      Row(
                        children: [
                          const Text('चिन्ह (Icon): ', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          const SizedBox(width: 6),
                          ...['🌱', '🚜', '💧', '🧪', '🌿', '🔄', '📋', '✅'].map((ic) {
                            final isSel = selectedIcon == ic;
                            return InkWell(
                              onTap: () => setModalState(() => selectedIcon = ic),
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 2),
                                padding: const EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: isSel ? AppColors.primaryLight : Colors.transparent,
                                  border: Border.all(color: isSel ? AppColors.primary : Colors.grey.shade300),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(ic, style: const TextStyle(fontSize: 14)),
                              ),
                            );
                          }),
                        ],
                      ),
                      const SizedBox(height: 6),

                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        value: canRepeatSpray,
                        dense: true,
                        title: const Text('🔄 पुन्हा फवारणी (Repeat Spray Option) सुरू ठेवा', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                        onChanged: (val) => setModalState(() => canRepeatSpray = val ?? false),
                      ),
                      const SizedBox(height: 12),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.teal.shade700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () {
                            final marathi = nameMarathiCtrl.text.trim();
                            final eng = nameEngCtrl.text.trim().isNotEmpty ? nameEngCtrl.text.trim() : marathi;

                            if (marathi.isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('कृपया टप्प्याचे नाव प्रविष्ट करा')),
                              );
                              return;
                            }

                            final newStageMap = {
                              'stage': selectedPosition + 1,
                              'name': eng,
                              'marathi': marathi,
                              'display': displayReqCtrl.text.trim(),
                              'icon': selectedIcon,
                              'canRepeat': canRepeatSpray,
                              'isCustom': true,
                              'fields': ['date', 'activity'],
                            };

                            final list = _getStagesForCrop(crop.id);
                            final pos = selectedPosition.clamp(0, list.length);
                            list.insert(pos, newStageMap);

                            for (int i = 0; i < list.length; i++) {
                              list[i]['stage'] = i + 1;
                            }
                            _cropStages[crop.id] = list;

                            Navigator.pop(context);
                            setState(() {});
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('नवीन टप्पा "$marathi" जोडला गेला! (एकूण टप्पे: ${list.length})'),
                                backgroundColor: AppColors.primary,
                              ),
                            );
                          },
                          child: const Text('टप्पा जोडा (Insert Custom Stage)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // -------------------------------------------------------------
  // 2) UPLOAD DOCUMENT / REPORT / PHOTO FOR ANY SPECIFIC STAGE
  // -------------------------------------------------------------
  void _openStageUploadModal(BuildContext context, CropItem crop, int stageIdx, String stageName) {
    String docType = 'लॅब अहवाल / Report';
    final fileNameCtrl = TextEditingController(text: '${stageName.replaceAll(' ', '_')}_Report_${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}.pdf');
    final noteCtrl = TextEditingController();
    String? selectedFileData;
    String? pickedSizeText;
    bool isPdf = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final bottomPadding = MediaQuery.of(context).padding.bottom;
            final keyboardInset = MediaQuery.of(context).viewInsets.bottom;

            Future<void> pickPhoto(ImageSource source) async {
              try {
                final picker = ImagePicker();
                final XFile? photo = await picker.pickImage(
                  source: source,
                  maxWidth: 1600,
                  maxHeight: 1600,
                  imageQuality: 85,
                );
                if (photo != null) {
                  final bytes = await photo.readAsBytes();
                  final b64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
                  final sizeKb = (bytes.lengthInBytes / 1024).round();
                  final sizeStr = sizeKb > 1024 ? '${(sizeKb / 1024).toStringAsFixed(1)} MB' : '$sizeKb KB';

                  setModalState(() {
                    selectedFileData = b64;
                    pickedSizeText = sizeStr;
                    isPdf = false;
                    fileNameCtrl.text = photo.name.isNotEmpty ? photo.name : 'Photo_${DateTime.now().millisecondsSinceEpoch}.jpg';
                  });
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('फोटो निवडताना एरर: $e')),
                  );
                }
              }
            }

            Future<void> pickPdf() async {
              try {
                final result = await FilePickerPlatform.instance.pickFiles(
                  type: FileType.custom,
                  allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
                );

                if (result.isNotEmpty) {
                  final file = result.first;
                  Uint8List? bytes;
                  if (file.path != null && file.path!.isNotEmpty) {
                    final f = File(file.path!);
                    if (await f.exists()) {
                      bytes = await f.readAsBytes();
                    }
                  }

                  if (bytes != null) {
                    final isFilePdf = file.name.toLowerCase().endsWith('.pdf');
                    final mime = isFilePdf ? 'application/pdf' : 'image/jpeg';
                    final b64 = 'data:$mime;name=${Uri.encodeComponent(file.name)};base64,${base64Encode(bytes)}';
                    final sizeKb = (bytes.lengthInBytes / 1024).round();
                    final sizeStr = sizeKb > 1024 ? '${(sizeKb / 1024).toStringAsFixed(1)} MB' : '$sizeKb KB';

                    setModalState(() {
                      selectedFileData = b64;
                      pickedSizeText = sizeStr;
                      isPdf = isFilePdf;
                      fileNameCtrl.text = file.name;
                    });
                  }
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('PDF निवडताना एरर: $e')),
                  );
                }
              }
            }

                        return SafeArea(
              top: false,
              bottom: true,
              child: Padding(
                padding: EdgeInsets.only(
                  left: 16,
                  right: 16,
                  top: 16,
                  bottom: keyboardInset + (bottomPadding > 0 ? bottomPadding : 12) + 12,
                ),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '📤 अहवाल/फोटो अपलोड ($stageName)',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                            ),
                          ),
                          IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => Navigator.pop(context)),
                        ],
                      ),
                      const Divider(height: 10),

                      const Text('दस्तऐवज प्रकार निवडा (Document Type)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      DropdownButtonFormField<String>(
                        initialValue: docType,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'लॅब अहवाल / Report', child: Text('🧪 लॅब अहवाल / Test Report', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'पिकाचा थेट फोटो (Field Photo)', child: Text('📸 पिकाचा थेट फोटो / Field Photo', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'खत/औषध पावती / Bill Receipt', child: Text('🧾 खत / औषध पावती (Bill Receipt)', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'माती परीक्षण अहवाल (Soil Report)', child: Text('🌱 माती परीक्षण अहवाल (Soil Report)', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'पाणी चाचणी अहवाल (Water Report)', child: Text('💧 पाणी चाचणी अहवाल (Water Report)', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'तपासणी प्रमाणपत्र (Inspection Cert)', child: Text('📋 तपासणी प्रमाणपत्र (Inspection Cert)', style: TextStyle(fontSize: 11))),
                          DropdownMenuItem(value: 'इतर अहवाल (Other File)', child: Text('📄 इतर अहवाल / Other File', style: TextStyle(fontSize: 11))),
                        ],
                        onChanged: (val) {
                          if (val != null) setModalState(() => docType = val);
                        },
                      ),
                      const SizedBox(height: 10),

                      // Photo / PDF Selection Action Buttons
                      const Text('फोटो किंवा PDF निवडा (Select Photo / PDF)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.green.shade800,
                                side: BorderSide(color: Colors.green.shade400),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              icon: const Icon(Icons.camera_alt, size: 14),
                              label: const Text('कॅमेरा', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                              onPressed: () => pickPhoto(ImageSource.camera),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.blue.shade800,
                                side: BorderSide(color: Colors.blue.shade400),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              icon: const Icon(Icons.photo_library, size: 14),
                              label: const Text('गॅलरी', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                              onPressed: () => pickPhoto(ImageSource.gallery),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: Colors.red.shade800,
                                side: BorderSide(color: Colors.red.shade400),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              icon: const Icon(Icons.picture_as_pdf, size: 14),
                              label: const Text('PDF फाईल', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                              onPressed: pickPdf,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),

                      

                      // Live Selected File Preview Box
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: selectedFileData != null ? (isPdf ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4)) : AppColors.background,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: selectedFileData != null ? (isPdf ? Colors.red.shade300 : Colors.green.shade400) : Colors.blue.shade300),
                        ),
                        child: selectedFileData != null
                            ? Row(
                                children: [
                                  if (!isPdf)
                                    ClipRRect(
                                      borderRadius: BorderRadius.circular(6),
                                      child: SizedBox(
                                        width: 40,
                                        height: 40,
                                        child: AppImageWidget(imageStr: selectedFileData!),
                                      ),
                                    )
                                  else
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        color: Colors.red.shade100,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: const Icon(Icons.picture_as_pdf, color: Colors.red, size: 22),
                                    ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          isPdf ? '📄 PDF डॉक्युमेंट निवडले' : '📸 फोटो निवडला गेला',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: isPdf ? Colors.red.shade900 : Colors.green.shade900,
                                          ),
                                        ),
                                        Text(
                                          '${fileNameCtrl.text} (${pickedSizeText ?? '2.1 MB'})',
                                          style: const TextStyle(fontSize: 10, color: AppColors.muted),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                    onPressed: () {
                                      setModalState(() {
                                        selectedFileData = null;
                                        pickedSizeText = null;
                                      });
                                    },
                                  ),
                                ],
                              )
                            : InkWell(
                                onTap: pickPdf,
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: const [
                                      Icon(Icons.cloud_upload_outlined, size: 18, color: Colors.blue),
                                      SizedBox(width: 6),
                                      Text('कॅमेरा, गॅलरी किंवा PDF फाईल निवडा (कमाल 20 MB)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                                    ],
                                  ),
                                ),
                              ),
                      ),
                      const SizedBox(height: 10),

                      const Text('फाईलचे नाव (File Name)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      TextField(
                        controller: fileNameCtrl,
                        style: const TextStyle(fontSize: 11.5),
                        decoration: InputDecoration(
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                      const SizedBox(height: 10),

                      const Text('नोंद किंवा तपशील (Note / Remarks)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 3),
                      TextField(
                        controller: noteCtrl,
                        style: const TextStyle(fontSize: 11.5),
                        decoration: InputDecoration(
                          hintText: 'उदा. लॅबचे नाव, रिझल्ट किंवा शेतातील स्थिती...',
                          hintStyle: const TextStyle(fontSize: 11),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        ),
                      ),
                      const SizedBox(height: 14),

                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue.shade800,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () {
                            final cropLogs = _stageLogs[crop.id] ?? {};
                            final updated = cropLogs[stageIdx] ?? {};
                            final existingAtts = List<Map<String, dynamic>>.from(updated['attachments'] ?? []);

                            final finalName = fileNameCtrl.text.trim().isNotEmpty ? fileNameCtrl.text.trim() : (isPdf ? 'Report.pdf' : 'Field_Photo.jpg');

                            existingAtts.add({
                              'name': finalName,
                              'type': docType,
                              'note': noteCtrl.text.trim(),
                              'date': '${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}',
                              'size': pickedSizeText ?? '1.5 MB',
                              'fileData': selectedFileData ?? '',
                              'isPdf': isPdf,
                            });

                            updated['attachments'] = existingAtts;
                            cropLogs[stageIdx] = updated;
                            _stageLogs[crop.id] = cropLogs;

                            Navigator.pop(context);
                            setState(() {});
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('$docType टप्पा #${stageIdx + 1} ला यशस्वीरीत्या जोडले गेले!'),
                                backgroundColor: AppColors.primary,
                              ),
                            );
                          },
                          child: const Text('अपलोड करा (Save & Attach)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  // -------------------------------------------------------------
  // 3) FULL ATTACHMENT PREVIEW & DETAILS MODAL
  // -------------------------------------------------------------
  void _openAttachmentPreviewModal(BuildContext context, CropItem crop, int stageIdx, Map<String, dynamic> att, int attIdx) {
    final isPdfFile = att['isPdf'] == true || att['name'].toString().toLowerCase().endsWith('.pdf');
    final fileData = att['fileData'] as String? ?? '';
    final fileName = att['name']?.toString() ?? 'Document';
    final fileType = att['type']?.toString() ?? 'Report';
    final fileDate = att['date']?.toString() ?? '';
    final fileSize = att['size']?.toString() ?? '';
    final fileNote = att['note']?.toString() ?? '';

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Icon(isPdfFile ? Icons.picture_as_pdf : Icons.image, color: isPdfFile ? Colors.red : Colors.green, size: 18),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              fileName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(height: 10),

                if (!isPdfFile && fileData.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxHeight: 250),
                      color: Colors.black12,
                      child: AppImageWidget(imageStr: fileData, fit: BoxFit.contain),
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isPdfFile ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isPdfFile ? Colors.red.shade200 : AppColors.border),
                    ),
                    child: Column(
                      children: [
                        Icon(isPdfFile ? Icons.picture_as_pdf : Icons.insert_drive_file, color: isPdfFile ? Colors.red : AppColors.primary, size: 40),
                        const SizedBox(height: 6),
                        Text(
                          isPdfFile ? 'PDF दस्तऐवज (PDF Document)' : 'फाईल तपशील',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                        ),
                        Text(
                          'प्रकार: $fileType • आकार: $fileSize',
                          style: const TextStyle(fontSize: 10, color: AppColors.muted),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 10),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('📁 प्रकार: $fileType', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                      if (fileDate.isNotEmpty)
                        Text('📅 दिनांक: $fileDate • 💾 आकार: $fileSize', style: const TextStyle(fontSize: 10, color: AppColors.muted)),
                      if (fileNote.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text('📝 नोंद: $fileNote', style: const TextStyle(fontSize: 10.5, color: AppColors.text, fontWeight: FontWeight.w500)),
                        ),
                    ],
                  ),
                ),

                const SizedBox(height: 12),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red.shade700,
                          side: BorderSide(color: Colors.red.shade300),
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        icon: const Icon(Icons.delete_outline, size: 14),
                        label: const Text('काढून टाका (Delete)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          final cropLogs = _stageLogs[crop.id] ?? {};
                          final updated = cropLogs[stageIdx] ?? {};
                          final existingAtts = List<Map<String, dynamic>>.from(updated['attachments'] ?? []);
                          if (attIdx < existingAtts.length) {
                            existingAtts.removeAt(attIdx);
                            updated['attachments'] = existingAtts;
                            cropLogs[stageIdx] = updated;
                            _stageLogs[crop.id] = cropLogs;
                          }
                          Navigator.pop(ctx);
                          setState(() {});
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('अहवाल यशस्वीरीत्या काढून टाकण्यात आला.')),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        ),
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('बंद करा (Close)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openRepeatSprayModal(BuildContext context, CropItem crop, int stageIdx, String stageName) {
    final sprayCtrl = TextEditingController();
    final doseCtrl = TextEditingController();
    final dateCtrl = TextEditingController(text: '${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        final bottomPadding = MediaQuery.of(context).padding.bottom;
        final keyboardInset = MediaQuery.of(context).viewInsets.bottom;

        return SafeArea(
          top: false,
          bottom: true,
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: keyboardInset + (bottomPadding > 0 ? bottomPadding : 12) + 12,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '🔄 पुन्हा फवारणी नोंदवा ($stageName)',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const Divider(height: 10),

                  const Text('फवारणी दिनांक (Date)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  TextField(
                    controller: dateCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.calendar_today, size: 16),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  const Text('औषध / स्प्रे नाव (Spray / Medicine Name)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  TextField(
                    controller: sprayCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      hintText: 'उदा. Proclaim / Tilt / Pegasus',
                      hintStyle: const TextStyle(fontSize: 11),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  const Text('प्रमाण / डोस (Dose & Target)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  TextField(
                    controller: doseCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      hintText: 'उदा. 1 gm/Ltr पाणी किंवा 200 ml/एकर',
                      hintStyle: const TextStyle(fontSize: 11),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 14),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange.shade800,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        final cropLogs = _stageLogs[crop.id] ?? {};
                        final existing = cropLogs[stageIdx] ?? {};
                        final repeats = List<Map<String, dynamic>>.from(existing['repeats'] ?? []);
                        repeats.add({
                          'date': dateCtrl.text.trim(),
                          'spray': sprayCtrl.text.trim().isNotEmpty ? sprayCtrl.text.trim() : 'Routine Spray',
                          'dose': doseCtrl.text.trim().isNotEmpty ? doseCtrl.text.trim() : 'Standard Dose',
                        });

                        existing['repeats'] = repeats;
                        existing['repeatCount'] = repeats.length;
                        cropLogs[stageIdx] = existing;
                        _stageLogs[crop.id] = cropLogs;

                        Navigator.pop(context);
                        setState(() {});
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('पुन्हा फवारणी #${repeats.length} यशस्वीरीत्या नोंदवली गेली!'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                      },
                      child: const Text('नोंद जतन करा (Save Repeat Spray)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _openStageLogModal(BuildContext context, CropItem crop, int stageIdx) {
    final stagesList = _getStagesForCrop(crop.id);
    final stage = stagesList[stageIdx.clamp(0, stagesList.length - 1)];
    final cropLogs = _stageLogs[crop.id] ?? {};
    final existing = cropLogs[stageIdx] ?? {};

    final dateCtrl = TextEditingController(text: existing['date']?.toString() ?? '${DateTime.now().day.toString().padLeft(2, '0')}/${DateTime.now().month.toString().padLeft(2, '0')}/${DateTime.now().year}');
    final primaryCtrl = TextEditingController(text: existing['activity'] ?? existing['fertilizerName'] ?? existing['sprayName'] ?? existing['seedName'] ?? existing['product'] ?? '');
    final secondaryCtrl = TextEditingController(text: existing['quantity'] ?? existing['dose'] ?? existing['observation'] ?? existing['soilReport'] ?? existing['irrigationType'] ?? '');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (context) {
        final bottomPadding = MediaQuery.of(context).padding.bottom;
        final keyboardInset = MediaQuery.of(context).viewInsets.bottom;

        return SafeArea(
          top: false,
          bottom: true,
          child: Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 16,
              bottom: keyboardInset + (bottomPadding > 0 ? bottomPadding : 12) + 12,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          'टप्पा ${stageIdx + 1}: ${stage['marathi'] ?? stage['name']}',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text('काय दाखवायचे: ${stage['display'] ?? 'नोंद व अहवाल'}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                  ),
                  const Divider(height: 10),

                  const Text('दिनांक (Date)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 3),
                  TextField(
                    controller: dateCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.calendar_today, size: 16),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  Text(
                    stage['canRepeat'] == true
                        ? 'औषध / कीटकनाशक / स्प्रे नाव'
                        : (stage['name'].toString().contains('Fertilizer') ? 'खताचे नाव (Fertilizer Name)' : 'काम / तपशील (Activity / Product Name)'),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 3),
                  TextField(
                    controller: primaryCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      hintText: 'उदा. माहिती प्रविष्ट करा...',
                      hintStyle: const TextStyle(fontSize: 11),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  Text(
                    stage['canRepeat'] == true
                        ? 'डोस / प्रमाण (Dose per Acre / Ltr)'
                        : (stage['name'].toString().contains('Fertilizer') ? 'प्रमाण / मात्रा (Quantity)' : 'निरीक्षण / अहवाल तपशील (Observation)'),
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 3),
                  TextField(
                    controller: secondaryCtrl,
                    style: const TextStyle(fontSize: 11.5),
                    decoration: InputDecoration(
                      hintText: 'उदा. निरीक्षण किंवा मात्रा...',
                      hintStyle: const TextStyle(fontSize: 11),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Quick attachment button inside log modal
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.blue.shade800,
                      side: BorderSide(color: Colors.blue.shade300),
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    icon: const Icon(Icons.cloud_upload_outlined, size: 14),
                    label: const Text('📤 या टप्प्यासाठी अहवाल / फोटो जोडा (Add Photo/PDF)', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(context);
                      _openStageUploadModal(context, crop, stageIdx, stage['marathi'] ?? stage['name']);
                    },
                  ),
                  const SizedBox(height: 12),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: () {
                        final cropLogs = _stageLogs[crop.id] ?? {};
                        final updated = cropLogs[stageIdx] ?? {};
                        updated['date'] = dateCtrl.text.trim();

                        if (stage['canRepeat'] == true) {
                          updated['sprayName'] = primaryCtrl.text.trim();
                          updated['dose'] = secondaryCtrl.text.trim();
                        } else if (stage['name'].toString().contains('Fertilizer')) {
                          updated['fertilizerName'] = primaryCtrl.text.trim();
                          updated['quantity'] = secondaryCtrl.text.trim();
                        } else {
                          updated['activity'] = primaryCtrl.text.trim();
                          updated['observation'] = secondaryCtrl.text.trim();
                        }

                        cropLogs[stageIdx] = updated;
                        _stageLogs[crop.id] = cropLogs;

                        Navigator.pop(context);
                        setState(() {});
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('टप्पा #${stageIdx + 1} ची नोंद यशस्वीरीत्या जतन झाली!'),
                            backgroundColor: AppColors.primary,
                          ),
                        );
                      },
                      child: const Text('जतन करा (Save Stage Log)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
