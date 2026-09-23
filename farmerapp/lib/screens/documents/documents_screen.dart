import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final docs = FarmerState().documents;
        final approvedCount = docs.where((d) => d.status == 'approved').length;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0.5,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Farmer Documents (कागदपत्रे)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                Text('KYC Verification & Land Extracts', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Verification Summary Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1B5E20), Color(0xFF2E7D32)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.verified, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'शेतकरी केवायसी प्रमाणित (Verified)',
                                style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '$approvedCount पैकी ${docs.length} आवश्यक कागदपत्रे मंजूर आहेत.',
                                style: const TextStyle(color: Colors.white70, fontSize: 11),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 18),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Documents Checklist (${docs.length})',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                      ),
                      const Text(
                        'कॅमेरा किंवा गॅलरी',
                        style: TextStyle(fontSize: 11, color: Color(0xFF059669), fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: docs.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final doc = docs[index];
                      return _DocumentCard(doc: doc);
                    },
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _DocumentCard extends StatelessWidget {
  final DocumentItem doc;
  const _DocumentCard({required this.doc});

  void _uploadDocumentPhoto(BuildContext context) {
    showAppPhotoPicker(
      context,
      title: 'Upload ${doc.title} (${doc.marathiTitle})',
      subtitle: 'लाईव्ह कॅमेऱ्याने फोटो काढा किंवा गॅलरी मधून कागदपत्र निवडा',
      presetCategory: 'Document',
      onPhotoSelected: (photoStr) {
        FarmerState().uploadDocument(doc.id, fileUrl: photoStr, status: 'approved');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${doc.title} फोटो यशस्वीरीत्या अपलोड झाला!'),
            backgroundColor: const Color(0xFF217346),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    Color badgeBg;
    Color badgeText;
    String statusLabel;

    if (doc.status == 'approved') {
      badgeBg = AppColors.successLight;
      badgeText = AppColors.success;
      statusLabel = 'Approved (मंजूर ✓)';
    } else if (doc.status == 'pending') {
      badgeBg = AppColors.warningLight;
      badgeText = AppColors.warning;
      statusLabel = 'Under Review (पडताळणी चालू)';
    } else {
      badgeBg = AppColors.borderLight;
      badgeText = AppColors.muted;
      statusLabel = 'Not Uploaded (प्रलंबित)';
    }

    final hasPhoto = doc.fileUrl.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Document Thumbnail / Icon
          if (hasPhoto)
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              clipBehavior: Clip.antiAlias,
              child: AppImageWidget(
                imageStr: doc.fileUrl,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
              ),
            )
          else
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.description_outlined, color: AppColors.primary, size: 24),
            ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc.title,
                  style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                Text(
                  doc.marathiTitle,
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(4)),
                  child: Text(statusLabel, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: badgeText)),
                ),
              ],
            ),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: doc.status == 'approved' ? const Color(0xFFF1F5F9) : AppColors.primary,
              foregroundColor: doc.status == 'approved' ? const Color(0xFF334155) : Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            icon: Icon(
              doc.status == 'approved' ? Icons.camera_alt_outlined : Icons.upload_file,
              size: 14,
            ),
            label: Text(
              doc.status == 'approved' ? 'बदला' : 'अपलोड',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
            ),
            onPressed: () => _uploadDocumentPhoto(context),
          ),
        ],
      ),
    );
  }
}
