import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../widgets/buttons/primary_button.dart';

class UploadDocumentsScreen extends StatefulWidget {
  const UploadDocumentsScreen({super.key});

  @override
  State<UploadDocumentsScreen> createState() => _UploadDocumentsScreenState();
}

class _UploadDocumentsScreenState extends State<UploadDocumentsScreen> {
  final _picker = ImagePicker();
  final _files = <String, XFile?>{};

  final _accountHolder = TextEditingController();
  final _accountNumber = TextEditingController();
  final _ifsc = TextEditingController();
  final _bankName = TextEditingController();
  final _upiId = TextEditingController();

  static const _docKeys = [
    'aadhaar',
    'pan',
    'passport',
    'license',
    'rc',
    'insurance',
  ];

  bool get _docsReady => _docKeys.every((k) => _files[k] != null);

  bool get _bankReady =>
      _accountHolder.text.trim().isNotEmpty &&
      _accountNumber.text.trim().isNotEmpty &&
      _ifsc.text.trim().isNotEmpty &&
      _bankName.text.trim().isNotEmpty &&
      _upiId.text.trim().isNotEmpty;

  bool get _canContinue => _docsReady && _bankReady;

  @override
  void initState() {
    super.initState();
    for (final c in [
      _accountHolder,
      _accountNumber,
      _ifsc,
      _bankName,
      _upiId,
    ]) {
      c.addListener(() => setState(() {}));
    }
  }

  @override
  void dispose() {
    _accountHolder.dispose();
    _accountNumber.dispose();
    _ifsc.dispose();
    _bankName.dispose();
    _upiId.dispose();
    super.dispose();
  }

  Future<void> _pick(String type) async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Upload document',
                style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Icon(Icons.camera_alt_outlined, color: AppColors.primary),
                title: const Text('Take photo'),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading: Icon(Icons.photo_library_outlined, color: AppColors.primary),
                title: const Text('Choose from gallery'),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    final file = await _picker.pickImage(source: source, imageQuality: 85);
    if (file == null || !mounted) return;

    setState(() => _files[type] = file);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        top: false,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 4, 24, 16),
                children: [
                  Text(
                    'Upload Documents',
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Complete all documents and payment details to continue',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _SectionTitle(title: 'Identity Documents'),
                  const SizedBox(height: 10),
                  _DocumentUploadCard(
                    title: 'Aadhaar Card',
                    subtitle: 'Front side clearly visible',
                    icon: Icons.badge_outlined,
                    file: _files['aadhaar'],
                    onTap: () => _pick('aadhaar'),
                  ),
                  const SizedBox(height: 12),
                  _DocumentUploadCard(
                    title: 'PAN Card',
                    subtitle: 'Clear photo of PAN',
                    icon: Icons.credit_card_outlined,
                    file: _files['pan'],
                    onTap: () => _pick('pan'),
                  ),
                  const SizedBox(height: 12),
                  _DocumentUploadCard(
                    title: 'Passport Size Photo',
                    subtitle: 'Recent passport-size photo',
                    icon: Icons.account_box_outlined,
                    file: _files['passport'],
                    onTap: () => _pick('passport'),
                  ),
                  const SizedBox(height: 12),
                  _DocumentUploadCard(
                    title: 'Driving License',
                    subtitle: 'Valid driving license',
                    icon: Icons.directions_car_filled_outlined,
                    file: _files['license'],
                    onTap: () => _pick('license'),
                  ),
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'Vehicle Documents'),
                  const SizedBox(height: 10),
                  _DocumentUploadCard(
                    title: 'Vehicle RC',
                    subtitle: 'Registration certificate',
                    icon: Icons.description_outlined,
                    file: _files['rc'],
                    onTap: () => _pick('rc'),
                  ),
                  const SizedBox(height: 12),
                  _DocumentUploadCard(
                    title: 'Insurance',
                    subtitle: 'Valid vehicle insurance',
                    icon: Icons.health_and_safety_outlined,
                    file: _files['insurance'],
                    onTap: () => _pick('insurance'),
                  ),
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'Bank Details'),
                  const SizedBox(height: 10),
                  _InputField(
                    controller: _accountHolder,
                    label: 'Account Holder Name',
                    hint: 'Name as per bank account',
                    icon: Icons.person_outline,
                  ),
                  const SizedBox(height: 12),
                  _InputField(
                    controller: _bankName,
                    label: 'Bank Name',
                    hint: 'e.g. HDFC Bank',
                    icon: Icons.account_balance_outlined,
                  ),
                  const SizedBox(height: 12),
                  _InputField(
                    controller: _accountNumber,
                    label: 'Account Number',
                    hint: 'Enter account number',
                    icon: Icons.numbers_outlined,
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  _InputField(
                    controller: _ifsc,
                    label: 'IFSC Code',
                    hint: 'e.g. HDFC0001234',
                    icon: Icons.qr_code_outlined,
                    textCapitalization: TextCapitalization.characters,
                  ),
                  const SizedBox(height: 24),
                  _SectionTitle(title: 'UPI ID'),
                  const SizedBox(height: 10),
                  _InputField(
                    controller: _upiId,
                    label: 'UPI ID',
                    hint: 'yourname@upi',
                    icon: Icons.payment_outlined,
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: PrimaryButton(
                label: 'Next',
                onPressed: _canContinue
                    ? () => Navigator.pushNamed(context, AppRoutes.takeSelfie)
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          textCapitalization: textCapitalization,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon),
          ),
        ),
      ],
    );
  }
}

class _DocumentUploadCard extends StatelessWidget {
  const _DocumentUploadCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.file,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final XFile? file;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final uploaded = file != null;

    return Material(
      color: uploaded ? AppColors.primaryLight : Colors.white,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(
              color: uploaded ? AppColors.primary : AppColors.border,
              width: uploaded ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: uploaded
                    ? Image.file(
                        File(file!.path),
                        width: 56,
                        height: 56,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        width: 56,
                        height: 56,
                        color: AppColors.primaryLight,
                        child: Icon(icon, color: AppColors.primary, size: 28),
                      ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      uploaded ? 'Uploaded · Tap to change' : subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: uploaded ? AppColors.primary : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                uploaded ? Icons.check_circle : Icons.upload_rounded,
                color: uploaded ? AppColors.primary : AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
