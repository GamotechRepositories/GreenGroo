import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  List<_DocumentItem> _documents(AppLocalizations l10n) => [
        _DocumentItem(title: l10n.docDrivingLicense, icon: Icons.credit_card_outlined),
        _DocumentItem(title: l10n.docPan, icon: Icons.description_outlined),
        _DocumentItem(title: l10n.docAadhaar, icon: Icons.fingerprint_outlined),
        _DocumentItem(title: l10n.docVehicleRc, icon: Icons.two_wheeler_outlined),
        _DocumentItem(title: l10n.insurance, icon: Icons.security_outlined),
      ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final documents = _documents(l10n);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.documents,
        subtitle: l10n.uploadAndVerifyDocuments,
        showBackButton: true,
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: documents.length,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          final doc = documents[index];
          return DashboardCard(
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  ),
                  child: Icon(doc.icon, color: AppColors.primary),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(doc.title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15)),
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        children: [
                          StatusChip(label: l10n.upload, type: StatusType.pending, showDot: false),
                          const SizedBox(width: AppSpacing.sm),
                          StatusChip(label: l10n.pending, type: StatusType.warning, showDot: false),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () {},
                  icon: Icon(Icons.upload_outlined, color: AppColors.primary),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _DocumentItem {
  const _DocumentItem({required this.title, required this.icon});

  final String title;
  final IconData icon;
}
