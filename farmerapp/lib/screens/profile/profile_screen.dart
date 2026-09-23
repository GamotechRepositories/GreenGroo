import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../auth/login_screen.dart';
import '../main_shell.dart';

enum ProfileStep {
  farmerProfile,
  farmProfile,
  farmLocation,
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  ProfileStep _currentStep = ProfileStep.farmerProfile;

  // Editing state for each step
  bool _isEditingFarmer = false;
  bool _isEditingFarm = false;
  bool _isEditingLocation = false;

  // Controllers for Farmer Profile
  late TextEditingController _nameController;
  late TextEditingController _villageController;
  late TextEditingController _talukaController;
  late TextEditingController _districtController;
  late TextEditingController _pincodeController;
  String _selectedLanguage = 'मराठी (Marathi)';

  // Controllers for Farm Profile
  late TextEditingController _farmNameController;
  late TextEditingController _totalAreaController;
  String _totalAreaUnit = 'Acre';
  late TextEditingController _cultivatedAreaController;
  String _cultivatedAreaUnit = 'Acre';
  String _soilType = 'Black Soil (काळी माती)';
  String _irrigationType = 'Drip (ठिबक)';
  String _waterSource = 'Borewell (बोअरवेल)';
  String _farmingMethod = 'Organic (सेंद्रिय)';
  String _farmingType = 'Individual (स्वतःची)';
  late TextEditingController _mainCropsController;

  // Controllers for Farm Location
  late TextEditingController _locVillageController;
  late TextEditingController _locTalukaController;
  late TextEditingController _locDistrictController;
  late TextEditingController _locPincodeController;
  late TextEditingController _farmAddressController;
  double _latitude = 19.5761;
  double _longitude = 74.2070;
  bool _locationConfirmed = true;

  @override
  void initState() {
    super.initState();
    final p = FarmerState().profile;

    _nameController = TextEditingController(text: p.fullName);
    _villageController = TextEditingController(text: p.village);
    _talukaController = TextEditingController(text: p.taluka);
    _districtController = TextEditingController(text: p.district);
    _pincodeController = TextEditingController(text: p.pincode);
    _selectedLanguage = p.preferredLanguage;

    _farmNameController = TextEditingController(text: p.farmName);
    _totalAreaController = TextEditingController(text: p.totalAcres.toStringAsFixed(1));
    _totalAreaUnit = p.totalFarmAreaUnit;
    _cultivatedAreaController = TextEditingController(text: p.cultivatedArea.toStringAsFixed(1));
    _cultivatedAreaUnit = p.cultivatedAreaUnit;
    _soilType = p.soilType;
    _irrigationType = p.irrigationType;
    _waterSource = p.waterSource;
    _farmingMethod = p.farmingMethod;
    _farmingType = p.farmingType;
    _mainCropsController = TextEditingController(text: p.mainCrops);

    _locVillageController = TextEditingController(text: p.village);
    _locTalukaController = TextEditingController(text: p.taluka);
    _locDistrictController = TextEditingController(text: p.district);
    _locPincodeController = TextEditingController(text: p.pincode);
    _farmAddressController = TextEditingController(text: p.farmAddress);
    _latitude = p.latitude ?? 19.5761;
    _longitude = p.longitude ?? 74.2070;
    _locationConfirmed = p.locationConfirmed;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _villageController.dispose();
    _talukaController.dispose();
    _districtController.dispose();
    _pincodeController.dispose();

    _farmNameController.dispose();
    _totalAreaController.dispose();
    _cultivatedAreaController.dispose();
    _mainCropsController.dispose();

    _locVillageController.dispose();
    _locTalukaController.dispose();
    _locDistrictController.dispose();
    _locPincodeController.dispose();
    _farmAddressController.dispose();
    super.dispose();
  }

  void _saveFarmerProfile() {
    if (_nameController.text.trim().isEmpty) {
      _showToast('कृपया शेतकऱ्याचे नाव प्रविष्ट करा (Enter farmer name)');
      return;
    }
    final current = FarmerState().profile;
    final updated = current.copyWith(
      fullName: _nameController.text.trim(),
      village: _villageController.text.trim(),
      taluka: _talukaController.text.trim(),
      district: _districtController.text.trim(),
      pincode: _pincodeController.text.trim(),
      preferredLanguage: _selectedLanguage,
    );
    FarmerState().updateProfile(updated);
    setState(() => _isEditingFarmer = false);
    _showToast('शेतकरी प्रोफाईल जतन झाली ✓ (Farmer profile saved)');
  }

