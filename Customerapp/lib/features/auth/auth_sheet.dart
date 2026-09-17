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
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _submitting = false;
  String? _error;

  bool get _isSignup => widget.mode == AuthModalMode.signup;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_clearError);
    _nameController.addListener(_clearError);
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
    _phoneController.clear();
    _passwordController.clear();
    _confirmPasswordController.clear();
    setState(() {
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

    if (_isSignup && !Validators.isValidName(name)) {
      return 'Name must be 1 or 2 words, letters only (e.g. Rahul or John Smith)';
    }
    if (!Validators.isValidPhone(phone)) {
      return 'Phone must be 10 digits starting with 6, 7, 8, or 9';
    }
    if (password.length < 6) {
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
            const SizedBox(height: 20),
            if (_isSignup) ...[
              TextField(
                controller: _nameController,
                enabled: !_submitting,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  hintText: 'Enter your full name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 14),
            ],
            TextField(
              controller: _phoneController,
              enabled: !_submitting,
              decoration: const InputDecoration(
                labelText: 'Mobile Number',
                hintText: 'Enter 10-digit number',
                prefixIcon: Icon(Icons.phone_outlined),
                prefixText: '+91 ',
              ),
              keyboardType: TextInputType.phone,
              maxLength: 10,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _passwordController,
              enabled: !_submitting,
              obscureText: !_showPassword,
              decoration: InputDecoration(
                labelText: 'Password',
                hintText: 'Enter your password (min 6 chars)',
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
              const SizedBox(height: 14),
              TextField(
                controller: _confirmPasswordController,
                enabled: !_submitting,
                obscureText: !_showConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  hintText: 'Re-enter your password',
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
                      _isSignup ? 'Create Account' : 'Sign In',
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
                child: const Icon(
                  Icons.person_add_outlined,
                  color: AppColors.primary,
                  size: 22,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Create Your Account',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Fill your details and set a password to sign up',
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
                'Welcome Back',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Text(
          'Sign in with your phone number and password',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
      ],
    );
  }
}
