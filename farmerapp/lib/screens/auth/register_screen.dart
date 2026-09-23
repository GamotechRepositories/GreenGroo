import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../main_shell.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _farmNameController = TextEditingController();
  final _acresController = TextEditingController();
  final _villageController = TextEditingController();
  final _passwordController = TextEditingController();

  String _selectedSoil = FarmerConstants.soilTypes.first;
  String _selectedIrrigation = FarmerConstants.irrigationTypes.first;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _farmNameController.dispose();
    _acresController.dispose();
    _villageController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _register() {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      final acres = double.tryParse(_acresController.text.trim()) ?? 2.0;
      final newProfile = FarmerProfile(
        id: 'FARM-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
        fullName: _nameController.text.trim(),
        mobile: _mobileController.text.trim(),
        farmName: _farmNameController.text.trim(),
        totalAcres: acres,
        village: _villageController.text.trim(),
        soilType: _selectedSoil,
        irrigationType: _selectedIrrigation,
      );

      FarmerState().updateProfile(newProfile);

      Future.delayed(const Duration(milliseconds: 600), () {
        if (mounted) {
          setState(() => _isLoading = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('शेतकरी नोंदणी यशस्वी झाली! GreenGrocc मध्ये स्वागत आहे.'),
              backgroundColor: AppColors.primary,
            ),
          );
          FarmerState().login();
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const MainShell()),
            (route) => false,
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Farmer Registration (नोंदणी)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Personal & Farm Registration (शेतकरी व शेत माहिती)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                ),
                const SizedBox(height: 16),

                const Text('Full Name (पूर्ण नाव)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _nameController,
                  decoration: _inputDecoration(hint: 'उदा. तुकाराम पाटील'),
                  validator: (v) => v == null || v.trim().isEmpty ? 'कृपया नाव टाका' : null,
                ),
                const SizedBox(height: 12),

                const Text('Mobile Number (मोबाईल नंबर)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _mobileController,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  decoration: _inputDecoration(hint: '10-digit mobile number'),
                  validator: (v) => v == null || v.length != 10 ? '१० अंकी मोबाईल नंबर टाका' : null,
                ),
                const SizedBox(height: 12),

                const Text('Farm Name (शेताचे नाव)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _farmNameController,
                  decoration: _inputDecoration(hint: 'उदा. साई कृषी फार्म'),
                  validator: (v) => v == null || v.trim().isEmpty ? 'शेताचे नाव टाका' : null,
                ),
                const SizedBox(height: 12),

                const Text('Total Land (एकूण क्षेत्र - एकर)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _acresController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: _inputDecoration(hint: 'उदा. 3.5'),
                  validator: (v) => v == null || double.tryParse(v) == null ? 'योग्य क्षेत्र टाका' : null,
                ),
                const SizedBox(height: 12),

                const Text('Village / Taluka (गाव / तालुका)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _villageController,
                  decoration: _inputDecoration(hint: 'उदा. बारामती, पुणे'),
                  validator: (v) => v == null || v.trim().isEmpty ? 'गाव टाका' : null,
                ),
                const SizedBox(height: 12),

                const Text('Password (पासवर्ड)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: _inputDecoration(hint: 'कमीत कमी ४ अक्षरे/अंक'),
                  validator: (v) => v == null || v.length < 4 ? 'कमीत कमी ४ अक्षरे टाका' : null,
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _isLoading ? null : _register,
                    child: _isLoading
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Complete Registration (नोंदणी पूर्ण करा)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),

                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Already registered? Sign In (आधीच नोंदणी केली आहे? लॉगिन करा)',
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

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
    );
  }
}
