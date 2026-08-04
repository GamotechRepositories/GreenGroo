import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/env.dart';
import '../../config/theme.dart';
import '../../core/exceptions/api_exception.dart';
import '../../core/utils/currency_formatter.dart';
import '../../core/utils/upi_payment.dart';
import '../../models/store_settings.dart';
import '../../widgets/common/image_source_sheet.dart';

class PaymentModal extends StatefulWidget {
  const PaymentModal({
    super.key,
    required this.paymentMethod,
    required this.orderTotal,
    required this.onPayWithRazorpay,
    required this.onSubmitUpiProof,
    required this.onUploadScreenshot,
    this.merchantUpiId,
    this.merchantUpiName,
    this.merchantUpiAccounts = const [],
    this.processing = false,
    this.error = '',
  });

  final String paymentMethod;
  final double orderTotal;
  final String? merchantUpiId;
  final String? merchantUpiName;
  final List<MerchantUpiAccount> merchantUpiAccounts;
  final VoidCallback onPayWithRazorpay;
  final Future<String?> Function({
    required String screenshotUrl,
    required String screenshotName,
    required String upiTransactionRef,
  }) onSubmitUpiProof;
  final Future<String> Function(String filePath) onUploadScreenshot;
  final bool processing;
  final String error;

  @override
  State<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<PaymentModal> {
  static const _maxScreenshotBytes = 5 * 1024 * 1024;

  final _picker = ImagePicker();
  final _txnIdController = TextEditingController();
  String? _screenshotUrl;
  String? _screenshotLocalPath;
  String? _screenshotName;
  String? _uploadError;
  bool _uploadingScreenshot = false;
  bool _submittingProof = false;
  bool _chooserOpened = false;
  bool _paymentStarted = false;
  int _selectedUpiIndex = 0;

  bool get _isCod => widget.paymentMethod == 'cod';

  double get _payableAmount =>
      UpiPayment.getPayableAmount(widget.orderTotal, widget.paymentMethod);

  String get _paymentNote => _isCod ? 'COD Advance' : 'Order Payment';

  List<MerchantUpiAccount> get _enabledUpiAccounts {
    final configured = widget.merchantUpiAccounts
        .where((account) => account.enabled && account.upiId.isNotEmpty)
        .toList();
    if (configured.isNotEmpty) return configured;

    final legacyUpiId = widget.merchantUpiId?.trim() ?? '';
    if (legacyUpiId.isNotEmpty) {
      return [
        MerchantUpiAccount(
          upiId: legacyUpiId,
          label: widget.merchantUpiName?.trim() ?? 'BulkMobileMart',
          enabled: true,
        ),
      ];
    }

    final envUpiId = Env.merchantUpiId.trim();
    if (envUpiId.isNotEmpty) {
      return [
        MerchantUpiAccount(
          upiId: envUpiId,
          label: Env.merchantUpiName.trim(),
          enabled: true,
        ),
      ];
    }

    return const [];
  }

  MerchantUpiAccount? get _selectedUpiAccount {
    final accounts = _enabledUpiAccounts;
    if (accounts.isEmpty) return null;
    if (_selectedUpiIndex >= accounts.length) return accounts.first;
    return accounts[_selectedUpiIndex];
  }

  bool get _hasUpiId => _selectedUpiAccount != null;

  bool get _showMobileUpiOptions => !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  bool get _hasScreenshot => _screenshotLocalPath != null || _screenshotUrl != null;

  bool get _busy => widget.processing || _uploadingScreenshot || _submittingProof;

  @override
  void initState() {
    super.initState();
    if (_showMobileUpiOptions) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _openUpiChooser(auto: true));
    }
  }

  @override
  void dispose() {
    _txnIdController.dispose();
    super.dispose();
  }

  Future<void> _openUpiChooser({bool auto = false}) async {
    if (!_hasUpiId) return;

    final account = _selectedUpiAccount;
    if (account == null) return;

    if (auto && _chooserOpened) return;
    _chooserOpened = true;

    final launched = await UpiPayment.openUpiChooser(
      amount: _payableAmount,
      note: _paymentNote,
      merchantUpiId: account.upiId,
      merchantUpiName: account.label,
    );

    if (!mounted) return;
    if (launched) {
      setState(() => _paymentStarted = true);
    }
  }

  Future<void> _pickScreenshot() async {
    final source = await showImageSourceSheet(context, useRootNavigator: true);
    if (source == null) return;

    XFile? picked;
    try {
      // Gallery uses Android Photo Picker / iOS PHPicker (no broad media permission).
      // Camera still requires the platform CAMERA / NSCamera permission.
      picked = await _picker.pickImage(source: source, imageQuality: 92);
    } on PlatformException {
      if (!mounted) return;
      final needsCamera = source == ImageSource.camera;
      setState(() {
        _uploadError = needsCamera
            ? 'Allow camera permission to take a payment screenshot.'
            : 'Could not open photo picker. Try again.';
      });
      return;
    } catch (_) {
      if (!mounted) return;
      setState(() => _uploadError = 'Could not pick image. Try again.');
      return;
    }
    if (picked == null) return;

    final file = File(picked.path);
    final bytes = await file.length();
    if (bytes > _maxScreenshotBytes) {
      setState(() => _uploadError = 'Image must be under 5 MB');
      return;
    }

    setState(() {
      _uploadingScreenshot = true;
      _uploadError = null;
      _screenshotLocalPath = picked!.path;
      _screenshotUrl = null;
      _screenshotName = null;
    });

    try {
      final url = await widget.onUploadScreenshot(picked.path);
      if (!mounted) return;
      setState(() {
        _screenshotUrl = url;
        _screenshotName = picked!.name;
        _uploadingScreenshot = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _uploadError = e is ApiException
            ? e.message
            : 'Upload failed. Please try again.';
        _screenshotUrl = null;
        _screenshotName = null;
        _screenshotLocalPath = null;
        _uploadingScreenshot = false;
      });
    }
  }

  void _removeScreenshot() {
    setState(() {
      _screenshotUrl = null;
      _screenshotLocalPath = null;
      _screenshotName = null;
      _uploadError = null;
    });
  }

  Future<void> _submitProof() async {
    if (_screenshotUrl == null) {
      setState(() => _uploadError = 'Upload payment screenshot to continue');
      return;
    }

    setState(() {
      _uploadError = null;
      _submittingProof = true;
    });

    final error = await widget.onSubmitUpiProof(
      screenshotUrl: _screenshotUrl!,
      screenshotName: _screenshotName ?? 'screenshot.jpg',
      upiTransactionRef: _txnIdController.text.trim(),
    );

    if (!mounted) return;
    if (error == null) {
      Navigator.of(context, rootNavigator: true).pop();
      return;
    }
    setState(() {
      _uploadError = error;
      _submittingProof = false;
    });
  }

  void _close() {
    if (!_busy) Navigator.of(context, rootNavigator: true).pop();
  }

  @override
  Widget build(BuildContext context) {
    final selectedAccount = _selectedUpiAccount;
    final qrUrl = selectedAccount == null
        ? ''
        : UpiPayment.getQrCodeImageUrl(
            _payableAmount,
            note: _paymentNote,
            merchantUpiId: selectedAccount.upiId,
            merchantUpiName: selectedAccount.label,
          );
    final displayError =
        widget.error.isNotEmpty ? widget.error : (_uploadError ?? '');
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Material(
      color: Colors.white,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      clipBehavior: Clip.antiAlias,
      child: SafeArea(
        top: false,
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.92,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _SheetHandle(onClose: _busy ? null : _close),
              Flexible(
                child: SingleChildScrollView(
                  padding: EdgeInsets.fromLTRB(20, 0, 20, 12 + bottomInset),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Complete Payment',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 20,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Pay with UPI, then upload your payment screenshot.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                              height: 1.35,
                            ),
                      ),
                      const SizedBox(height: 16),
                      _AmountCard(
                        amount: _payableAmount,
                        isCod: _isCod,
                        orderTotal: widget.orderTotal,
                      ),
                      if (displayError.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        _AlertBanner(
                          message: displayError,
                          color: Colors.red,
                          icon: Icons.error_outline_rounded,
                        ),
                      ],
                      if (!_hasUpiId) ...[
                        const SizedBox(height: 12),
                        const _AlertBanner(
                          message:
                              'UPI is not set up yet. Contact store admin or use Razorpay.',
                          color: Colors.amber,
                          icon: Icons.info_outline_rounded,
                        ),
                      ],
                      const SizedBox(height: 20),
                      _StepHeader(
                        step: 1,
                        title: 'Pay via UPI',
                        subtitle: 'Open your UPI app or scan QR code',
                        done: _paymentStarted,
                      ),
                      const SizedBox(height: 10),
                      _PayStepCard(
                        hasUpiId: _hasUpiId,
                        qrUrl: qrUrl,
                        upiId: selectedAccount?.upiId ?? '',
                        upiAccounts: _enabledUpiAccounts,
                        selectedUpiIndex: _selectedUpiIndex,
                        onSelectUpi: (index) => setState(() => _selectedUpiIndex = index),
                        showMobileOptions: _showMobileUpiOptions,
                        busy: _busy,
                        onPay: () => _openUpiChooser(),
                      ),
                      const SizedBox(height: 20),
                      _StepHeader(
                        step: 2,
                        title: 'Upload screenshot',
                        subtitle: 'Photo of successful UPI payment',
                        done: _screenshotUrl != null,
                      ),
                      const SizedBox(height: 10),
                      _UploadStepCard(
                        busy: _busy,
                        uploading: _uploadingScreenshot,
                        hasScreenshot: _hasScreenshot,
                        screenshotLocalPath: _screenshotLocalPath,
                        screenshotUrl: _screenshotUrl,
                        txnController: _txnIdController,
                        onPick: _pickScreenshot,
                        onRemove: _removeScreenshot,
                      ),
                    ],
                  ),
                ),
              ),
              _BottomActions(
                busy: _busy,
                uploading: _uploadingScreenshot,
                canSubmit: _screenshotUrl != null && _hasUpiId,
                submitting: _submittingProof,
                onSubmit: _submitProof,
                onRazorpay: widget.onPayWithRazorpay,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SheetHandle extends StatelessWidget {
  const _SheetHandle({this.onClose});

  final VoidCallback? onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 10, 8, 4),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderLight,
              borderRadius: BorderRadius.circular(99),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Spacer(),
              IconButton(
                onPressed: onClose,
                icon: const Icon(Icons.close_rounded, size: 22),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.mobileSurface,
                  foregroundColor: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AmountCard extends StatelessWidget {
  const _AmountCard({
    required this.amount,
    required this.isCod,
    required this.orderTotal,
  });

  final double amount;
  final bool isCod;
  final double orderTotal;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.14),
            AppColors.primary.withValues(alpha: 0.06),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.22)),
      ),
      child: Column(
        children: [
          Text(
            isCod ? 'COD ADVANCE (10%)' : 'AMOUNT TO PAY',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: AppColors.primary.withValues(alpha: 0.9),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            formatInr(amount, withDecimals: true),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
              height: 1.1,
            ),
          ),
          if (isCod) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.75),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Order total ${formatInr(orderTotal, withDecimals: true)} · Rest on delivery',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({
    required this.step,
    required this.title,
    required this.subtitle,
    required this.done,
  });

  final int step;
  final String title;
  final String subtitle;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _StepBadge(number: step, done: done),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
        if (done)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F5E9),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_rounded, size: 14, color: Color(0xFF2E7D32)),
                SizedBox(width: 4),
                Text(
                  'Done',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF2E7D32),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _StepBadge extends StatelessWidget {
  const _StepBadge({required this.number, required this.done});

  final int number;
  final bool done;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28,
      height: 28,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: done ? const Color(0xFF2E7D32) : AppColors.primary,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (done ? const Color(0xFF2E7D32) : AppColors.primary)
                .withValues(alpha: 0.25),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: done
          ? const Icon(Icons.check_rounded, color: Colors.white, size: 16)
          : Text(
              '$number',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: 13,
              ),
            ),
    );
  }
}

