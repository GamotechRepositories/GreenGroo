import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/onboarding_nav.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';
import 'widgets/auth_brand_header.dart';
import 'widgets/auth_screen_background.dart';
import 'widgets/auth_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isRegister = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _agreedTerms = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map && args['mode'] == 'register') {
        setState(() => _isRegister = true);
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _switchMode(bool register) {
    if (_isRegister == register) return;
    setState(() {
      _isRegister = register;
      _agreedTerms = false;
      _obscurePassword = true;
      _obscureConfirm = true;
    });
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (_isRegister && name.isEmpty) {
      _showError('Please enter your full name');
      return;
    }
    if (phone.length != 10) {
      _showError(l10n.mobileNumberHint);
      return;
    }
    if (password.length < 6) {
      _showError(l10n.passwordHint);
      return;
    }
    if (_isRegister && password != confirmPassword) {
      _showError('Passwords do not match');
      return;
    }
    if (_isRegister && !_agreedTerms) {
      _showError('Please agree to Terms & Conditions');
      return;
    }

    setState(() => _loading = true);
    try {
      final result = _isRegister
          ? await AuthService.instance.register(
              phone: phone,
              password: password,
              name: name,
            )
          : await AuthService.instance.login(
              phone: phone,
              password: password,
            );

      if (!mounted) return;

      final boy = result.deliveryBoy;
      final route = AuthService.routeForStep(
        boy.onboardingStep,
        complete: boy.onboardingComplete,
        boy: boy,
      );
      Navigator.pushReplacementNamed(
        context,
        route,
        arguments: AuthService.argumentsForStep(boy),
      );
    } on AuthApiException catch (e) {
      if (mounted) _showError(e.message);
    } catch (_) {
      if (mounted) _showError(l10n.authError);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: AppColors.error),
    );
  }

  Widget _passwordToggle({
    required bool obscure,
    required VoidCallback onTap,
  }) {
    return IconButton(
      icon: Icon(
        obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
        color: const Color(0xFF9CA3AF),
        size: 20,
      ),
      onPressed: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: AuthScreenBackground(
        child: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.centerLeft,
                child: AppBackButton(
                  fallbackRoute: AppRoutes.selectLanguage,
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(24, 4, 24, 24),
                  child: Column(
                    children: [
                      const AuthBrandHeader(),
                      const SizedBox(height: 28),
                      Text(
                        _isRegister ? l10n.createAccount : 'Welcome Back!',
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        _isRegister
                            ? 'Join Delivery Partner'
                            : 'Login to continue delivering smiles',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 28),
                      if (_isRegister) ...[
                        AuthTextField(
                          label: 'Full Name',
                          hint: 'Enter your full name',
                          icon: Icons.person_outline_rounded,
                          controller: _nameController,
                          textCapitalization: TextCapitalization.words,
                        ),
                        const SizedBox(height: 18),
                      ],
                      AuthTextField(
                        label: l10n.mobileNumber,
                        hint: '+91 00000 00000',
                        icon: Icons.smartphone_rounded,
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        maxLength: 10,
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      ),
                      const SizedBox(height: 18),
                      AuthTextField(
                        label: l10n.password,
                        hint: 'Enter your password',
                        icon: Icons.lock_outline_rounded,
                        controller: _passwordController,
                        obscureText: _obscurePassword,
                        suffix: _passwordToggle(
                          obscure: _obscurePassword,
                          onTap: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                      if (!_isRegister)
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => _showError(
                              'Please contact support to reset password.',
                            ),
                            child: Text(
                              'Forgot Password?',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ),
                      if (_isRegister) ...[
                        const SizedBox(height: 18),
                        AuthTextField(
                          label: 'Confirm Password',
                          hint: 'Confirm your password',
                          icon: Icons.lock_outline_rounded,
                          controller: _confirmPasswordController,
                          obscureText: _obscureConfirm,
                          suffix: _passwordToggle(
                            obscure: _obscureConfirm,
                            onTap: () => setState(
                              () => _obscureConfirm = !_obscureConfirm,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 24,
                              height: 24,
                              child: Checkbox(
                                value: _agreedTerms,
                                activeColor: AppColors.primary,
                                side: const BorderSide(color: Color(0xFFD1D5DB)),
                                onChanged: (v) => setState(
                                  () => _agreedTerms = v ?? false,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Padding(
                                padding: const EdgeInsets.only(top: 2),
                                child: Text.rich(
                                  TextSpan(
                                    style: GoogleFonts.inter(
                                      fontSize: 13,
                                      color: AppColors.textSecondary,
                                      height: 1.4,
                                    ),
                                    children: [
                                      const TextSpan(text: 'I agree to the '),
                                      TextSpan(
                                        text: 'Terms & Conditions',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const TextSpan(text: ' and '),
                                      TextSpan(
                                        text: 'Privacy Policy',
                                        style: TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                      SizedBox(height: _isRegister ? 22 : 12),
                      PrimaryButton(
                        label: _loading
                            ? '...'
                            : (_isRegister ? l10n.register : l10n.login),
                        onPressed: _loading ? null : _submit,
                      ),
                      if (!_isRegister) ...[
                        const SizedBox(height: 22),
                        Row(
                          children: [
                            const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'or',
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: Color(0xFFE5E7EB))),
                          ],
                        ),
                        const SizedBox(height: 18),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: OutlinedButton(
                            onPressed: _loading
                                ? null
                                : () => _showError('Google login coming soon'),
                            style: OutlinedButton.styleFrom(
                              backgroundColor: Colors.white,
                              side: const BorderSide(color: Color(0xFFE5E7EB)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  width: 22,
                                  height: 22,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(
                                      color: const Color(0xFFE5E7EB),
                                    ),
                                  ),
                                  child: const Center(
                                    child: Text(
                                      'G',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w700,
                                        fontSize: 13,
                                        color: Color(0xFF4285F4),
                                      ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Text(
                                  'Login with Google',
                                  style: GoogleFonts.inter(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      GestureDetector(
                        onTap: _loading
                            ? null
                            : () => _switchMode(!_isRegister),
                        child: Text.rich(
                          textAlign: TextAlign.center,
                          TextSpan(
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                            children: [
                              TextSpan(
                                text: _isRegister
                                    ? 'Already have an account? '
                                    : "Don't have an account? ",
                              ),
                              TextSpan(
                                text: _isRegister ? l10n.login : 'Register Now',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
