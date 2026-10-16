import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../main_shell.dart';
import 'register_screen.dart';
import 'farmer_onboarding_flow_screen.dart';
import '../../core/widgets/six_box_otp_input.dart';
import '../../services/farmer_state.dart';
import '../../services/api_service.dart';
import '../../services/app_language.dart';
import '../../models/farmer_models.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _isOtpMode = false;
  bool _otpSent = false;

  @override
  void initState() {
    super.initState();
    // Auto show Language Selection dialog on first open before login
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (!AppLanguage().hasSelectedOnce) {
        AppLanguage.showSelectionDialog(context, dismissible: false);
      }
    });
  }

  @override
  void dispose() {
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final lang = AppLanguage();
    final mobile = _mobileController.text.trim();
    final pass = _passwordController.text.trim();

    if (mobile.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'कृपया वैध १०-अंकी मोबाईल नंबर टाका',
              en: 'Please enter a valid 10-digit mobile number',
            ),
          ),
        ),
      );
      return;
    }
    if (pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'कृपया पासवर्ड प्रविष्ट करा',
              en: 'Please enter your password',
            ),
          ),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await ApiService().loginFarmer(mobile, pass);
      if (mounted) {
        await _handleSuccessfulLogin(res);
      }
    } catch (err) {
      if (mounted) {
        final errText = err.toString().replaceAll('Exception:', '').trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang.tr(
                mr: 'लॉगिन त्रुटी: $errText',
                en: 'Login error: $errText',
              ),
            ),
            backgroundColor: Colors.red.shade700,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleSuccessfulLogin(Map<String, dynamic> res) async {
    final lang = AppLanguage();
    Map<String, dynamic>? farmerData;
    if (res['farmer'] is Map) {
      farmerData = res['farmer'] as Map<String, dynamic>;
    } else if (res['data'] is Map && res['data']['farmer'] is Map) {
      farmerData = res['data']['farmer'] as Map<String, dynamic>;
    }

    if (farmerData != null) {
      final profile = FarmerProfile.fromJson(farmerData);
      FarmerState().updateProfile(profile);
    }

    final resumeStep = await FarmerState().checkOnboardingStep();
    if (!mounted) return;

    if (resumeStep > 0) {
      // Incomplete onboarding: do not mark completed.
      FarmerState().currentPendingStep = resumeStep;
      FarmerState().login(markCompleted: false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'नोंदणीचे पुढील टप्पे अपूर्ण आहेत. कृपया टप्पा $resumeStep पूर्ण करा.',
              en: 'Registration incomplete. Please complete step $resumeStep.',
            ),
          ),
          backgroundColor: Colors.orange.shade800,
          duration: const Duration(seconds: 3),
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (_) => FarmerOnboardingFlowScreen(initialStep: resumeStep),
        ),
        (route) => false,
      );
    } else {
      // Complete: allowed to enter main app!
      FarmerState().login(markCompleted: true);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'लॉगिन यशस्वी! स्वागत आहे ${FarmerState().profile.fullName}',
              en: 'Login successful! Welcome ${FarmerState().profile.fullName}',
            ),
          ),
          backgroundColor: AppColors.primary,
          duration: const Duration(seconds: 2),
        ),
      );

      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const MainShell()),
        (route) => false,
      );
    }
  }

  Future<void> _sendOtp() async {
    final lang = AppLanguage();
    final mobile = _mobileController.text.trim();
    if (mobile.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'कृपया वैध १०-अंकी मोबाईल नंबर टाका',
              en: 'Please enter a valid 10-digit mobile number',
            ),
          ),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    String? devCode;
    try {
      final res = await ApiService().sendFarmerOtp(mobile, purpose: 'login');
      devCode = res['code']?.toString();
      if (mounted) {
        setState(() => _otpSent = true);
        final devCodeMsg = devCode != null ? ' (OTP: $devCode)' : '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang.tr(
                mr: 'हरितसेतू ओटीपी पाठवला आहे!$devCodeMsg',
                en: 'Haritsetu OTP sent successfully!$devCodeMsg',
              ),
            ),
            backgroundColor: AppColors.primary,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final errText = e.toString().replaceAll('Exception:', '').trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              lang.tr(
                mr: 'त्रुटी: $errText',
                en: 'Error: $errText',
              ),
            ),
            backgroundColor: Colors.red.shade700,
          ),
        );
      }
      return;
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }

    if (!mounted) return;
    await _showLoginOtpCenterDialog(mobile, initialDevCode: devCode);
  }

  Future<void> _showLoginOtpCenterDialog(String mobile, {String? initialDevCode}) async {
    final lang = AppLanguage();
    await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) {
        final otpController = TextEditingController();
        bool verifying = false;
        bool resending = false;
        String? errorText;
        String? devCode = initialDevCode;

        return StatefulBuilder(
          builder: (context, setDialogState) {
            return Dialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 10,
              backgroundColor: Colors.white,
              insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
              clipBehavior: Clip.antiAlias,
              child: SingleChildScrollView(
                child: Stack(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(22, 26, 22, 22),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 58,
                            height: 58,
                            decoration: const BoxDecoration(
                              color: AppColors.primaryLight,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.mark_email_read_outlined,
                              color: AppColors.primary,
                              size: 30,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            lang.tr(mr: 'लॉगिन पडताळणी', en: 'Login Verification'),
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            lang.tr(
                              mr: 'आम्ही +91 $mobile वर हरितसेतू लॉगिन OTP पाठवला आहे.',
                              en: 'We sent a Haritsetu login OTP to +91 $mobile.',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), height: 1.4),
                          ),
                          if (devCode != null && devCode!.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            InkWell(
                              onTap: () {
                                setDialogState(() {
                                  otpController.text = devCode!;
                                  errorText = null;
                                });
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.amber.shade300),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.touch_app_outlined, size: 15, color: Colors.amber.shade900),
                                    const SizedBox(width: 4),
                                    Text(
                                      lang.tr(
                                        mr: 'डेव्हलपमेंट कोड: $devCode (भरण्यासाठी टॅप करा)',
                                        en: 'Dev OTP: $devCode (Tap to fill)',
                                      ),
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.amber.shade900,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 20),
                          SixBoxOtpInput(
                            controller: otpController,
                            autofocus: true,
                          ),
                          if (errorText != null) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.red.shade50,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.red.shade200),
                              ),
                              child: Text(
                                errorText!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.red.shade700,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                lang.tr(mr: 'ओटीपी मिळाला नाही? ', en: 'Did not receive OTP? '),
                                style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                              ),
                              TextButton(
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  minimumSize: Size.zero,
                                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                ),
                                onPressed: resending
                                    ? null
                                    : () async {
                                        setDialogState(() {
                                          resending = true;
                                          errorText = null;
                                          otpController.clear();
                                        });
                                        try {
                                          final res = await ApiService().sendFarmerOtp(mobile, purpose: 'login');
                                          setDialogState(() {
                                            devCode = res['code']?.toString();
                                          });
                                          if (dialogContext.mounted) {
                                            ScaffoldMessenger.of(dialogContext).showSnackBar(
                                              SnackBar(
                                                content: Text(
                                                  lang.tr(mr: 'ओटीपी पुन्हा पाठवला आहे!', en: 'OTP resent successfully!'),
                                                ),
                                                backgroundColor: AppColors.primary,
                                                duration: const Duration(seconds: 2),
                                              ),
                                            );
                                          }
                                        } catch (e) {
                                          setDialogState(() {
                                            errorText = e.toString().replaceAll('Exception:', '').trim();
                                          });
                                        } finally {
                                          setDialogState(() => resending = false);
                                        }
                                      },
                                child: resending
                                    ? const SizedBox(
                                        width: 14,
                                        height: 14,
                                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                      )
                                    : Text(
                                        lang.tr(mr: 'पुन्हा पाठवा', en: 'Resend OTP'),
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 13),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              onPressed: verifying
                                  ? null
                                  : () async {
                                      final otp = otpController.text.trim();
                                      if (otp.length < 4) {
                                        setDialogState(() {
                                          errorText = lang.tr(
                                            mr: 'कृपया वैध ६ अंकी ओटीपी टाका',
                                            en: 'Please enter a valid 6-digit OTP',
                                          );
                                        });
                                        return;
                                      }

                                      setDialogState(() {
                                        verifying = true;
                                        errorText = null;
                                      });

                                      try {
                                        final res = await ApiService().verifyFarmerOtp(mobile, otp, purpose: 'login');
                                        if (dialogContext.mounted) {
                                          Navigator.pop(dialogContext, true);
                                        }
                                        if (mounted) {
                                          await _handleSuccessfulLogin(res);
                                        }
                                      } catch (e) {
                                        setDialogState(() {
                                          errorText = e.toString().replaceAll('Exception:', '').trim();
                                        });
                                      } finally {
                                        setDialogState(() => verifying = false);
                                      }
                                    },
                              child: verifying
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : Text(
                                      lang.tr(mr: 'ओटीपी तपासा आणि लॉगिन करा', en: 'Verify OTP & Sign In'),
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                    ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Positioned(
                      top: 10,
                      right: 10,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF94A3B8), size: 22),
                        onPressed: () => Navigator.pop(dialogContext, false),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: AppLanguage(),
      builder: (context, _) {
        final lang = AppLanguage();

        return Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Language Switcher Button on Top
                    Align(
                      alignment: Alignment.centerRight,
                      child: InkWell(
                        onTap: () => AppLanguage.showSelectionDialog(context),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(lang.isMarathi ? '🇮🇳' : '🌐', style: const TextStyle(fontSize: 14)),
                              const SizedBox(width: 6),
                              Text(
                                lang.isMarathi ? 'मराठी' : 'English',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.primary),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.eco_rounded, color: AppColors.primary, size: 20),
                              ),
                              const SizedBox(width: 10),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'GREENGROCC',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primary,
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                  Text(
                                    lang.tr(mr: 'शेतकरी पॅनेल', en: 'Farmer Panel'),
                                    style: const TextStyle(
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          Text(
                            lang.tr(mr: 'शेतकरी लॉगिन', en: 'Farmer Sign In'),
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            lang.tr(
                              mr: 'तुमच्या खात्यात सुरक्षितपणे प्रवेश करा',
                              en: 'Sign in to access your farmer dashboard',
                            ),
                            style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 22),

                          Text(
                            lang.tr(mr: 'मोबाईल नंबर', en: 'Mobile Number'),
                            style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                          ),
                          const SizedBox(height: 6),
                          TextField(
                            controller: _mobileController,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: InputDecoration(
                              prefixText: '+91 ',
                              hintText: lang.tr(mr: '१० अंकी मोबाईल नंबर टाका', en: 'Enter 10-digit mobile number'),
                              hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.normal),
                              prefixStyle: const TextStyle(fontSize: 13, color: AppColors.text, fontWeight: FontWeight.w500),
                              counterText: '',
                              filled: true,
                              fillColor: const Color(0xFFF8FAFC),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                                borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Mode selector tabs
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Row(
                              children: [
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _isOtpMode = false),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: !_isOtpMode ? Colors.white : Colors.transparent,
                                        borderRadius: BorderRadius.circular(8),
                                        boxShadow: !_isOtpMode
                                            ? [const BoxShadow(color: Colors.black12, blurRadius: 2)]
                                            : null,
                                      ),
                                      child: Center(
                                        child: Text(
                                          lang.tr(mr: 'पासवर्ड', en: 'Password'),
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.bold,
                                            color: !_isOtpMode ? AppColors.primary : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                Expanded(
                                  child: GestureDetector(
                                    onTap: () => setState(() => _isOtpMode = true),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 8),
                                      decoration: BoxDecoration(
                                        color: _isOtpMode ? Colors.white : Colors.transparent,
                                        borderRadius: BorderRadius.circular(8),
                                        boxShadow: _isOtpMode
                                            ? [const BoxShadow(color: Colors.black12, blurRadius: 2)]
                                            : null,
                                      ),
                                      child: Center(
                                        child: Text(
                                          lang.tr(mr: 'हरितसेतू OTP', en: 'Haritsetu OTP'),
                                          style: TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.bold,
                                            color: _isOtpMode ? AppColors.primary : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          if (!_isOtpMode) ...[
                            Text(
                              lang.tr(mr: 'पासवर्ड', en: 'Password'),
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                            ),
                            const SizedBox(height: 6),
                            TextField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                              decoration: InputDecoration(
                                hintText: lang.tr(mr: 'पासवर्ड प्रविष्ट करा', en: 'Enter your password'),
                                hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.normal),
                                filled: true,
                                fillColor: const Color(0xFFF8FAFC),
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                                    color: Colors.grey.shade600,
                                    size: 20,
                                  ),
                                  onPressed: () {
                                    setState(() => _obscurePassword = !_obscurePassword);
                                  },
                                ),
                              ),
                            ),
                            const SizedBox(height: 22),

                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                  elevation: 0,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                onPressed: _isLoading ? null : _login,
                                child: _isLoading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                      )
                                    : Text(
                                        lang.tr(mr: 'लॉगिन करा', en: 'Sign In'),
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                      ),
                              ),
                            ),
                          ] else ...[
                            if (_otpSent) ...[
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF0FDF4),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      children: [
                                        const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 22),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Text(
                                            lang.tr(
                                              mr: 'ओटीपी +91 ${_mobileController.text.trim()} वर पाठवला आहे',
                                              en: 'OTP sent to +91 ${_mobileController.text.trim()}',
                                            ),
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              color: Color(0xFF166534),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 14),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: AppColors.primary,
                                          foregroundColor: Colors.white,
                                          padding: const EdgeInsets.symmetric(vertical: 13),
                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                          elevation: 0,
                                        ),
                                        onPressed: () => _showLoginOtpCenterDialog(_mobileController.text.trim()),
                                        icon: const Icon(Icons.pin, size: 20),
                                        label: Text(
                                          lang.tr(mr: 'ओटीपी प्रविष्ट करा (OTP Popup)', en: 'Enter OTP (Center Popup)'),
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    TextButton(
                                      onPressed: _isLoading ? null : _sendOtp,
                                      child: Text(
                                        lang.tr(mr: 'नवीन ओटीपी पाठवा (Resend OTP)', en: 'Resend OTP'),
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ] else ...[
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primary,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  onPressed: _isLoading ? null : _sendOtp,
                                  child: _isLoading
                                      ? const SizedBox(
                                          height: 20,
                                          width: 20,
                                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                        )
                                      : Text(
                                          lang.tr(mr: 'ओटीपी पाठवा आणि लॉगिन करा', en: 'Send Haritsetu OTP & Sign In'),
                                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                        ),
                                ),
                              ),
                            ],
                          ],
                          const SizedBox(height: 16),

                          Center(
                            child: TextButton(
                              onPressed: () {
                                Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
                              },
                              child: Text(
                                lang.tr(
                                  mr: 'नवीन शेतकरी आहात? येथे नोंदणी करा',
                                  en: 'New Farmer? Register here',
                                ),
                                style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
