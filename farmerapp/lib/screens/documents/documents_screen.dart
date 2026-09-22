import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

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
            title: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Farmer Documents (कागदपत्रे)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                Text('KYC Verification & Land Extracts', style: TextStyle(fontSize: 11, color: AppColors.muted)),
              ],
            ),
          ),
          body: SingleChildScrollView(
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

                Text(
                  'Documents Checklist (${docs.length})',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
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
              ],
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

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.description_outlined, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc.title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                Text(
                  doc.marathiTitle,
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(4)),
                  child: Text(statusLabel, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeText)),
                ),
              ],
            ),
          ),
          if (doc.status != 'approved')
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                FarmerState().uploadDocument(doc.id);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('${doc.title} यशस्वीरीत्या अपलोड केले, पडताळणीसाठी पाठवले!')),
                );
              },
              child: const Text('अपलोड', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            )
          else
            const Icon(Icons.check_circle, color: AppColors.success, size: 22),
        ],
      ),
    );
  }
}
