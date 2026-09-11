import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/chips/status_chip.dart';
import '../../widgets/layout/custom_app_bar.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({super.key});

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  @override
  void initState() {
    super.initState();
    AuthService.instance.fetchMe().then((_) {
      if (mounted) setState(() {});
    });
  }

  static const _keys = [
    ('license', 'Driving Licence', Icons.credit_card_outlined),
    ('aadhaar', 'Aadhaar', Icons.fingerprint_outlined),
    ('pan', 'PAN', Icons.description_outlined),
    ('rc', 'Vehicle RC', Icons.two_wheeler_outlined),
    ('insurance', 'Insurance', Icons.security_outlined),
    ('passport', 'Passport', Icons.badge_outlined),
  ];

  ImageProvider? _imageFor(Map<String, dynamic> map) {
    final url = map['url']?.toString() ?? '';
    if (url.isNotEmpty) return NetworkImage(url);
    final b64 = map['imageBase64']?.toString() ?? '';
    if (b64.isEmpty) return null;
    try {
      final raw = b64.contains(',') ? b64.split(',').last : b64;
      return MemoryImage(base64Decode(raw));
    } catch (_) {
      return null;
    }
  }

  void _preview(String title, ImageProvider image) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _DocPreviewPage(title: title, image: image),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final docs = AuthService.instance.deliveryBoy?.documents ?? {};
    final uploaded = <({String key, String title, IconData icon, Map<String, dynamic> map, ImageProvider? image})>[];
    final missing = <({String key, String title, IconData icon})>[];

    for (final entry in _keys) {
      final raw = docs[entry.$1];
      final map = raw is Map ? Map<String, dynamic>.from(raw) : <String, dynamic>{};
      final image = _imageFor(map);
      final hasFile = image != null;
      if (hasFile) {
        uploaded.add((
          key: entry.$1,
          title: entry.$2,
          icon: entry.$3,
          map: map,
          image: image,
        ));
      } else {
        missing.add((key: entry.$1, title: entry.$2, icon: entry.$3));
      }
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.documents,
        subtitle: 'Tap a photo to view full size',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          DashboardCard(
            child: Text(
              'Documents are view-only. Contact your Delivery Manager to update them.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textSecondary,
                  ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          if (uploaded.isNotEmpty) ...[
            Text(
              'Uploaded documents',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: uploaded.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.95,
              ),
              itemBuilder: (context, index) {
                final item = uploaded[index];
                final status = item.map['status']?.toString() ?? 'uploaded';
                return InkWell(
                  onTap: item.image == null
                      ? null
                      : () => _preview(item.title, item.image!),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.shadow,
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(
                          child: item.image != null
                              ? Image(
                                  image: item.image!,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    color: AppColors.primaryLight,
                                    child: Icon(item.icon, color: AppColors.primary),
                                  ),
                                )
                              : Container(
                                  color: AppColors.primaryLight,
                                  child: Icon(item.icon, color: AppColors.primary),
                                ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.title,
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              StatusChip(
                                label: status.replaceAll('_', ' '),
                                type: status == 'approved'
                                    ? StatusType.success
                                    : status == 'rejected'
                                        ? StatusType.error
                                        : StatusType.warning,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
          if (missing.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Not uploaded',
              style: GoogleFonts.inter(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            ...missing.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.md),
                child: DashboardCard(
                  child: Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Icon(item.icon, color: AppColors.primary),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: Text(
                          item.title,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                      const StatusChip(
                        label: 'not uploaded',
                        type: StatusType.warning,
                      ),
                    ],
                  ),
                ),
              );
            }),
          ],
        ],
      ),
    );
  }
}

class _DocPreviewPage extends StatelessWidget {
  const _DocPreviewPage({required this.title, required this.image});

  final String title;
  final ImageProvider image;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(title),
      ),
      body: Center(
        child: InteractiveViewer(
          minScale: 0.8,
          maxScale: 4,
          child: Image(
            image: image,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(
              Icons.broken_image_outlined,
              color: Colors.white54,
              size: 64,
            ),
          ),
        ),
      ),
    );
  }
}
