import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../main_shell.dart';
import 'register_screen.dart';
import '../../services/farmer_state.dart';
import '../../services/api_service.dart';
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

  @override
  void dispose() {
    _mobileController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final mobile = _mobileController.text.trim();
    final pass = _passwordController.text.trim();

    if (mobile.length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('कृपया वैध १०-अंकी मोबाईल नंबर टाका')),
      );
      return;
    }
    if (pass.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('कृपया पासवर्ड प्रविष्ट करा')),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final res = await ApiService().loginFarmer(mobile, pass);

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
      FarmerState().login();
      await FarmerState().fetchFromBackend();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('लॉगिन यशस्वी! स्वागत आहे ${FarmerState().profile.fullName}'),
            backgroundColor: AppColors.primary,
          ),
        );
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const MainShell()),
        );
      }
    } catch (err) {
      if (mounted) {
        final errText = err.toString().replaceAll('Exception:', '').trim();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('लॉगिन त्रुटी: $errText'),
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'GREENGROCC FARMER',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary, letterSpacing: 1.2),
                ),
                const SizedBox(height: 6),
                const Text(
                  'Sign in to Farmer Panel (शेतकरी लॉगिन)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                const SizedBox(height: 20),

                const Text('Mobile Number (मोबाईल नंबर)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: _mobileController,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                  decoration: InputDecoration(
                    prefixText: '+91 ',
                    hintText: 'मोबाईल क्रमांक प्रविष्ट करा',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.normal),
                    prefixStyle: const TextStyle(fontSize: 13, color: AppColors.text, fontWeight: FontWeight.w500),
                    counterText: '',
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 14),

                const Text('Password (पासवर्ड)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                  decoration: InputDecoration(
                    hintText: 'पासवर्ड प्रविष्ट करा',
                    hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF), fontWeight: FontWeight.normal),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
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
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _isLoading ? null : _login,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Sign In (लॉगिन करा)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),

                Center(
                  child: TextButton(
                    onPressed: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => const RegisterScreen()));
                    },
                    child: const Text(
                      'New Farmer? Register here (नवीन शेतकरी नोंदणी)',
                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