class _PayStepCard extends StatelessWidget {
  const _PayStepCard({
    required this.hasUpiId,
    required this.qrUrl,
    required this.upiId,
    required this.upiAccounts,
    required this.selectedUpiIndex,
    required this.onSelectUpi,
    required this.showMobileOptions,
    required this.busy,
    required this.onPay,
  });

  final bool hasUpiId;
  final String qrUrl;
  final String upiId;
  final List<MerchantUpiAccount> upiAccounts;
  final int selectedUpiIndex;
  final ValueChanged<int> onSelectUpi;
  final bool showMobileOptions;
  final bool busy;
  final VoidCallback onPay;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          if (upiAccounts.length > 1) ...[
            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Select UPI ID',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: List.generate(upiAccounts.length, (index) {
                final account = upiAccounts[index];
                final selected = selectedUpiIndex == index;
                return ChoiceChip(
                  label: Text(
                    account.upiId,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: selected ? AppColors.primary : AppColors.textSecondary,
                    ),
                  ),
                  selected: selected,
                  onSelected: busy ? null : (_) => onSelectUpi(index),
                  selectedColor: AppColors.primary.withValues(alpha: 0.12),
                  backgroundColor: AppColors.mobileSurface,
                  side: BorderSide(
                    color: selected ? AppColors.primary : AppColors.borderLight,
                  ),
                );
              }),
            ),
            const SizedBox(height: 12),
          ],
          if (showMobileOptions && hasUpiId) ...[
            SizedBox(
              width: double.infinity,
              height: 48,
              child: FilledButton(
                onPressed: busy ? null : onPay,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SvgPicture.asset(
                      'assets/images/payment/upi.svg',
                      width: 22,
                      height: 22,
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'Open UPI App',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(child: Divider(color: AppColors.borderLight)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Text(
                    'OR SCAN QR',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.5,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
                Expanded(child: Divider(color: AppColors.borderLight)),
              ],
            ),
            const SizedBox(height: 14),
          ],
          if (hasUpiId && qrUrl.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.mobileSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: CachedNetworkImage(
                      imageUrl: qrUrl,
                      width: 130,
                      height: 130,
                      fit: BoxFit.contain,
                      memCacheWidth: 260,
                      memCacheHeight: 260,
                      filterQuality: FilterQuality.medium,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.account_balance_wallet_outlined,
                        size: 14,
                        color: AppColors.textMuted.withValues(alpha: 0.9),
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          upiId,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      InkWell(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: upiId));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('UPI ID copied'),
                              duration: Duration(seconds: 2),
                              behavior: SnackBarBehavior.floating,
                            ),
                          );
                        },
                        borderRadius: BorderRadius.circular(6),
                        child: const Padding(
                          padding: EdgeInsets.all(4),
                          child: Icon(Icons.copy_rounded, size: 16, color: AppColors.primary),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            )
          else
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28),
              decoration: BoxDecoration(
                color: AppColors.mobileSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: const Text(
                'QR not available',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
            ),
        ],
      ),
    );
  }
}

