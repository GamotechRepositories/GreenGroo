import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/image_upload_utils.dart';
import '../../../core/utils/onboarding_nav.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/buttons/secondary_button.dart';

class TakeSelfieScreen extends StatefulWidget {
  const TakeSelfieScreen({super.key});

  @override
  State<TakeSelfieScreen> createState() => _TakeSelfieScreenState();
}

class _TakeSelfieScreenState extends State<TakeSelfieScreen> {
  final _picker = ImagePicker();
  XFile? _selfie;
  bool _submitting = false;

  Future<void> _capture() async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 70,
    );
    if (file == null || !mounted) return;
    setState(() => _selfie = file);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const AppBackButton(fallbackRoute: AppRoutes.uploadDocuments),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 4, 24, 20),
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  l10n.takeRecentPhoto,
                  style: GoogleFonts.inter(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  l10n.selfieCaptureSubtitle,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
              const Spacer(),
              Container(
                width: size.width * 0.72,
                height: size.width * 0.72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primaryLight,
                  border: Border.all(
                    color: _selfie != null ? AppColors.primary : AppColors.border,
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: _selfie != null
                    ? Image.file(File(_selfie!.path), fit: BoxFit.cover)
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.camera_front_rounded,
                            size: 64,
                            color: AppColors.primary.withValues(alpha: 0.7),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            l10n.cameraPreview,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
              ),
              const SizedBox(height: 20),
              Text(
                _selfie == null
                    ? l10n.faceClearlyVisible
                    : l10n.selfieNextStepHint,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                ),
              ),
              const Spacer(),
              if (_selfie == null)
                PrimaryButton(
                  label: l10n.openCamera,
                  icon: Icons.camera_alt_rounded,
                  onPressed: _capture,
                )
              else ...[
                PrimaryButton(
                  label: _submitting
                      ? 'Uploading…'
                      : l10n.continueToVerification,
                  icon: Icons.verified_user_rounded,
                  onPressed: _submitting
                      ? null
                      : () async {
                          if (_selfie == null) return;
                          setState(() => _submitting = true);
                          try {
                            final selfie = await documentPayload(_selfie);
                            if (!mounted) return;
                            final currentContext = context;
                            await goOnboardingStep(
                              currentContext,
                              step: 'liveness',
                              route: AppRoutes.livenessCheck,
                              arguments: _selfie?.path,
                              data: {'selfie': selfie},
                            );
                          } finally {
                            if (mounted) setState(() => _submitting = false);
                          }
                        },
                ),
                const SizedBox(height: 12),
                SecondaryButton(
                  label: l10n.retakePhoto,
                  icon: Icons.refresh_rounded,
                  onPressed: _capture,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
