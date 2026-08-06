import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  static const _documents = [
    _DocumentItem(title: 'Driving License', icon: Icons.credit_card_outlined),
    _DocumentItem(title: 'PAN', icon: Icons.description_outlined),
    _DocumentItem(title: 'Aadhaar', icon: Icons.fingerprint_outlined),
    _DocumentItem(title: 'Vehicle RC', icon: Icons.two_wheeler_outlined),
    _DocumentItem(title: 'Insurance', icon: Icons.security_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Documents',
        subtitle: 'Upload and verify documents',
        showBackButton: true,
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.lg),
        itemCount: _documents.length,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) {
          final doc = _documents[index];
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
                          const StatusChip(label: 'Upload', type: StatusType.pending, showDot: false),
                          const SizedBox(width: AppSpacing.sm),
                          const StatusChip(label: 'Pending', type: StatusType.warning, showDot: false),
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
