import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../services/api_service.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';
import 'registration_success_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _dobController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _villageController = TextEditingController();
  final _talukaController = TextEditingController();
  final _districtController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _referralController = TextEditingController();

  String _selectedGender = 'Male';
  String _profileImage = '';
  DateTime? _selectedDateOfBirth;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;
  String? _imageError;

  final List<String> _genderOptions = ['Male', 'Female', 'Other'];

  // Maximum allowed Date of Birth (must be at least 18 years old)
  DateTime get _maxDob {
    final now = DateTime.now();
    return DateTime(now.year - 18, now.month, now.day);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _dobController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _villageController.dispose();
    _talukaController.dispose();
    _districtController.dispose();
    _pincodeController.dispose();
    _referralController.dispose();
    super.dispose();
  }

  Future<void> _pickDateOfBirth() async {
    final initial = _selectedDateOfBirth ?? DateTime(1995, 1, 1);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isAfter(_maxDob) ? _maxDob : initial,
      firstDate: DateTime(1940),
      lastDate: _maxDob,
      helpText: 'Select Date of Birth (किमान वय १८ वर्षे)',
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: AppColors.primaryDark,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _selectedDateOfBirth = picked;
        _dobController.text =
            '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      });
    }
  }

  void _pickProfilePhoto() {
    showAppPhotoPicker(
      context,
      title: 'Farmer Photo (शेतकरी फोटो)',
      subtitle: 'लाईव्ह कॅमेऱ्याने फोटो काढा किंवा गॅलरी मधून निवडा',
      onPhotoSelected: (photoStr) {
        setState(() {
          _profileImage = photoStr;
          _imageError = null;
        });
      },
    );
  }

  Future<void> _register() async {
    setState(() => _imageError = null);

    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedDateOfBirth == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('कृपया जन्मतारीख निवडा (Select Date of Birth)'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_profileImage.isEmpty) {
      setState(() => _imageError = 'Farmer photo is required (शेतकरी फोटो आवश्यक आहे)');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('शेतकरी फोटो अपलोड करणे आवश्यक आहे'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final payload = {
      'name': _nameController.text.trim(),
      'dateOfBirth': _dobController.text.trim(),
      'gender': _selectedGender,
      'mobile': _mobileController.text.trim(),
      'password': _passwordController.text,
      'village': _villageController.text.trim(),
      'taluka': _talukaController.text.trim(),
      'district': _districtController.text.trim(),
      'pincode': _pincodeController.text.trim(),
      'profileImage': _profileImage,
      'referralCode': _referralController.text.trim(),
    };

    FarmerProfile? registeredProfile;

    try {
      final res = await ApiService().registerFarmer(payload);
      if (res['farmer'] != null && res['farmer'] is Map) {
        final fData = res['farmer'] as Map<String, dynamic>;
        registeredProfile = FarmerProfile.fromJson(fData);
      }
    } catch (e) {
      // If offline or network issue, create clean local record
      final fallbackId =
          'GGC-FR-MH-${_districtController.text.trim().takeThree().toUpperCase()}-${_talukaController.text.trim().takeThree().toUpperCase()}-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';

      registeredProfile = FarmerProfile(
        id: fallbackId,
        fullName: _nameController.text.trim(),
        mobile: _mobileController.text.trim(),
        village: _villageController.text.trim(),
        taluka: _talukaController.text.trim(),
        district: _districtController.text.trim(),
        pincode: _pincodeController.text.trim(),
        profilePhoto: _profileImage,
        kycStatus: 'PENDING',
        bankVerificationStatus: 'PENDING',
        farmName: '${_nameController.text.trim()} Krushi Farm',
        totalAcres: 0,
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);

        if (registeredProfile != null) {
          FarmerState().updateProfile(registeredProfile);
          FarmerState().login();

          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (_) => RegistrationSuccessScreen(farmer: registeredProfile!),
            ),
            (route) => false,
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Farmer Registration (नोंदणी)',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
                // Header (Exact copy of web /farmer/register)
                const Text(
                  'FARMER REGISTRATION',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                    letterSpacing: 1.1,
                  ),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Create your farmer account',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Fill in your details. After registration you can continue to KYC.',
                  style: TextStyle(fontSize: 11.5, color: AppColors.muted),
                ),
                const SizedBox(height: 18),

                // 1. Farmer Full Name *
                _fieldLabel('Farmer Full Name (शेतकऱ्याचे नाव) *'),
                TextFormField(
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                  decoration: _inputDecoration(hint: 'पूर्ण नाव'),
                  validator: (v) {
                    if (v == null || v.trim().length < 3) {
                      return 'Enter farmer full name (min 3 characters)';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 14),

                // 2. Date of Birth * & Gender *
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // DOB
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Date of Birth (जन्मतारीख) *'),
                          InkWell(
                            onTap: _pickDateOfBirth,
                            borderRadius: BorderRadius.circular(8),
                            child: IgnorePointer(
                              child: TextFormField(
                                controller: _dobController,
                                style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                                decoration: _inputDecoration(
                                  hint: 'YYYY-MM-DD',
                                  suffixIcon: const Icon(Icons.calendar_today, size: 16, color: AppColors.primary),
                                ),
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) {
                                    return 'DOB required';
                                  }
                                  return null;
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Gender
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Gender (लिंग) *'),
                          Container(
                            height: 46,
                            padding: const EdgeInsets.symmetric(horizontal: 10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: DropdownButtonHideUnderline(
                              child: DropdownButton<String>(
                                isExpanded: true,
                                value: _selectedGender,
                                style: const TextStyle(fontSize: 13, color: AppColors.primaryDark),
                                items: _genderOptions.map((g) {
                                  final marathi = g == 'Male'
                                      ? 'पुरुष (Male)'
                                      : (g == 'Female' ? 'स्त्री (Female)' : 'इतर (Other)');
                                  return DropdownMenuItem(value: g, child: Text(marathi, style: const TextStyle(fontSize: 12.5)));
                                }).toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _selectedGender = val);
                                },
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 3. Mobile Number *
                _fieldLabel('Mobile Number (मोबाईल नंबर) *'),
                TextFormField(
                  controller: _mobileController,
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                  decoration: _inputDecoration(
                    hint: '१०-अंकी मोबाईल नंबर',
                    prefixText: '+91 ',
                  ),
                  validator: (v) {
                    if (v == null || !RegExp(r'^[6-9]\d{9}$').hasMatch(v.trim())) {
                      return 'Enter a valid 10-digit mobile number';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 6),

                // 4. Password * & Confirm Password *
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Password (पासवर्ड) *'),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscurePassword,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(
                              hint: 'किमान ६ अक्षरे',
                              suffixIcon: IconButton(
                                icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, size: 16, color: Colors.grey.shade600),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.length < 6) {
                                return 'Min 6 characters';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Confirm Password *'),
                          TextFormField(
                            controller: _confirmPasswordController,
                            obscureText: _obscureConfirmPassword,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(
                              hint: 'पासवर्ड पुन्हा टाका',
                              suffixIcon: IconButton(
                                icon: Icon(_obscureConfirmPassword ? Icons.visibility_off : Icons.visibility, size: 16, color: Colors.grey.shade600),
                                onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                              ),
                            ),
                            validator: (v) {
                              if (v != _passwordController.text) {
                                return 'Passwords do not match';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 5. Village * & Taluka *
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Village (गाव) *'),
                          TextFormField(
                            controller: _villageController,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(hint: 'गाव'),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Village is required' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Taluka (तालुका) *'),
                          TextFormField(
                            controller: _talukaController,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(hint: 'तालुका'),
                            validator: (v) => v == null || v.trim().isEmpty ? 'Taluka is required' : null,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // 6. District * & Pincode *
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('District (जिल्हा) *'),
                          TextFormField(
                            controller: _districtController,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(hint: 'उदा. Ahilyanagar'),
                            validator: (v) => v == null || v.trim().isEmpty ? 'District is required' : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _fieldLabel('Pincode (पिनकोड) *'),
                          TextFormField(
                            controller: _pincodeController,
                            keyboardType: TextInputType.number,
                            maxLength: 6,
                            style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                            decoration: _inputDecoration(hint: '६-अंकी पिनकोड'),
                            validator: (v) {
                              if (v == null || !RegExp(r'^\d{6}$').hasMatch(v.trim())) {
                                return '6-digit pincode';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // 7. Farmer Photo * (Upload Card)
                _fieldLabel('Farmer Photo (शेतकरी फोटो) *'),
                InkWell(
                  onTap: _pickProfilePhoto,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _imageError != null ? AppColors.error : AppColors.border,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 54,
                          height: 54,
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _profileImage.isNotEmpty
                              ? AppImageWidget(
                                  imageStr: _profileImage,
                                  width: 54,
                                  height: 54,
                                  fit: BoxFit.cover,
                                )
                              : const Icon(Icons.account_box, color: AppColors.primary, size: 30),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                _profileImage.isNotEmpty ? 'Photo selected ✓ (फोटो निवडला)' : 'Click to Upload Photo *',
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.bold,
                                  color: _profileImage.isNotEmpty ? AppColors.success : AppColors.primary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'कॅमेऱ्याने लाईव्ह फोटो काढा किंवा गॅलरीतून निवडा',
                                style: TextStyle(fontSize: 10.5, color: AppColors.muted),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.camera_alt, color: AppColors.primary, size: 20),
                      ],
                    ),
                  ),
                ),
                if (_imageError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4, left: 4),
                    child: Text(_imageError!, style: const TextStyle(fontSize: 11, color: AppColors.error)),
                  ),
                const SizedBox(height: 14),

                // 8. Referral / Agent Code (Optional)
                _fieldLabel('Referral / Agent Code (Optional)'),
                TextFormField(
                  controller: _referralController,
                  style: const TextStyle(fontSize: 13.5, color: AppColors.text),
                  decoration: _inputDecoration(hint: 'रेफरल / एजंट कोड असल्यास टाका'),
                ),
                const SizedBox(height: 24),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                    onPressed: _isLoading ? null : _register,
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text(
                            'Create Farmer Account (खाते तयार करा)',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 14),

                // Back to Sign In
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'Already registered? Back to Sign In (लॉगिन करा)',
                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12.5),
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

  Widget _fieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 5),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF4B5563)),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint, String? prefixText, Widget? suffixIcon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        fontSize: 12,
        color: Color(0xFF9CA3AF), // Clean faint grey
        fontWeight: FontWeight.normal,
      ),
      prefixText: prefixText,
      prefixStyle: const TextStyle(
        fontSize: 13,
        color: AppColors.text,
        fontWeight: FontWeight.w500,
      ),
      suffixIcon: suffixIcon,
      counterText: '',
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.error),
      ),
    );
  }
}

extension on String {
  String takeThree() {
    final s = trim();
    return s.length >= 3 ? s.substring(0, 3) : (s.isNotEmpty ? s : 'LOC');
  }
}