  void _saveFarmProfile() {
    if (_farmNameController.text.trim().isEmpty) {
      _showToast('कृपया शेताचे नाव प्रविष्ट करा (Enter farm name)');
      return;
    }
    final totalA = double.tryParse(_totalAreaController.text.trim()) ?? 2.0;
    final cultA = double.tryParse(_cultivatedAreaController.text.trim()) ?? 2.0;

    final current = FarmerState().profile;
    final updated = current.copyWith(
      farmName: _farmNameController.text.trim(),
      totalAcres: totalA,
      totalFarmAreaUnit: _totalAreaUnit,
      cultivatedArea: cultA,
      cultivatedAreaUnit: _cultivatedAreaUnit,
      soilType: _soilType,
      irrigationType: _irrigationType,
      waterSource: _waterSource,
      farmingMethod: _farmingMethod,
      farmingType: _farmingType,
      mainCrops: _mainCropsController.text.trim(),
    );
    FarmerState().updateProfile(updated);
    setState(() => _isEditingFarm = false);
    _showToast('शेतीचा तपशील जतन झाला ✓ (Farm profile saved)');
  }

  void _saveFarmLocation({bool confirm = false}) {
    if (_farmAddressController.text.trim().isEmpty) {
      _showToast('कृपया शेताचा पत्ता प्रविष्ट करा (Enter farm address)');
      return;
    }
    final current = FarmerState().profile;
    final updated = current.copyWith(
      village: _locVillageController.text.trim(),
      taluka: _locTalukaController.text.trim(),
      district: _locDistrictController.text.trim(),
      pincode: _locPincodeController.text.trim(),
      farmAddress: _farmAddressController.text.trim(),
      latitude: _latitude,
      longitude: _longitude,
      locationConfirmed: confirm ? true : _locationConfirmed,
    );
    FarmerState().updateProfile(updated);
    setState(() {
      _isEditingLocation = false;
      if (confirm) _locationConfirmed = true;
    });
    _showToast(confirm
        ? 'शेताचे स्थान निश्चित केले ✓ (Farm location confirmed)'
        : 'शेताचे स्थान जतन झाले ✓ (Farm location saved)');
  }

  void _useCurrentGpsLocation() {
    setState(() {
      // Mock accurate GPS pin for Sangamner farm region
      _latitude = 19.5761 + (DateTime.now().millisecond % 50) * 0.0001;
      _longitude = 74.2070 + (DateTime.now().second % 50) * 0.0001;
      _locationConfirmed = true;
    });
    _showToast('सध्याचे GPS स्थान निश्चित केले 📍 (Current GPS location fetched)');
  }

  void _changeProfilePhoto(BuildContext context, FarmerProfile profile) {
    showAppPhotoPicker(
      context,
      title: 'Farmer Profile Photo (प्रोफाईल फोटो)',
      subtitle: 'लाईव्ह कॅमेऱ्याने फोटो काढा किंवा गॅलरी मधून निवडा',
      onPhotoSelected: (photoStr) {
        final updated = profile.copyWith(profilePhoto: photoStr);
        FarmerState().updateProfile(updated);
        _showToast('प्रोफाईल फोटो अपडेट झाला! (Profile photo updated)');
      },
    );
  }

  void _addFarmPhoto(BuildContext context, FarmerProfile profile) {
    showAppPhotoPicker(
      context,
      title: 'Farm Photo (शेताचा फोटो)',
      subtitle: 'शेताचा फोटो कॅमेऱ्याने काढा किंवा गॅलरी मधून निवडा',
      onPhotoSelected: (photoStr) {
        final updatedList = List<String>.from(profile.farmPhotos)..add(photoStr);
        final updated = profile.copyWith(
          farmPhoto: photoStr,
          farmPhotos: updatedList,
        );
        FarmerState().updateProfile(updated);
        _showToast('शेताचा फोटो जोडला गेला! (Farm photo added)');
      },
    );
  }

