import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/utils/validators.dart';
import '../../widgets/auth/otp_input.dart';
import '../../models/user.dart';
import 'auth_completion.dart';
import 'auth_controller.dart';
import 'auth_state.dart';

enum _AuthStep { details, verify }

class AuthSheet extends ConsumerStatefulWidget {
  const AuthSheet({super.key, required this.mode});

  final AuthModalMode mode;

  @override
  ConsumerState<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends ConsumerState<AuthSheet> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _shopAddressController = TextEditingController();
  final _gstController = TextEditingController();

  _AuthStep _step = _AuthStep.details;
  String _otp = '';
  int _resendCooldown = 0;
  Timer? _cooldownTimer;
  bool _submitting = false;
  String? _error;

  bool get _isSignup => widget.mode == AuthModalMode.signup;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_clearError);
    _nameController.addListener(_clearError);
    _shopNameController.addListener(_clearError);
    _shopAddressController.addListener(_clearError);
  }

  @override
  void didUpdateWidget(covariant AuthSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mode != widget.mode) {
      _resetFlow();
    }
  }

  @override
  void dispose() {
    _cooldownTimer?.cancel();
    _nameController.dispose();
    _phoneController.dispose();
    _shopNameController.dispose();
    _shopAddressController.dispose();
    _gstController.dispose();
    super.dispose();
  }

  void _clearError() {
    if (_error != null) setState(() => _error = null);
  }

  void _resetFlow() {
    _cooldownTimer?.cancel();
    setState(() {
      _step = _AuthStep.details;
      _otp = '';
      _resendCooldown = 0;
      _error = null;
      _shopNameController.clear();
      _shopAddressController.clear();
      _gstController.clear();
    });
  }

  void _startCooldown() {
    _cooldownTimer?.cancel();
    setState(() => _resendCooldown = 60);
    _cooldownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCooldown <= 1) {
        timer.cancel();
        setState(() => _resendCooldown = 0);
      } else {
        setState(() => _resendCooldown -= 1);
      }
    });
  }

  String? _validateDetailsStep() {
    if (_isSignup && !Validators.isValidName(_nameController.text)) {
      return 'Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)';
    }
    if (!Validators.isValidPhone(_phoneController.text)) {
      return 'Phone must be 10 digits starting with 6, 7, 8, or 9';
    }
    if (_isSignup && !Validators.isValidShopName(_shopNameController.text)) {
      return 'Shop name must be at least 2 characters';
    }
    if (_isSignup && !Validators.isValidShopAddress(_shopAddressController.text)) {
      return 'Please enter a complete shop address';
    }
    final gst = _gstController.text.trim();
    if (_isSignup && gst.isNotEmpty && !Validators.isValidGst(gst)) {
      return 'Please enter a valid GST number';
    }
    return null;
  }

  Map<String, String> _signupProfilePayload() {
    return {
      'shopName': _shopNameController.text.trim(),
      'shopAddress': _shopAddressController.text.trim(),
      'gstNumber': _gstController.text.trim(),
    };
  }

  Future<void> _submitDetailsStep() async {
    await _sendOtp();
  }

  Future<void> _sendOtp() async {
    final validationError = _validateDetailsStep();
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ref
          .read(authControllerProvider.notifier)
          .sendOtp(
            _phoneController.text.trim(),
            purpose: _isSignup ? 'signup' : 'login',
          );
      if (!mounted) return;
      setState(() {
        _step = _AuthStep.verify;
        _otp = '';
        _submitting = false;
      });
      _startCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('OTP sent to +91 ${_phoneController.text.trim()}'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = authErrorMessage(
          error,
        );
      });
    }
  }

  void _handleAuthSuccess(User user, {required bool isSignup}) {
    if (!mounted) return;
    completeAuthAndGoHome(
      ref: ref,
      sheetContext: context,
      user: user,
      isSignup: isSignup,
    );
  }

  Future<void> _verifyOtp() async {
    if (!RegExp(r'^\d{6}$').hasMatch(_otp.trim())) {
      setState(() => _error = 'Please enter the 6-digit OTP sent to your phone');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final auth = ref.read(authControllerProvider.notifier);
      final profile = _signupProfilePayload();
      final result = await auth.verifyOtp(
        phone: _phoneController.text.trim(),
        otp: _otp.trim(),
        name: _isSignup ? _nameController.text.trim() : null,
        shopName: _isSignup ? profile['shopName'] : null,
        shopAddress: _isSignup ? profile['shopAddress'] : null,
        gstNumber: _isSignup ? profile['gstNumber'] : null,
      );

      if (result.needsSignup) {
        if (_isSignup) {
          final user = await auth.completeOtpSignupProfile(
            phone: _phoneController.text.trim(),
            name: _nameController.text.trim(),
            shopName: profile['shopName']!,
            shopAddress: profile['shopAddress']!,
            gstNumber: profile['gstNumber'],
          );
          if (!mounted) return;
          _handleAuthSuccess(user, isSignup: true);
          return;
        }

        setState(() {
          _submitting = false;
          _error = 'No account found with this number. Please sign up first.';
        });
        return;
      }

      final user = result.user;
      if (user != null) {
        if (!mounted) return;
        _handleAuthSuccess(user, isSignup: _isSignup);
        return;
      }

      setState(() {
        _submitting = false;
        _error = 'Could not complete sign in. Please try again.';
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = authErrorMessage(error);
      });
    }
  }

  void _switchMode(AuthModalMode nextMode) {
    _resetFlow();
    ref.read(authControllerProvider.notifier).setAuthModal(nextMode);
    Navigator.of(context, rootNavigator: true).pop();
    Future.microtask(() {
      ref.read(authControllerProvider.notifier).openAuthModal(nextMode);
    });
  }

  @override
  Widget build(BuildContext context) {
    final phone = _phoneController.text.trim();

    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 12,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(child: _buildHeader(phone)),
                IconButton(
                  onPressed: () {
                    ref.read(authControllerProvider.notifier).closeAuthModal();
                    Navigator.of(context, rootNavigator: true).pop();
                  },
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (_step == _AuthStep.details) ...[
              if (_isSignup) ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(
                    labelText: 'Name',
                    hintText: 'Enter your full name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Mobile Number',
                    hintText: 'Enter your phone number',
                    prefixIcon: Icon(Icons.phone_outlined),
                    prefixText: '+91 ',
                  ),
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _shopNameController,
                  decoration: const InputDecoration(
                    labelText: 'Shop Name',
                    hintText: 'Enter your shop name',
                    prefixIcon: Icon(Icons.store_outlined),
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _shopAddressController,
                  decoration: const InputDecoration(
                    labelText: 'Shop Address',
                    hintText: 'Building, street, area, city',
                    prefixIcon: Icon(Icons.location_on_outlined),
                    alignLabelWithHint: true,
                  ),
                  minLines: 2,
                  maxLines: 3,
                  keyboardType: TextInputType.streetAddress,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _gstController,
                  decoration: const InputDecoration(
                    labelText: 'GST Number (Optional)',
                    hintText: '22AAAAA0000A1Z5',
                    prefixIcon: Icon(Icons.description_outlined),
                  ),
                  maxLength: 15,
                  textCapitalization: TextCapitalization.characters,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z0-9]')),
                  ],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submitDetailsStep(),
                ),
              ] else ...[
                TextField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Mobile Number',
                    hintText: 'Enter your phone number',
                    prefixIcon: Icon(Icons.phone_outlined),
                    prefixText: '+91 ',
                  ),
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submitDetailsStep(),
                ),
              ],
            ] else ...[
              Text(
                'Enter OTP',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
              ),
              const SizedBox(height: 12),
              OtpInput(
                value: _otp,
                onChanged: (value) => setState(() {
                  _otp = value;
                  _error = null;
                }),
                enabled: !_submitting,
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _submitting
                        ? null
                        : () => setState(() {
                              _step = _AuthStep.details;
                              _otp = '';
                              _error = null;
                            }),
                    child: const Text('Change number'),
                  ),
                  TextButton(
                    onPressed:
                        _submitting || _resendCooldown > 0 ? null : _sendOtp,
                    child: Text(
                      _resendCooldown > 0
                          ? 'Resend in ${_resendCooldown}s'
                          : 'Resend OTP',
                    ),
                  ),
                ],
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Text(
                  _error!,
                  style: TextStyle(color: Colors.red.shade700, fontSize: 13),
                ),
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _submitting
                  ? null
                  : (_step == _AuthStep.details
                      ? _submitDetailsStep
                      : _verifyOtp),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: Text(
                _submitting
                    ? 'Please wait...'
                    : _step == _AuthStep.details
                        ? 'Send OTP'
                        : (_isSignup
                            ? 'Verify & Sign Up'
                            : 'Verify & Sign In'),
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: _submitting
                  ? null
                  : () => _switchMode(
                        _isSignup ? AuthModalMode.login : AuthModalMode.signup,
                      ),
              child: Text(
                _isSignup
                    ? 'Already have an account? Sign In'
                    : "Don't have an account? Sign Up",
              ),
            ),
            if (_isSignup && _step == _AuthStep.details) ...[
              const SizedBox(height: 8),
              Text(
                'Your information is secure and will never be shared',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  color: AppColors.textMuted.withValues(alpha: 0.9),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String phone) {
    if (_step == _AuthStep.verify) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Verify OTP',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Enter the 6-digit code sent to +91 $phone',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      );
    }

    if (_isSignup) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Create Your Account',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Fill your details and verify your phone with OTP',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textSecondary,
                ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Welcome Back',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
              ),
        ),
        const SizedBox(height: 4),
        Text(
          'Sign in with OTP sent to your mobile number',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );
  }
}