class _UploadStepCard extends StatelessWidget {
  const _UploadStepCard({
    required this.busy,
    required this.uploading,
    required this.hasScreenshot,
    required this.screenshotLocalPath,
    required this.screenshotUrl,
    required this.txnController,
    required this.onPick,
    required this.onRemove,
  });

  final bool busy;
  final bool uploading;
  final bool hasScreenshot;
  final String? screenshotLocalPath;
  final String? screenshotUrl;
  final TextEditingController txnController;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hasScreenshot)
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    color: AppColors.mobileSurface,
                    child: screenshotLocalPath != null
                        ? Image.file(
                            File(screenshotLocalPath!),
                            height: 140,
                            width: double.infinity,
                            fit: BoxFit.contain,
                          )
                        : CachedNetworkImage(
                            imageUrl: screenshotUrl!,
                            height: 140,
                            width: double.infinity,
                            fit: BoxFit.contain,
                            memCacheWidth: 560,
                            memCacheHeight: 280,
                            filterQuality: FilterQuality.medium,
                          ),
                  ),
                ),
                if (uploading)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black38,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                    ),
                  ),
                Positioned(
                  top: 6,
                  right: 6,
                  child: Material(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    child: InkWell(
                      onTap: busy ? null : onRemove,
                      borderRadius: BorderRadius.circular(20),
                      child: const Padding(
                        padding: EdgeInsets.all(6),
                        child: Icon(Icons.close_rounded, size: 18, color: Colors.red),
                      ),
                    ),
                  ),
                ),
              ],
            )
          else
            Material(
              color: AppColors.mobileSurface,
              borderRadius: BorderRadius.circular(12),
              child: InkWell(
                onTap: busy || uploading ? null : onPick,
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.35),
                      width: 1.5,
                      strokeAlign: BorderSide.strokeAlignInside,
                    ),
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          uploading ? Icons.hourglass_top_rounded : Icons.add_a_photo_outlined,
                          color: AppColors.primary,
                          size: 28,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        uploading ? 'Uploading...' : 'Tap to upload screenshot',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'JPG, PNG · Max 5 MB',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          const SizedBox(height: 12),
          TextField(
            controller: txnController,
            enabled: !busy,
            decoration: InputDecoration(
              hintText: 'UPI Transaction ID (optional)',
              prefixIcon: const Icon(Icons.tag_rounded, size: 20),
              filled: true,
              fillColor: AppColors.mobileSurface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            ),
            style: const TextStyle(fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _AlertBanner extends StatelessWidget {
  const _AlertBanner({
    required this.message,
    required this.color,
    required this.icon,
  });

  final String message;
  final MaterialColor color;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.shade200),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color.shade700),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(fontSize: 12, color: color.shade900, height: 1.35),
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomActions extends StatelessWidget {
  const _BottomActions({
    required this.busy,
    required this.uploading,
    required this.canSubmit,
    required this.submitting,
    required this.onSubmit,
    required this.onRazorpay,
  });

  final bool busy;
  final bool uploading;
  final bool canSubmit;
  final bool submitting;
  final VoidCallback onSubmit;
  final VoidCallback onRazorpay;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.borderLight)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            height: 50,
            child: FilledButton(
              onPressed: busy || uploading || !canSubmit ? null : onSubmit,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                disabledBackgroundColor: AppColors.borderLight,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                submitting ? 'Confirming order...' : 'Confirm Order',
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
              ),
            ),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: busy ? null : onRazorpay,
            child: Text(
              busy ? 'Please wait...' : 'Pay via Razorpay instead',
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
