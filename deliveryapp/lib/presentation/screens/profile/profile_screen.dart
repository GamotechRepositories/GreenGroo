import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/common/app_panel.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../widgets/tiles/profile_tile.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _busy = false;

  DeliveryBoy? get _boy => AuthService.instance.deliveryBoy;

  ImageProvider? get _avatarImage {
    final raw = _boy?.profileImageBytesOrUrl;
    if (raw is String && raw.isNotEmpty) return NetworkImage(raw);
    if (raw is Uint8List && raw.isNotEmpty) return MemoryImage(raw);
    return null;
  }

  Future<void> _editName() async {
    final controller = TextEditingController(text: _boy?.name ?? '');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit name'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(labelText: 'Full name'),
          textCapitalization: TextCapitalization.words,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );
    if (ok != true) return;
    final name = controller.text.trim();
    if (name.isEmpty) return;
    setState(() => _busy = true);
    try {
      await AuthService.instance.updateOnboarding(data: {'name': name});
      await AuthService.instance.fetchMe();
      if (mounted) setState(() {});
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _changeAvatar() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      imageQuality: 85,
    );
    if (file == null) return;
    setState(() => _busy = true);
    try {
      final bytes = await File(file.path).readAsBytes();
      final b64 = base64Encode(bytes);
      final mime = file.path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
      await AuthService.instance.updateOnboarding(
        data: {
          'selfie': {
            'imageBase64': 'data:$mime;base64,$b64',
            'status': 'uploaded',
          },
        },
      );
      await AuthService.instance.fetchMe();
      if (mounted) {
        setState(() {});
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile photo saved to your account')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final boy = _boy;
    final avatar = _avatarImage;

    final hasRating = (boy?.totalRatingsCount ?? 0) > 0;
    final employment = (boy?.employmentType ?? '').trim();
    final location = [boy?.area ?? '', boy?.city ?? '']
        .where((s) => s.trim().isNotEmpty)
        .join(', ');

    final body = ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Container(
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: brandHeroDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  GestureDetector(
                    onTap: _busy ? null : _changeAvatar,
                    child: Stack(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.35),
                          ),
                          child: CircleAvatar(
                            radius: 36,
                            backgroundColor: AppColors.primaryLight,
                            backgroundImage: avatar,
                            child: avatar == null
                                ? Icon(Icons.person, size: 36, color: AppColors.primary)
                                : null,
                          ),
                        ),
                        Positioned(
                          right: 0,
                          bottom: 0,
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.primary, width: 2),
                            ),
                            child: Icon(Icons.camera_alt, size: 12, color: AppColors.primary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          boy?.name.isNotEmpty == true ? boy!.name : 'Delivery Partner',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          boy?.phone ?? '',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            color: Colors.white.withValues(alpha: 0.88),
                          ),
                        ),
                        if (employment.isNotEmpty || location.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 6,
                            children: [
                              if (employment.isNotEmpty)
                                _HeroChip(
                                  icon: Icons.badge_outlined,
                                  label: employment
                                      .toLowerCase()
                                      .split('_')
                                      .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
                                      .join('-'),
                                ),
                              if (location.isNotEmpty)
                                _HeroChip(icon: Icons.location_on_outlined, label: location),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                  Material(
                    color: Colors.white.withValues(alpha: 0.18),
                    shape: const CircleBorder(),
                    child: IconButton(
                      onPressed: _busy ? null : _editName,
                      icon: const Icon(Icons.edit_outlined, color: Colors.white, size: 20),
                      tooltip: 'Edit name',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: HeroStat(
                        label: hasRating ? '${boy!.totalRatingsCount} ratings' : 'Rating',
                        value: hasRating ? '★ ${boy!.rating.toStringAsFixed(1)}' : '—',
                      ),
                    ),
                    Expanded(
                      child: HeroStat(
                        label: 'Vehicle',
                        value: boy?.vehicleType.isNotEmpty == true ? boy!.vehicleType : '—',
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Tap photo to update · saved to cloud & home avatar',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        const SectionLabel('Account details'),
        DashboardCard(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              ProfileTile(
                title: l10n.vehicleInformation,
                subtitle: boy?.vehicleType.isNotEmpty == true
                    ? boy!.vehicleType
                    : l10n.bikeDetails,
                leadingIcon: Icons.two_wheeler_outlined,
                onTap: () => Navigator.pushNamed(context, AppRoutes.vehicle),
              ),
              ProfileTile(
                title: l10n.documents,
                subtitle: l10n.verificationDocuments,
                leadingIcon: Icons.folder_outlined,
                onTap: () => Navigator.pushNamed(context, AppRoutes.documents),
              ),
              ProfileTile(
                title: 'Bank details',
                subtitle: 'View only · managed by Delivery Manager',
                leadingIcon: Icons.account_balance_outlined,
                onTap: () => Navigator.pushNamed(context, AppRoutes.bankDetails),
                showDivider: false,
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Text(
          'These details can only be updated by your Delivery Manager.',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );

    if (widget.embedded) return body;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(title: l10n.profile, showBackButton: true),
      body: Stack(
        children: [
          body,
          if (_busy)
            const Positioned.fill(
              child: ColoredBox(
                color: Color(0x33000000),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  const _HeroChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white),
          const SizedBox(width: 4),
          Flexible(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
