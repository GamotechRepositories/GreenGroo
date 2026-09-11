import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
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

    final body = ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        DashboardCard(
          child: Row(
            children: [
              GestureDetector(
                onTap: _busy ? null : _changeAvatar,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: AppColors.primaryLight,
                      backgroundImage: avatar,
                      child: avatar == null
                          ? Icon(Icons.person, size: 36, color: AppColors.primary)
                          : null,
                    ),
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.camera_alt, size: 12, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      boy?.name.isNotEmpty == true ? boy!.name : 'Delivery Partner',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      boy?.phone ?? '',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.textSecondary,
                          ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Tap photo to update · saved to cloud & home avatar',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textMuted,
                            fontSize: 11,
                          ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: _busy ? null : _editName,
                icon: const Icon(Icons.edit_outlined),
                tooltip: 'Edit name',
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
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