  void _showToast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.logout, color: AppColors.error),
            SizedBox(width: 8),
            Text('Sign Out (लॉग आउट)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: const Text(
          'तुम्हाला खात्री आहे का की तुम्हाला ॲपमधून लॉग आउट करायचे आहे?\n(Are you sure you want to sign out?)',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('रद्द करा (Cancel)', style: TextStyle(color: AppColors.muted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text('लॉग आउट करा (Sign Out)'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final profile = FarmerState().profile;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text(
              'Farmer & Farm Profile (प्रोफाईल)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Flow Navigation Bar (Exact same flow like web ProfileFlowNav)
                _buildFlowNav(),
                const SizedBox(height: 16),

                // 2. Active Tab Content
                if (_currentStep == ProfileStep.farmerProfile)
                  _buildFarmerProfileSection(profile),
                if (_currentStep == ProfileStep.farmProfile)
                  _buildFarmProfileSection(profile),
                if (_currentStep == ProfileStep.farmLocation)
                  _buildFarmLocationSection(profile),

                const SizedBox(height: 24),

                // Sign Out Button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text(
                      'Sign Out (लॉग आउट करा)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    onPressed: () => _confirmLogout(context),
                  ),
                ),
                const SizedBox(height: 36),
              ],
            ),
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // FLOW NAVIGATION WIDGET (ProfileFlowNav)
  // -------------------------------------------------------------
  Widget _buildFlowNav() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _navStepItem(
              title: '1. Farmer Profile',
              marathi: 'शेतकरी माहिती',
              step: ProfileStep.farmerProfile,
            ),
          ),
          const Icon(Icons.chevron_right, size: 18, color: Color(0xFF9CA3AF)),
          Expanded(
            child: _navStepItem(
              title: '2. Farm Profile',
              marathi: 'शेतीचा तपशील',
              step: ProfileStep.farmProfile,
            ),
          ),
          const Icon(Icons.chevron_right, size: 18, color: Color(0xFF9CA3AF)),
          Expanded(
            child: _navStepItem(
              title: '3. Farm Location',
              marathi: 'शेताचे स्थान',
              step: ProfileStep.farmLocation,
            ),
          ),
        ],
      ),
    );
  }

  Widget _navStepItem({
    required String title,
    required String marathi,
    required ProfileStep step,
  }) {
    final isActive = _currentStep == step;
    return InkWell(
      onTap: () => setState(() => _currentStep = step),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryLight.withValues(alpha: 0.5) : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          children: [
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                color: isActive ? AppColors.primary : const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 1),
            Text(
              marathi,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                color: isActive ? AppColors.primaryDark : const Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // STEP 1: FARMER PROFILE (शेतकरी प्रोफाईल)
  // -------------------------------------------------------------
  Widget _buildFarmerProfileSection(FarmerProfile profile) {
    final hasAvatar = profile.profilePhoto.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header & Actions
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Farmer Profile',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                  Text(
                    'Personal details from your registered farmer account.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            if (!_isEditingFarmer)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.edit, size: 14),
                label: const Text('Edit Profile', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => setState(() => _isEditingFarmer = true),
              )
            else
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.muted,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => setState(() => _isEditingFarmer = false),
                child: const Text('Cancel', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // Profile Details Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Photo Row
              Row(
                children: [
                  InkWell(
                    onTap: () => _changeProfilePhoto(context, profile),
                    child: Stack(
                      children: [
                        Container(
                          width: 68,
                          height: 68,
                          decoration: const BoxDecoration(
                            color: AppColors.primaryLight,
                            shape: BoxShape.circle,
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: hasAvatar
                              ? AppImageWidget(
                                  imageStr: profile.profilePhoto,
                                  width: 68,
                                  height: 68,
                                  fit: BoxFit.cover,
                                )
                              : Center(
                                  child: Text(
                                    profile.fullName.isNotEmpty
                                        ? profile.fullName.split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase()
                                        : 'F',
                                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                                  ),
                                ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, size: 13, color: Colors.white),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Profile Photo (प्रोफाईल फोटो)',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                        const SizedBox(height: 3),
                        const Text(
                          'Click photo icon to update avatar',
                          style: TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: [
                            _statusChip('KYC: ${profile.kycStatus}', isSuccess: profile.kycStatus == 'APPROVED'),
                            _statusChip('Bank: ${profile.bankVerificationStatus}', isSuccess: profile.bankVerificationStatus == 'VERIFIED'),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Divider(height: 28, color: AppColors.border),

              // Fields
              if (_isEditingFarmer) ...[
                _inputField('Farmer Name (शेतकऱ्याचे नाव) *', _nameController),
                const SizedBox(height: 12),
                _readOnlyField('Farmer ID (शेतकरी ओळख क्रमांक)', profile.id),
                const SizedBox(height: 12),
                _readOnlyField('Mobile Number (मोबाईल क्रमांक)', '+91 ${profile.mobile}'),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Preferred Language (प्राधान्य दिलेली भाषा) *',
                  value: _selectedLanguage,
                  items: FarmerConstants.preferredLanguages,
                  onChanged: (val) {
                    if (val != null) setState(() => _selectedLanguage = val);
                  },
                ),
                const SizedBox(height: 12),
                _inputField('Village (गाव) *', _villageController),
                const SizedBox(height: 12),
                _inputField('Taluka (तालुका) *', _talukaController),
                const SizedBox(height: 12),
                _inputField('District (जिल्हा) *', _districtController),
                const SizedBox(height: 12),
                _inputField('Pincode (पिनकोड) *', _pincodeController, keyboardType: TextInputType.number),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _saveFarmerProfile,
                    child: const Text('Save Profile (जतन करा)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ] else ...[
                _gridInfoTile('Farmer Name', profile.fullName),
                _gridInfoTile('Farmer ID', profile.id),
                _gridInfoTile('Mobile Number', '+91 ${profile.mobile}'),
                _gridInfoTile('Preferred Language', profile.preferredLanguage),
                _gridInfoTile('Village', profile.village),
                _gridInfoTile('Taluka', profile.taluka),
                _gridInfoTile('District', profile.district),
                _gridInfoTile('Pincode', profile.pincode),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryDark,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.arrow_forward, size: 16),
                    label: const Text('Continue to Farm Profile →', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                    onPressed: () => setState(() => _currentStep = ProfileStep.farmProfile),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // STEP 2: FARM PROFILE (शेतीचा तपशील)
  // -------------------------------------------------------------
  Widget _buildFarmProfileSection(FarmerProfile profile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header & Actions
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Farm Profile',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                  Text(
                    'Physical and agronomic characteristics of your farm holdings.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            if (!_isEditingFarm)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.edit, size: 14),
                label: const Text('Edit Details', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => setState(() => _isEditingFarm = true),
              )
            else
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.muted,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => setState(() => _isEditingFarm = false),
                child: const Text('Cancel', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // Farm Details Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_isEditingFarm) ...[
                _inputField('Farm Name (शेताचे नाव) *', _farmNameController),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: _inputField('Total Area (एकूण क्षेत्र) *', _totalAreaController, keyboardType: TextInputType.number),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 1,
                      child: _dropdownField(
                        label: 'Unit',
                        value: _totalAreaUnit,
                        items: const ['Acre', 'Hectare', 'Guntha'],
                        onChanged: (val) {
                          if (val != null) setState(() => _totalAreaUnit = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: _inputField('Cultivated Area (लागवडीखालील) *', _cultivatedAreaController, keyboardType: TextInputType.number),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 1,
                      child: _dropdownField(
                        label: 'Unit',
                        value: _cultivatedAreaUnit,
                        items: const ['Acre', 'Hectare', 'Guntha'],
                        onChanged: (val) {
                          if (val != null) setState(() => _cultivatedAreaUnit = val);
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Soil Type (मातीचा प्रकार) *',
                  value: _soilType,
                  items: FarmerConstants.soilTypes,
                  onChanged: (val) {
                    if (val != null) setState(() => _soilType = val);
                  },
                ),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Irrigation Type (सिंचन प्रकार) *',
                  value: _irrigationType,
                  items: FarmerConstants.irrigationTypes,
                  onChanged: (val) {
                    if (val != null) setState(() => _irrigationType = val);
                  },
                ),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Water Source (पाणी स्त्रोत) *',
                  value: _waterSource,
                  items: FarmerConstants.waterSources,
                  onChanged: (val) {
                    if (val != null) setState(() => _waterSource = val);
                  },
                ),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Farming Method (शेती पद्धत) *',
                  value: _farmingMethod,
                  items: const ['Organic (सेंद्रिय)', 'Conventional (पारंपारिक)', 'Natural (नैसर्गिक)', 'Hydroponic'],
                  onChanged: (val) {
                    if (val != null) setState(() => _farmingMethod = val);
                  },
                ),
                const SizedBox(height: 12),
                _dropdownField(
                  label: 'Farming Type (शेती प्रकार) *',
                  value: _farmingType,
                  items: const ['Individual (स्वतःची)', 'Joint Family (एकत्रित)', 'Leasehold (भाडेतत्त्वावर)', 'Group (गट शेती)'],
                  onChanged: (val) {
                    if (val != null) setState(() => _farmingType = val);
                  },
                ),
                const SizedBox(height: 12),
                _inputField('Main Crops (मुख्य पिके)', _mainCropsController),
                const SizedBox(height: 16),

                // Farm Photo Upload Card
                _farmPhotoUploadWidget(profile),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _saveFarmProfile,
                    child: const Text('Save Farm Profile (शेती माहिती जतन करा)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                ),
              ] else ...[
                _gridInfoTile('Farm Name (शेताचे नाव)', profile.farmName),
                _gridInfoTile('Total Farm Area', '${profile.totalAcres} ${profile.totalFarmAreaUnit}'),
                _gridInfoTile('Cultivated Area', '${profile.cultivatedArea} ${profile.cultivatedAreaUnit}'),
                _gridInfoTile('Soil Type', profile.soilType),
                _gridInfoTile('Irrigation Type', profile.irrigationType),
                _gridInfoTile('Water Source', profile.waterSource),
                _gridInfoTile('Farming Method', profile.farmingMethod),
                _gridInfoTile('Farming Type', profile.farmingType),
                _gridInfoTile('Main Crops', profile.mainCrops),

                const SizedBox(height: 14),
                // Farm Photo Gallery
                _farmPhotoGalleryWidget(profile),
                const SizedBox(height: 16),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryDark,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.arrow_forward, size: 16),
                    label: const Text('Continue to Farm Location →', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                    onPressed: () => setState(() => _currentStep = ProfileStep.farmLocation),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // STEP 3: FARM LOCATION (शेताचे स्थान व नकाशा)
  // -------------------------------------------------------------
  Widget _buildFarmLocationSection(FarmerProfile profile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header & Actions
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Farm Location',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                  Text(
                    'Geographical coordinates and location for pickup & logistics.',
                    style: TextStyle(fontSize: 11, color: AppColors.muted),
                  ),
                ],
              ),
            ),
            if (!_isEditingLocation)
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  elevation: 0,
                ),
                icon: const Icon(Icons.edit_location_alt, size: 14),
                label: const Text('Edit Location', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: () => setState(() => _isEditingLocation = true),
              )
            else
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.muted,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => setState(() => _isEditingLocation = false),
                child: const Text('Cancel', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 14),

        // Farm Location Details Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_isEditingLocation) ...[
                _inputField('Village (गाव) *', _locVillageController),
                const SizedBox(height: 12),
                _inputField('Taluka (तालुका) *', _locTalukaController),
                const SizedBox(height: 12),
                _inputField('District (जिल्हा) *', _locDistrictController),
                const SizedBox(height: 12),
                _inputField('Pincode (पिनकोड) *', _locPincodeController, keyboardType: TextInputType.number),
                const SizedBox(height: 12),
                _inputField('Detailed Farm Address (तपशीलवार शेताचा पत्ता) *', _farmAddressController, maxLines: 2),
                const SizedBox(height: 16),
              ] else ...[
                _gridInfoTile('Village (गाव)', profile.village),
                _gridInfoTile('Taluka (तालुका)', profile.taluka),
                _gridInfoTile('District (जिल्हा)', profile.district),
                _gridInfoTile('Pincode (पिनकोड)', profile.pincode),
                _gridInfoTile('Detailed Farm Address', profile.farmAddress),
                const SizedBox(height: 14),
              ],

              // GPS Map & Coordinates Container
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_pin, color: AppColors.error, size: 20),
                        const SizedBox(width: 6),
                        const Expanded(
                          child: Text(
                            'Farm GPS Coordinates (नकाशा स्थान)',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                        ),
                        const SizedBox(width: 6),
                        _statusChip(
                          _locationConfirmed ? 'Confirmed ✓' : 'Pending',
                          isSuccess: _locationConfirmed,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Map graphic representation card
                    Container(
                      height: 110,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE0F2FE),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFFBAE6FD)),
                      ),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Positioned.fill(
                            child: Opacity(
                              opacity: 0.15,
                              child: GridView.builder(
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 8),
                                itemBuilder: (_, _) => Container(decoration: BoxDecoration(border: Border.all(color: Colors.blue))),
                              ),
                            ),
                          ),
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.pin_drop, size: 36, color: AppColors.primary),
                              const SizedBox(height: 4),
                              Text(
                                'Lat: ${_latitude.toStringAsFixed(4)}°, Lng: ${_longitude.toStringAsFixed(4)}°',
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                              ),
                              Text(
                                '${profile.village}, ${profile.taluka}, Maharashtra',
                                style: const TextStyle(fontSize: 10.5, color: Color(0xFF0369A1)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // GPS Button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.my_location, size: 16),
                        label: const Text('Use Current GPS Location (माझे सध्याचे लोकेशन वापरा)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: _useCurrentGpsLocation,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Action Buttons
              if (_isEditingLocation)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: () => _saveFarmLocation(confirm: false),
                    child: const Text('Save Location (स्थान जतन करा)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  ),
                )
              else
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.check_circle_outline, size: 18),
                    label: const Text('Confirm Farm Location (शेताचे स्थान निश्चित करा ✓)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                    onPressed: () => _saveFarmLocation(confirm: true),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // HELPER UI WIDGETS
  // -------------------------------------------------------------
  Widget _farmPhotoUploadWidget(FarmerProfile profile) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Farm Photos (शेताचे फोटो)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
          const SizedBox(height: 8),
          InkWell(
            onTap: () => _addFarmPhoto(context, profile),
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(8),
                color: Colors.white,
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_a_photo_outlined, color: AppColors.primary, size: 20),
                  SizedBox(width: 8),
                  Text('Add Farm Photo (शेताचा फोटो जोडा)', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _farmPhotoGalleryWidget(FarmerProfile profile) {
    final photos = profile.farmPhotos.isNotEmpty
        ? profile.farmPhotos
        : (profile.farmPhoto.isNotEmpty ? [profile.farmPhoto] : <String>[]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Farm Photos & Gallery', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.muted)),
            TextButton.icon(
              style: TextButton.styleFrom(visualDensity: VisualDensity.compact),
              icon: const Icon(Icons.add_photo_alternate, size: 15, color: AppColors.primary),
              label: const Text('Add Photo', style: TextStyle(fontSize: 11.5, color: AppColors.primary, fontWeight: FontWeight.bold)),
              onPressed: () => _addFarmPhoto(context, profile),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (photos.isEmpty)
          Container(
            padding: const EdgeInsets.all(14),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: const Text('No farm photos uploaded yet.', style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF))),
          )
        else
          SizedBox(
            height: 90,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: photos.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (ctx, i) => ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: AppImageWidget(
                  imageStr: photos[i],
                  width: 110,
                  height: 90,
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _inputField(String label, TextEditingController controller, {int maxLines = 1, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 13, color: AppColors.primaryDark),
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            filled: true,
            fillColor: const Color(0xFFF9FAFB),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
          ),
        ),
      ],
    );
  }

  Widget _readOnlyField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF6B7280))),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F4F6),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151))),
        ),
      ],
    );
  }

  Widget _dropdownField({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final validValue = items.contains(value) ? value : (items.isNotEmpty ? items.first : '');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF4B5563))),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: AppColors.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: validValue,
              style: const TextStyle(fontSize: 13, color: AppColors.primaryDark),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _gridInfoTile(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label, style: const TextStyle(fontSize: 11.5, color: Color(0xFF6B7280), fontWeight: FontWeight.w500)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : '—',
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1F2937)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String label, {required bool isSuccess}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
      decoration: BoxDecoration(
        color: isSuccess ? AppColors.successLight : const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: isSuccess ? const Color(0xFF86EFAC) : const Color(0xFFFDE68A)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isSuccess ? AppColors.success : const Color(0xFF92400E),
        ),
      ),
    );
  }
}
