import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/onboarding_nav.dart';

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  String _phone = '9876543210';
  bool _isRegister = true;
  String _otp = '';
  int _resendSeconds = 25;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args is Map) {
        if (args['phone'] != null) setState(() => _phone = args['phone']);
        if (args['isRegister'] != null) setState(() => _isRegister = args['isRegister']);
      }
    });
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() => _resendSeconds = 25);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_resendSeconds > 0) {
        setState(() => _resendSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _onKeyPress(String val) {
    if (_otp.length < 6) {
      setState(() => _otp += val);
      if (_otp.length == 6) {
        _verifyOtp();
      }
    }
  }

  void _onBackspace() {
    if (_otp.isNotEmpty) {
      setState(() => _otp = _otp.substring(0, _otp.length - 1));
    }
  }

  void _verifyOtp() {
    // Successfully verified OTP -> proceed to Select State / Profile Details
    if (_isRegister) {
      Navigator.pushNamed(context, AppRoutes.selectState);
    } else {
      Navigator.pushReplacementNamed(context, AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final timerString = '00:${_resendSeconds.toString().padLeft(2, '0')}';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const AppBackButton(fallbackRoute: AppRoutes.login),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    Text(
                      'Enter OTP',
                      style: GoogleFonts.inter(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      "We've sent a 6 digit OTP to\n+91 $_phone",
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // 6 OTP Digit Boxes
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(6, (index) {
                        final char = index < _otp.length ? _otp[index] : '';
                        final active = index == _otp.length;
                        return Container(
                          width: 48,
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: active
                                  ? AppColors.primary
                                  : (char.isNotEmpty
                                      ? AppColors.primary
                                      : const Color(0xFFE5E7EB)),
                              width: active || char.isNotEmpty ? 1.5 : 1,
                            ),
                          ),
                          child: Center(
                            child: Text(
                              char,
                              style: GoogleFonts.inter(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          ),
                        );
                      }),
                    ),
                    const SizedBox(height: 24),
                    Center(
                      child: GestureDetector(
                        onTap: _resendSeconds == 0 ? _startTimer : null,
                        child: RichText(
                          text: TextSpan(
                            style: GoogleFonts.inter(fontSize: 13),
                            children: [
                              TextSpan(
                                text: 'Resend OTP in ',
                                style: TextStyle(color: AppColors.textSecondary),
                              ),
                              TextSpan(
                                text: _resendSeconds > 0 ? timerString : 'Resend Now',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // In-app Numeric Dialpad
            Container(
              color: const Color(0xFFF8FAFC),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                children: [
                  for (final row in [
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['', '0', 'backspace'],
                  ])
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Row(
                        children: row.map((key) {
                          if (key.isEmpty) {
                            return const Expanded(child: SizedBox());
                          }
                          return Expanded(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: InkWell(
                                onTap: () {
                                  if (key == 'backspace') {
                                    _onBackspace();
                                  } else {
                                    _onKeyPress(key);
                                  }
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Color(0x08000000),
                                        blurRadius: 4,
                                        offset: Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: key == 'backspace'
                                        ? const Icon(
                                            Icons.backspace_outlined,
                                            size: 20,
                                            color: Color(0xFF374151),
                                          )
                                        : Text(
                                            key,
                                            style: GoogleFonts.inter(
                                              fontSize: 20,
                                              fontWeight: FontWeight.w600,
                                              color: const Color(0xFF1F2937),
                                            ),
                                          ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
