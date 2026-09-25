import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/utils/validators.dart';
import '../../models/user.dart';
import 'auth_completion.dart';
import 'auth_controller.dart';
import 'auth_state.dart';

class AuthSheet extends ConsumerStatefulWidget {
  const AuthSheet({super.key, required this.mode});

  final AuthModalMode mode;

  @override
  ConsumerState<AuthSheet> createState() => _AuthSheetState();
}

class _AuthSheetState extends ConsumerState<AuthSheet> {
  final _nameController = TextEditingController();
  final _shopNameController = TextEditingController();
  final _shopAddressController = TextEditingController();
  final _ownerContactController = TextEditingController();
  final _gstNumberController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _accountType = 'retail';
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _submitting = false;
  String? _error;

  bool get _isSignup => widget.mode == AuthModalMode.signup;
  bool get _isBulk => _accountType == 'bulk';

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_clearError);
    _nameController.addListener(_clearError);
    _shopNameController.addListener(_clearError);
    _shopAddressController.addListener(_clearError);
    _ownerContactController.addListener(_clearError);
    _gstNumberController.addListener(_clearError);
    _passwordController.addListener(_clearError);
    _confirmPasswordController.addListener(_clearError);
  }

  @override
  void didUpdateWidget(covariant AuthSheet oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.mode != widget.mode) {
      _resetForm();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _shopNameController.dispose();
    _shopAddressController.dispose();
    _ownerContactController.dispose();
    _gstNumberController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _clearError() {
    if (_error != null) setState(() => _error = null);
  }

  void _resetForm() {
    _nameController.clear();
    _shopNameController.clear();
    _shopAddressController.clear();
    _ownerContactController.clear();
    _gstNumberController.clear();
    _phoneController.clear();
    _passwordController.clear();
    _confirmPasswordController.clear();
    setState(() {
      _accountType = 'retail';
      _showPassword = false;
      _showConfirmPassword = false;
      _submitting = false;
      _error = null;
    });
  }

  String? _validateForm() {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (_isSignup) {
      if (!Validators.isValidName(name)) {
        return _isBulk
            ? 'Owner name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)'
            : 'Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)';
      }

      if (_isBulk) {
        final shopName = _shopNameController.text.trim();
        final shopAddress = _shopAddressController.text.trim();
        final ownerContact = _ownerContactController.text.trim();
        final gst = _gstNumberController.text.trim().toUpperCase();

        if (!Validators.isValidShopName(shopName)) {
          return 'Business name is required (at least 2 characters)';
        }
        if (!Validators.isValidShopAddress(shopAddress)) {
          return 'Please enter a complete business location';
        }
        if (!Validators.isValidPhone(ownerContact)) {
          return 'Owner contact must be 10 digits starting with 6, 7, 8, or 9';
        }
        if (gst.isNotEmpty && !Validators.isValidGst(gst)) {
          return 'Please provide a valid GST number';
        }
      }
    }

    if (!Validators.isValidPhone(phone)) {
      return 'Phone must be 10 digits starting with 6, 7, 8, or 9';
    }
    if (!Validators.isValidPassword(password)) {
      return 'Password must be at least 6 characters';
    }
    if (_isSignup && password != confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  Future<void> _handleSubmit() async {
    final validationError = _validateForm();
    if (validationError != null) {
      setState(() => _error = validationError);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final controller = ref.read(authControllerProvider.notifier);
      final User user;
      if (_isSignup) {
        user = await controller.signup(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          password: _passwordController.text,
          accountType: _accountType,
          shopName: _isBulk ? _shopNameController.text.trim() : null,
          shopAddress: _isBulk ? _shopAddressController.text.trim() : null,
          ownerContact: _isBulk ? _ownerContactController.text.trim() : null,
          gstNumber: _isBulk && _gstNumberController.text.trim().isNotEmpty
              ? _gstNumberController.text.trim().toUpperCase()
              : null,
        );
      } else {
        user = await controller.login(
          phone: _phoneController.text.trim(),
          password: _passwordController.text,
        );
      }

      if (!mounted) return;
      _handleAuthSuccess(user, isSignup: _isSignup);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = authErrorMessage(error);
      });
    }
  }

  void _handleAuthSuccess(User user, {required bool isSignup}) {
    if (mounted) {
      try {
        Navigator.of(context, rootNavigator: true).pop();
      } catch (_) {
        try {
          Navigator.of(context).pop();
        } catch (_) {}
      }
    }
    completeAuthAndGoHome(
      ref: ref,
      sheetContext: context,
      user: user,
      isSignup: isSignup,
    );
  }

  void _switchMode(AuthModalMode nextMode) {
    _resetForm();
    ref.read(authControllerProvider.notifier).setAuthModal(nextMode);
    Navigator.of(context, rootNavigator: true).pop();
    Future.microtask(() {
      ref.read(authControllerProvider.notifier).openAuthModal(nextMode);
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 20,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Expanded(child: _buildHeader()),
                IconButton(
                  onPressed: () {
                    ref.read(authControllerProvider.notifier).closeAuthModal();
                    Navigator.of(context, rootNavigator: true).pop();
                  },
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (_isSignup) ...[
              const Text(
                'ACCOUNT TYPE',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              _AccountTypeToggle(
                value: _accountType,
                enabled: !_submitting,
                onChanged: (next) {
                  setState(() {
                    _accountType = next;
                    _error = null;
                  });
                },
              ),
              const SizedBox(height: 18),

              Text(
                _isBulk ? 'BUSINESS DETAILS' : 'YOUR DETAILS',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: _nameController,
                enabled: !_submitting,
                decoration: InputDecoration(
                  labelText: _isBulk ? 'Owner Name' : 'Full Name',
                  hintText: _isBulk ? 'e.g. Rahul Sharma' : 'e.g. Rahul Sharma',
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 12),

              if (_isBulk) ...[
                TextField(
                  controller: _shopNameController,
                  enabled: !_submitting,
                  decoration: const InputDecoration(
                    labelText: 'Business Name',
                    hintText: 'Registered business name',
                    prefixIcon: Icon(Icons.storefront_outlined),
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _gstNumberController,
                  enabled: !_submitting,
                  maxLength: 15,
                  textCapitalization: TextCapitalization.characters,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z0-9]')),
                  ],
                  decoration: const InputDecoration(
                    labelText: 'GST Number (Optional)',
                    hintText: '22AAAAA0000A1Z5',
                    prefixIcon: Icon(Icons.badge_outlined),
                    counterText: '',
                  ),
                  textInputAction: TextInputAction.next,
                  onChanged: (val) {
                    final upper = val.toUpperCase();
                    if (val != upper) {
                      _gstNumberController.value = TextEditingValue(
                        text: upper,
                        selection: _gstNumberController.selection,
                      );
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _shopAddressController,
                  enabled: !_submitting,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Business Location',
                    hintText: 'Address, city, pincode',
                    prefixIcon: Icon(Icons.location_on_outlined),
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _ownerContactController,
                  enabled: !_submitting,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    labelText: 'Owner Contact',
                    hintText: '10-digit phone number',
                    prefixIcon: Icon(Icons.contact_phone_outlined),
                    prefixText: '+91 ',
                    counterText: '',
                  ),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 18),
              ],

              const Text(
                'LOGIN DETAILS',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
            ],

            TextField(
              controller: _phoneController,
              enabled: !_submitting,
              decoration: InputDecoration(
                labelText: _isSignup ? 'Mobile Number' : 'Phone Number',
                hintText: _isSignup ? '10-digit mobile number' : 'Enter 10-digit number',
                helperText: _isSignup ? 'You’ll use this number to sign in' : null,
                prefixIcon: const Icon(Icons.phone_outlined),
                prefixText: '+91 ',
                counterText: '',
              ),
              keyboardType: TextInputType.phone,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),

            TextField(
              controller: _passwordController,
              enabled: !_submitting,
              obscureText: !_showPassword,
              decoration: InputDecoration(
                labelText: 'Password',
                hintText: _isSignup ? 'Create password' : 'Enter your password',
                helperText: _isSignup ? 'Minimum 6 characters' : null,
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(
                  icon: Icon(
                    _showPassword ? Icons.visibility_off : Icons.visibility,
                    size: 20,
                  ),
                  onPressed: () => setState(() => _showPassword = !_showPassword),
                ),
              ),
              textInputAction: _isSignup ? TextInputAction.next : TextInputAction.done,
              onSubmitted: _isSignup ? null : (_) => _handleSubmit(),
            ),

            if (_isSignup) ...[
              const SizedBox(height: 12),
              TextField(
                controller: _confirmPasswordController,
                enabled: !_submitting,
                obscureText: !_showConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  hintText: 'Re-enter password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _showConfirmPassword ? Icons.visibility_off : Icons.visibility,
                      size: 20,
                    ),
                    onPressed: () =>
                        setState(() => _showConfirmPassword = !_showConfirmPassword),
                  ),
                ),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _handleSubmit(),
              ),
            ],

            if (_error != null) ...[
              const SizedBox(height: 14),
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

            const SizedBox(height: 22),
            FilledButton(
              onPressed: _submitting ? null : _handleSubmit,
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      _isSignup
                          ? (_isBulk ? 'Register business account' : 'Create account')
                          : 'Sign In',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
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
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Your information is secure and encrypted',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: AppColors.textMuted.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    if (_isSignup) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _isBulk ? Icons.business_outlined : Icons.person_add_outlined,
                  color: AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  _isBulk ? 'Business registration' : 'Join GreenGroo',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            _isBulk
                ? 'Tell us about your business, then set login details.'
                : 'A few details and you’re ready to shop.',
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
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.phone_android_outlined,
                color: AppColors.primary,
                size: 22,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Welcome back',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Enter your phone number and password to continue.',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );
  }
}

class _AccountTypeToggle extends StatelessWidget {
  const _AccountTypeToggle({
    required this.value,
    required this.onChanged,
    required this.enabled,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.all(4),
      child: Row(
        children: [
          Expanded(
            child: _buildOption(
              id: 'retail',
              title: 'Personal',
              subtitle: 'Everyday shopping',
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _buildOption(
              id: 'bulk',
              title: 'Bulk / Business',
              subtitle: 'Wholesale grades',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOption({
    required String id,
    required String title,
    required String subtitle,
  }) {
    final active = value == id;
    return InkWell(
      onTap: enabled ? () => onChanged(id) : null,
      borderRadius: BorderRadius.circular(10),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: active ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
          border: active
              ? Border.all(color: Colors.black.withValues(alpha: 0.08))
              : Border.all(color: Colors.transparent),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  id == 'retail' ? Icons.person_outline : Icons.business_outlined,
                  size: 16,
                  color: active ? AppColors.primary : Colors.grey.shade600,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    title,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: active ? AppColors.textPrimary : Colors.grey.shade700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey.shade500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
