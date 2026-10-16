import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../../models/farmer_models.dart';
import '../../services/api_service.dart';
import '../../services/app_language.dart';
import '../../services/farmer_state.dart';
import '../../services/location_service.dart';
import '../../services/location_directory.dart';
import '../main_shell.dart';
import 'login_screen.dart';
import '../profile/farm_location_map_view.dart';
import '../profile/farmer_liveness_check_screen.dart';

/// Mandatory multi-step onboarding screen for farmers.
/// Steps:
/// 1. Farmer Registration Form (Completed on RegisterScreen)
/// 2. Bank and Identity Details
/// 3. Documentation KYC Upload
/// 4. Live Video KYC Verification
/// 5. Farm Profile
/// 6. Farm Location (GPS & Map)
/// Entry to the main app is blocked until all 6 steps are completed.
class FarmerOnboardingFlowScreen extends StatefulWidget {
  final int initialStep;

  const FarmerOnboardingFlowScreen({
    super.key,
    this.initialStep = 2,
  });

  @override
  State<FarmerOnboardingFlowScreen> createState() => _FarmerOnboardingFlowScreenState();
}

class _FarmerOnboardingFlowScreenState extends State<FarmerOnboardingFlowScreen> {
  late int _activeStep;
  bool _isLoading = false;
  bool _allCompletedCelebration = false;
  final Map<String, bool> _uploadingDocs = {};

  // Step 2: Bank & Identity Controllers
  final _bankFormKey = GlobalKey<FormState>();
  late TextEditingController _bankHolderController;
  late TextEditingController _bankNameController;
  late TextEditingController _bankAccountNoController;
  late TextEditingController _confirmAccountNoController;
  late TextEditingController _bankIfscController;
  late TextEditingController _bankBranchController;
  String _bankAccountType = 'Savings (बचत खाते)';
  late TextEditingController _aadhaarController;
  late TextEditingController _panCardController;
  late TextEditingController _upiIdController;

  // Step 5: Farm Profile Controllers
  final _farmFormKey = GlobalKey<FormState>();
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

  // Step 6: Farm Location Controllers & State
  final _locationFormKey = GlobalKey<FormState>();
  late TextEditingController _locVillageController;
  late TextEditingController _locTalukaController;
  late TextEditingController _locDistrictController;
  late TextEditingController _locPincodeController;
  late TextEditingController _farmAddressController;
  double _latitude = 0;
  double _longitude = 0;
  bool _isGettingGps = false;
  bool _locationConfirmed = false;

  // Quick Bank suggestions
  final List<String> _popularBanks = [
    'State Bank of India',
    'Bank of Maharashtra',
    'HDFC Bank',
    'Bank of Baroda',
    'ICICI Bank',
    'Punjab National Bank',
    'Canara Bank',
    'Union Bank of India',
  ];

  @override
  void initState() {
    super.initState();
    final p = FarmerState().profile;

    // Step 2 Controllers
    _bankHolderController = TextEditingController(text: p.bankAccountHolder.isNotEmpty ? p.bankAccountHolder : p.fullName);
    _bankNameController = TextEditingController(text: p.bankName);
    _bankAccountNoController = TextEditingController(text: p.bankAccountNumber);
    _confirmAccountNoController = TextEditingController(text: p.bankAccountNumber);
    _bankIfscController = TextEditingController(text: p.bankIfsc);
    _bankBranchController = TextEditingController(text: p.bankBranch);
    _bankAccountType = p.bankAccountType.isNotEmpty ? p.bankAccountType : 'Savings (बचत खाते)';
    _aadhaarController = TextEditingController();
    _panCardController = TextEditingController();
    _upiIdController = TextEditingController(text: p.bankUpiId);

    // Step 5 Controllers
    _farmNameController = TextEditingController(
      text: p.farmName.isNotEmpty ? p.farmName : (p.fullName.isNotEmpty ? '${p.fullName} Krushi Farm' : 'Krushi Farm'),
    );
    _totalAreaController = TextEditingController(text: p.totalAcres > 0 ? p.totalAcres.toStringAsFixed(1) : '3.0');
    _totalAreaUnit = p.totalFarmAreaUnit.isNotEmpty ? p.totalFarmAreaUnit : 'Acre';
    _cultivatedAreaController = TextEditingController(
      text: p.cultivatedArea > 0 ? p.cultivatedArea.toStringAsFixed(1) : (p.totalAcres > 0 ? p.totalAcres.toStringAsFixed(1) : '2.5'),
    );
    _cultivatedAreaUnit = p.cultivatedAreaUnit.isNotEmpty ? p.cultivatedAreaUnit : 'Acre';
    _soilType = p.soilType.isNotEmpty ? p.soilType : 'Black Soil (काळी माती)';
    _irrigationType = p.irrigationType.isNotEmpty ? p.irrigationType : 'Drip (ठिबक)';
    _waterSource = p.waterSource.isNotEmpty ? p.waterSource : 'Borewell (बोअरवेल)';
    _farmingMethod = p.farmingMethod.isNotEmpty ? p.farmingMethod : 'Organic (सेंद्रिय)';
    _farmingType = p.farmingType.isNotEmpty ? p.farmingType : 'Individual (स्वतःची)';
    _mainCropsController = TextEditingController(text: p.mainCrops);

    // Step 6 Controllers
    _locVillageController = TextEditingController(text: p.village);
    _locTalukaController = TextEditingController(text: p.taluka);
    _locDistrictController = TextEditingController(text: p.district);
    _locPincodeController = TextEditingController(text: p.pincode);
    _locPincodeController.addListener(_onPincodeAutoEnrich);
    _farmAddressController = TextEditingController(text: p.farmAddress.isNotEmpty ? p.farmAddress : '${p.village}, Taluka: ${p.taluka}');
    _latitude = p.latitude ?? 0;
    _longitude = p.longitude ?? 0;
    _locationConfirmed = p.locationConfirmed;

    _activeStep = widget.initialStep.clamp(2, 6);
    _loadStoredDetails();
  }

  void _onPincodeAutoEnrich() async {
    final pin = _locPincodeController.text.trim().replaceAll(' ', '');
    if (pin.length == 6) {
      final match = await LocationDirectory.findLocationByPincode(pin);
      if (match != null && mounted) {
        setState(() {
          if (_locDistrictController.text.trim().isEmpty && match['district'] != null) {
            _locDistrictController.text = (AppLanguage().isMarathi ? match['districtMr'] : match['district']) ?? match['district']!;
          }
          if (_locTalukaController.text.trim().isEmpty && match['taluka'] != null) {
            _locTalukaController.text = (AppLanguage().isMarathi ? match['talukaMr'] : match['taluka']) ?? match['taluka']!;
          }
          if (_locVillageController.text.trim().isEmpty && match['village'] != null) {
            _locVillageController.text = match['village']!;
          }
        });
      }
    }
  }

  Future<void> _loadStoredDetails() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Purge old un-scoped global keys that leak across different farmers
      await prefs.remove('farmer_bank_holder');
      await prefs.remove('farmer_bank_name');
      await prefs.remove('farmer_bank_acc_no');
      await prefs.remove('farmer_bank_ifsc');
      await prefs.remove('farmer_bank_branch');
      await prefs.remove('farmer_bank_acc_type');
      await prefs.remove('farmer_aadhaar');
      await prefs.remove('farmer_pan');
      await prefs.remove('farmer_upi_id');

      final p = FarmerState().profile;
      final fid = p.id.trim();
      final prefix = fid.isNotEmpty ? 'farmer_${fid}_' : null;

      final holder = p.bankAccountHolder.isNotEmpty
          ? p.bankAccountHolder
          : (prefix != null ? (prefs.getString('${prefix}bank_holder') ?? '') : '');
      final name = p.bankName.isNotEmpty
          ? p.bankName
          : (prefix != null ? (prefs.getString('${prefix}bank_name') ?? '') : '');
      final accNo = p.bankAccountNumber.isNotEmpty
          ? p.bankAccountNumber
          : (prefix != null ? (prefs.getString('${prefix}bank_acc_no') ?? '') : '');
      final ifsc = p.bankIfsc.isNotEmpty
          ? p.bankIfsc
          : (prefix != null ? (prefs.getString('${prefix}bank_ifsc') ?? '') : '');
      final branch = p.bankBranch.isNotEmpty
          ? p.bankBranch
          : (prefix != null ? (prefs.getString('${prefix}bank_branch') ?? '') : '');
      final accType = p.bankAccountType.isNotEmpty
          ? p.bankAccountType
          : (prefix != null ? (prefs.getString('${prefix}bank_acc_type') ?? 'Savings (बचत खाते)') : 'Savings (बचत खाते)');
      final aadhaar = p.aadhaarNumber.isNotEmpty
          ? p.aadhaarNumber
          : (prefix != null ? (prefs.getString('${prefix}aadhaar') ?? '') : '');
      final pan = p.panNumber.isNotEmpty
          ? p.panNumber
          : (prefix != null ? (prefs.getString('${prefix}pan') ?? '') : '');
      final upi = p.bankUpiId.isNotEmpty
          ? p.bankUpiId
          : (prefix != null ? (prefs.getString('${prefix}upi_id') ?? '') : '');

      final savedVillage = prefix != null ? (prefs.getString('${prefix}village') ?? p.village) : p.village;
      final savedTaluka = prefix != null ? (prefs.getString('${prefix}taluka') ?? p.taluka) : p.taluka;
      final savedDistrict = prefix != null ? (prefs.getString('${prefix}district') ?? p.district) : p.district;
      final savedPincode = prefix != null ? (prefs.getString('${prefix}pincode') ?? p.pincode) : p.pincode;
      final savedFarmAddress = prefix != null ? (prefs.getString('${prefix}farm_address') ?? p.farmAddress) : p.farmAddress;
      final savedLat = prefix != null ? (prefs.getDouble('${prefix}latitude') ?? p.latitude ?? 0.0) : (p.latitude ?? 0.0);
      final savedLng = prefix != null ? (prefs.getDouble('${prefix}longitude') ?? p.longitude ?? 0.0) : (p.longitude ?? 0.0);

      if (mounted) {
        setState(() {
          _bankHolderController.text = holder.isNotEmpty ? holder : p.fullName;
          _bankNameController.text = name;
          if (accNo.isNotEmpty) {
            _bankAccountNoController.text = accNo;
            _confirmAccountNoController.text = accNo;
          }
          _bankIfscController.text = ifsc;
          _bankBranchController.text = branch;
          _bankAccountType = accType;
          _aadhaarController.text = aadhaar;
          _panCardController.text = pan;
          _upiIdController.text = upi;

          if (savedVillage.isNotEmpty) _locVillageController.text = savedVillage;
          if (savedTaluka.isNotEmpty) _locTalukaController.text = savedTaluka;
          if (savedDistrict.isNotEmpty) _locDistrictController.text = savedDistrict;
          if (savedPincode.isNotEmpty) _locPincodeController.text = savedPincode;
          if (savedFarmAddress.isNotEmpty) _farmAddressController.text = savedFarmAddress;
          if (savedLat != 0.0 && savedLng != 0.0) {
            _latitude = savedLat;
            _longitude = savedLng;
            _locationConfirmed = true;
          }
        });

        int pending = widget.initialStep;
        if (pending == 2) {
          final calculated = await FarmerState().checkOnboardingStep();
          if (calculated >= 2 && calculated <= 6) {
            pending = calculated;
          } else {
            final savedStep = prefs.getInt('farmer_onboarding_step_$fid');
            if (savedStep != null && savedStep >= 2 && savedStep <= 6) {
              pending = savedStep;
            }
          }
        }
        if (mounted && pending >= 2 && pending <= 6) {
          setState(() {
            _activeStep = pending;
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _bankHolderController.dispose();
    _bankNameController.dispose();
    _bankAccountNoController.dispose();
    _confirmAccountNoController.dispose();
    _bankIfscController.dispose();
    _bankBranchController.dispose();
    _aadhaarController.dispose();
    _panCardController.dispose();
    _upiIdController.dispose();

    _farmNameController.dispose();
    _totalAreaController.dispose();
    _cultivatedAreaController.dispose();
    _mainCropsController.dispose();

    _locPincodeController.removeListener(_onPincodeAutoEnrich);
    _locVillageController.dispose();
    _locTalukaController.dispose();
    _locDistrictController.dispose();
    _locPincodeController.dispose();
    _farmAddressController.dispose();
    super.dispose();
  }

  // Helper step checks
  bool get _isStep2Done =>
      _bankHolderController.text.trim().isNotEmpty &&
      _bankNameController.text.trim().isNotEmpty &&
      _bankAccountNoController.text.trim().isNotEmpty &&
      _bankIfscController.text.trim().isNotEmpty &&
      _aadhaarController.text.trim().isNotEmpty;

  bool get _isStep3Done {
    final docs = FarmerState().documents;
    final has712 = docs.any((d) => (d.type == 'land_712' || d.id == 'DOC-3') && (d.isUploaded || d.fileUrl.isNotEmpty));
    final hasAadhaar = docs.any((d) => (d.type == 'aadhaar' || d.id == 'DOC-1') && (d.isUploaded || d.fileUrl.isNotEmpty));
    final hasBank = docs.any((d) => (d.type == 'bank' || d.id == 'DOC-5') && (d.isUploaded || d.fileUrl.isNotEmpty));
    return has712 && hasAadhaar && hasBank;
  }

  bool get _isStep4Done =>
      FarmerState().documents.any((d) => (d.type == 'video_kyc' || d.id == 'DOC-9') && (d.isUploaded || d.fileUrl.isNotEmpty));

  bool get _isStep5Done {
    final p = FarmerState().profile;
    return (p.farmName.trim().isNotEmpty || _farmNameController.text.trim().isNotEmpty) &&
        (p.totalAcres > 0 || (double.tryParse(_totalAreaController.text.trim()) ?? 0) > 0);
  }

  bool get _isStep6Done {
    return _locationConfirmed && _latitude != 0 && _longitude != 0;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: SAVE BANK & IDENTITY
  // ---------------------------------------------------------------------------
  Future<void> _submitStep2BankAndIdentity() async {
    if (!_bankFormKey.currentState!.validate()) {
      return;
    }
    if (_bankAccountNoController.text.trim() != _confirmAccountNoController.text.trim()) {
      _showToast(AppLanguage().tr(mr: 'बँक खाते क्रमांक जुळत नाही', en: 'Account numbers do not match'), isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final fid = FarmerState().profile.id.trim();
      if (fid.isNotEmpty) {
        final prefs = await SharedPreferences.getInstance();
        final prefix = 'farmer_${fid}_';
        await prefs.setString('${prefix}bank_holder', _bankHolderController.text.trim());
        await prefs.setString('${prefix}bank_name', _bankNameController.text.trim());
        await prefs.setString('${prefix}bank_acc_no', _bankAccountNoController.text.trim());
        await prefs.setString('${prefix}bank_ifsc', _bankIfscController.text.trim().toUpperCase());
        await prefs.setString('${prefix}bank_branch', _bankBranchController.text.trim());
        await prefs.setString('${prefix}bank_acc_type', _bankAccountType);
        await prefs.setString('${prefix}aadhaar', _aadhaarController.text.trim());
        await prefs.setString('${prefix}pan', _panCardController.text.trim().toUpperCase());
        await prefs.setString('${prefix}upi_id', _upiIdController.text.trim());
        await prefs.setInt('farmer_onboarding_step_$fid', 3);
      }

      final current = FarmerState().profile;
      final updated = current.copyWith(
        bankAccountHolder: _bankHolderController.text.trim(),
        bankName: _bankNameController.text.trim(),
        bankAccountNumber: _bankAccountNoController.text.trim(),
        bankIfsc: _bankIfscController.text.trim().toUpperCase(),
        bankBranch: _bankBranchController.text.trim(),
        bankAccountType: _bankAccountType,
        bankUpiId: _upiIdController.text.trim(),
        aadhaarNumber: _aadhaarController.text.trim(),
        panNumber: _panCardController.text.trim().toUpperCase(),
      );
      FarmerState().updateProfile(updated);

      _showToast(AppLanguage().tr(mr: 'बँक व ओळख तपशील जतन झाले! ✓', en: 'Bank & Identity details saved! ✓'));
      setState(() {
        _activeStep = 3; // Advance to Step 3 (Documentation KYC)
      });
    } catch (e) {
      _showToast('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 3: SUBMIT DOCUMENTS KYC
  // ---------------------------------------------------------------------------
  Future<void> _submitStep3Documents() async {
    final docs = FarmerState().documents;
    final hasFarmerId = docs.any((d) => (d.type == 'farmer_id' || d.id == 'DOC-2') && (d.isUploaded || d.fileUrl.isNotEmpty));
    final has712 = docs.any((d) => (d.type == 'land_712' || d.id == 'DOC-3') && (d.isUploaded || d.fileUrl.isNotEmpty));
    final hasAadhaar = docs.any((d) => (d.type == 'aadhaar' || d.id == 'DOC-1') && (d.isUploaded || d.fileUrl.isNotEmpty));
    final hasBank = docs.any((d) => (d.type == 'bank' || d.id == 'DOC-5') && (d.isUploaded || d.fileUrl.isNotEmpty));

    if (!hasFarmerId || !has712 || !hasAadhaar || !hasBank) {
      _showToast(
        AppLanguage().tr(
          mr: 'कृपया सर्व आवश्यक कागदपत्रे (शेतकरी ओळखपत्र, ७/१२ उतारा, आधार कार्ड, बँक पासबुक) अपलोड करा.',
          en: 'Please upload all mandatory documents (Farmer ID Card, 7/12 Extract, Aadhaar Card, Bank Passbook).',
        ),
        isError: true,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final fid = FarmerState().profile.id.trim();
      final prefs = await SharedPreferences.getInstance();

      // Persist documents in shared preferences (both global and farmer-scoped)
      final listJson = docs.map((d) => d.toJson()).toList();
      final jsonStr = jsonEncode(listJson);
      await prefs.setString('farmer_documents_data', jsonStr);

      if (fid.isNotEmpty) {
        await prefs.setString('farmer_${fid}_documents_data', jsonStr);
        await prefs.setInt('farmer_onboarding_step_$fid', 4);
        await prefs.setBool('farmer_step3_completed_$fid', true);

        // Sync KYC status to backend
        try {
          await ApiService().updateFarmerProfile(fid, {
            'kycStatus': 'SUBMITTED',
          });
        } catch (_) {}
      }

      _showToast(AppLanguage().tr(
        mr: 'सर्व कागदपत्रे व माहिती सुरक्षितपणे जतन झाली! ✓',
        en: 'All documents & information saved successfully! ✓',
      ));
      if (mounted) {
        setState(() {
          _activeStep = 4; // Advance to Step 4 (Live Video KYC)
        });
      }
    } catch (e) {
      _showToast('Error saving documents: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 4: START LIVE VIDEO KYC
  // ---------------------------------------------------------------------------
  void _startLiveVideoKyc() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => FarmerLivenessCheckScreen(
          farmerName: FarmerState().profile.fullName,
          onCompleted: (String? videoUrl) async {
            if (videoUrl == null || videoUrl.isEmpty) return;
            try {
              await FarmerState().uploadDocument('DOC-9', fileUrl: videoUrl, status: 'pending');
              final fid = FarmerState().profile.id.trim();
              final prefs = await SharedPreferences.getInstance();
              if (fid.isNotEmpty) {
                await prefs.setInt('farmer_onboarding_step_$fid', 5);
              }
              if (!mounted) return;
              _showToast(
                AppLanguage().tr(
                  mr: 'थेट व्हिडिओ पडताळणी यशस्वी! ✓ पुढील टप्पा उघडला.',
                  en: 'Live video KYC verified! ✓ Next step unlocked.',
                ),
              );
              setState(() {
                _activeStep = 5; // Auto advance to Step 5 (Farm Profile)
              });
            } catch (e) {
              _showToast('Video upload failed: $e', isError: true);
            }
          },
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 5: SAVE FARM PROFILE
  // ---------------------------------------------------------------------------
  Future<void> _submitStep5FarmProfile() async {
    if (!_farmFormKey.currentState!.validate()) {
      return;
    }
    final totalA = double.tryParse(_totalAreaController.text.trim()) ?? 2.0;
    final cultA = double.tryParse(_cultivatedAreaController.text.trim()) ?? totalA;

    if (totalA <= 0) {
      _showToast(AppLanguage().tr(mr: 'एकूण क्षेत्र ० पेक्षा जास्त असावे', en: 'Total area must be greater than 0'), isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
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

      final fid = current.id.trim();
      final prefs = await SharedPreferences.getInstance();
      if (fid.isNotEmpty) {
        await prefs.setInt('farmer_onboarding_step_$fid', 6);
      }

      _showToast(AppLanguage().tr(mr: 'शेती तपशील जतन झाला! ✓', en: 'Farm profile saved! ✓'));
      setState(() {
        _activeStep = 6; // Advance to Step 6 (Farm Location)
      });
    } catch (e) {
      _showToast('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 6: FARM LOCATION (GPS & MAP)
  // ---------------------------------------------------------------------------
  Future<void> _detectGpsLocation() async {
    setState(() => _isGettingGps = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showToast(AppLanguage().tr(mr: 'GPS लोकेशन परवानगी नाकारली', en: 'Location permission denied'), isError: true);
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        _showToast(AppLanguage().tr(mr: 'कृपया सेटिंग्जमधून GPS परवानगी द्या', en: 'Enable location in app settings'), isError: true);
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 12),
        ),
      );

      // Reverse geocode via GPS to resolve village, taluka, district, and pincode
      final geo = await FarmLocationService.reverseGeocode(pos.latitude, pos.longitude);

      String village = geo?.village.trim() ?? '';
      String taluka = geo?.taluka.trim() ?? '';
      String district = geo?.district.trim() ?? '';
      String pincode = geo?.pincode.trim() ?? '';
      String address = geo?.formattedAddress.trim() ?? '';

      // Enrich with India Post directory if pincode is present and taluka or district is missing
      if (pincode.length == 6 && (taluka.isEmpty || district.isEmpty)) {
        final dir = await LocationDirectory.findLocationByPincode(pincode);
        if (dir != null) {
          if (taluka.isEmpty) {
            taluka = (AppLanguage().isMarathi ? dir['talukaMr'] : dir['taluka']) ?? dir['taluka'] ?? '';
          }
          if (district.isEmpty) {
            district = (AppLanguage().isMarathi ? dir['districtMr'] : dir['district']) ?? dir['district'] ?? '';
          }
        }
      }

      if (address.isEmpty) {
        final parts = [village, taluka, district, pincode].where((s) => s.isNotEmpty).toList();
        if (parts.isNotEmpty) address = parts.join(', ');
      }

      if (mounted) {
        setState(() {
          _latitude = pos.latitude;
          _longitude = pos.longitude;
          _locationConfirmed = true;
          if (village.isNotEmpty) _locVillageController.text = village;
          if (taluka.isNotEmpty) _locTalukaController.text = taluka;
          if (district.isNotEmpty) _locDistrictController.text = district;
          if (pincode.isNotEmpty) _locPincodeController.text = pincode;
          if (address.isNotEmpty) _farmAddressController.text = address;
        });

        // Persist to local storage
        try {
          final p = FarmerState().profile;
          final fid = p.id.trim();
          final prefix = fid.isNotEmpty ? 'farmer_${fid}_' : 'farmer_';
          final prefs = await SharedPreferences.getInstance();
          await prefs.setDouble('${prefix}latitude', pos.latitude);
          await prefs.setDouble('${prefix}longitude', pos.longitude);
          if (village.isNotEmpty) await prefs.setString('${prefix}village', village);
          if (taluka.isNotEmpty) await prefs.setString('${prefix}taluka', taluka);
          if (district.isNotEmpty) await prefs.setString('${prefix}district', district);
          if (pincode.isNotEmpty) await prefs.setString('${prefix}pincode', pincode);
          if (address.isNotEmpty) await prefs.setString('${prefix}farm_address', address);
        } catch (_) {}

        final summary = [village, taluka, district].where((s) => s.isNotEmpty).join(', ');
        _showToast(
          summary.isNotEmpty
              ? AppLanguage().tr(mr: 'GPS स्थान मिळाले: $summary ✓', en: 'Farm GPS location fetched: $summary ✓')
              : AppLanguage().tr(mr: 'GPS शेताचे स्थान यशस्वीरित्या मिळाले! ✓', en: 'Farm GPS location fetched! ✓'),
        );
      }
    } catch (e) {
      _showToast(AppLanguage().tr(mr: 'GPS स्थान मिळवण्यात अडचण: $e', en: 'Could not fetch GPS: $e'), isError: true);
    } finally {
      if (mounted) setState(() => _isGettingGps = false);
    }
  }

  Future<void> _openMapPicker() async {
    final result = await FarmLocationMapPickerSheet.show(
      context,
      initialLat: _latitude,
      initialLng: _longitude,
      currentVillage: _locVillageController.text.trim(),
      currentTaluka: _locTalukaController.text.trim(),
      currentDistrict: _locDistrictController.text.trim(),
      currentPincode: _locPincodeController.text.trim(),
      currentAddress: _farmAddressController.text.trim(),
      startWithCurrentLocation: _latitude == 0 && _longitude == 0,
    );

    if (result != null && mounted) {
      String village = result.village.trim();
      String taluka = result.taluka.trim();
      String district = result.district.trim();
      String pincode = result.pincode.trim();
      String address = result.formattedAddress.trim();

      // If map result didn't have all details, attempt reverse geocode
      if (village.isEmpty || taluka.isEmpty || district.isEmpty || pincode.isEmpty) {
        final enriched = await FarmLocationService.reverseGeocode(result.latitude, result.longitude);
        if (enriched != null) {
          if (village.isEmpty) village = enriched.village.trim();
          if (taluka.isEmpty) taluka = enriched.taluka.trim();
          if (district.isEmpty) district = enriched.district.trim();
          if (pincode.isEmpty) pincode = enriched.pincode.trim();
          if (address.isEmpty) address = enriched.formattedAddress.trim();
        }
      }

      // Enrich via local directory by pincode if taluka or district is missing
      if (pincode.length == 6 && (taluka.isEmpty || district.isEmpty)) {
        final dir = await LocationDirectory.findLocationByPincode(pincode);
        if (dir != null) {
          if (taluka.isEmpty) {
            taluka = (AppLanguage().isMarathi ? dir['talukaMr'] : dir['taluka']) ?? dir['taluka'] ?? '';
          }
          if (district.isEmpty) {
            district = (AppLanguage().isMarathi ? dir['districtMr'] : dir['district']) ?? dir['district'] ?? '';
          }
        }
      }

      if (address.isEmpty) {
        final parts = [village, taluka, district, pincode].where((s) => s.isNotEmpty).toList();
        if (parts.isNotEmpty) address = parts.join(', ');
      }

      setState(() {
        _latitude = result.latitude;
        _longitude = result.longitude;
        _locationConfirmed = true;
        if (village.isNotEmpty) _locVillageController.text = village;
        if (taluka.isNotEmpty) _locTalukaController.text = taluka;
        if (district.isNotEmpty) _locDistrictController.text = district;
        if (pincode.isNotEmpty) _locPincodeController.text = pincode;
        if (address.isNotEmpty) _farmAddressController.text = address;
      });

      // Persist to local storage
      try {
        final p = FarmerState().profile;
        final fid = p.id.trim();
        final prefix = fid.isNotEmpty ? 'farmer_${fid}_' : 'farmer_';
        final prefs = await SharedPreferences.getInstance();
        await prefs.setDouble('${prefix}latitude', result.latitude);
        await prefs.setDouble('${prefix}longitude', result.longitude);
        if (village.isNotEmpty) await prefs.setString('${prefix}village', village);
        if (taluka.isNotEmpty) await prefs.setString('${prefix}taluka', taluka);
        if (district.isNotEmpty) await prefs.setString('${prefix}district', district);
        if (pincode.isNotEmpty) await prefs.setString('${prefix}pincode', pincode);
        if (address.isNotEmpty) await prefs.setString('${prefix}farm_address', address);
      } catch (_) {}

      final summary = [village, taluka, district].where((s) => s.isNotEmpty).join(', ');
      _showToast(
        summary.isNotEmpty
            ? AppLanguage().tr(mr: 'नकाशावरून शेताचे स्थान निवडले: $summary ✓', en: 'Farm location picked: $summary ✓')
            : AppLanguage().tr(mr: 'नकाशावरून शेताचे स्थान निवडले! ✓', en: 'Farm location picked from map! ✓'),
      );
    }
  }

  Future<void> _openVillagePickerForForm() async {
    final result = await FarmVillagePickerModal.show(
      context,
      taluka: _locTalukaController.text.trim(),
      district: _locDistrictController.text.trim(),
      currentVillage: _locVillageController.text.trim(),
    );
    if (result != null && mounted) {
      setState(() {
        _locVillageController.text = result.name;
        if (result.pincode.isNotEmpty) {
          _locPincodeController.text = result.pincode;
        }
      });
      _persistFarmLocationLocally();
      _showToast(AppLanguage().tr(mr: 'गाव निश्चित केले: ${result.name} (${result.pincode}) ✓', en: 'Village selected: ${result.name} (${result.pincode}) ✓'));
    }
  }

  Future<void> _persistFarmLocationLocally() async {
    try {
      final p = FarmerState().profile;
      final fid = p.id.trim();
      final prefix = fid.isNotEmpty ? 'farmer_${fid}_' : 'farmer_';
      final prefs = await SharedPreferences.getInstance();
      if (_latitude != 0 && _longitude != 0) {
        await prefs.setDouble('${prefix}latitude', _latitude);
        await prefs.setDouble('${prefix}longitude', _longitude);
      }
      final v = _locVillageController.text.trim();
      final t = _locTalukaController.text.trim();
      final d = _locDistrictController.text.trim();
      final pin = _locPincodeController.text.trim();
      final addr = _farmAddressController.text.trim();
      if (v.isNotEmpty) await prefs.setString('${prefix}village', v);
      if (t.isNotEmpty) await prefs.setString('${prefix}taluka', t);
      if (d.isNotEmpty) await prefs.setString('${prefix}district', d);
      if (pin.isNotEmpty) await prefs.setString('${prefix}pincode', pin);
      if (addr.isNotEmpty) await prefs.setString('${prefix}farm_address', addr);
    } catch (_) {}
  }

  Future<void> _submitStep6LocationAndFinish() async {
    if (_latitude == 0 && _longitude == 0) {
      _showToast(AppLanguage().tr(mr: 'कृपया प्रथम GPS किंवा नकाशावरून शेताचे स्थान निवडा', en: 'Please pick farm location on map or via GPS'), isError: true);
      return;
    }
    if (_locVillageController.text.trim().isEmpty) {
      _showToast(AppLanguage().tr(mr: 'कृपया शेताचे गाव निवडा', en: 'Please select farm village'), isError: true);
      _openVillagePickerForForm();
      return;
    }
    if (_farmAddressController.text.trim().isEmpty) {
      _showToast(AppLanguage().tr(mr: 'कृपया शेताचा पत्ता किंवा खूण प्रविष्ट करा', en: 'Please enter farm address / landmark'), isError: true);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final current = FarmerState().profile;
      final village = _locVillageController.text.trim();
      final taluka = _locTalukaController.text.trim();
      final district = _locDistrictController.text.trim();
      final pincode = _locPincodeController.text.trim();
      final farmAddress = _farmAddressController.text.trim();

      // Persist to local SharedPreferences
      final fid = current.id.trim();
      final prefix = fid.isNotEmpty ? 'farmer_${fid}_' : 'farmer_';
      final prefs = await SharedPreferences.getInstance();
      await prefs.setDouble('${prefix}latitude', _latitude);
      await prefs.setDouble('${prefix}longitude', _longitude);
      await prefs.setString('${prefix}village', village);
      await prefs.setString('${prefix}taluka', taluka);
      await prefs.setString('${prefix}district', district);
      await prefs.setString('${prefix}pincode', pincode);
      await prefs.setString('${prefix}farm_address', farmAddress);

      final updated = current.copyWith(
        village: village,
        taluka: taluka,
        district: district,
        pincode: pincode,
        farmAddress: farmAddress,
        latitude: _latitude,
        longitude: _longitude,
        locationConfirmed: true,
      );
      FarmerState().updateProfile(updated);

      // Persist onboarding completion flag
      await FarmerState().completeOnboarding();

      if (mounted) {
        setState(() {
          _allCompletedCelebration = true;
        });
      }
    } catch (e) {
      _showToast('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _finishAndEnterApp() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const MainShell()),
      (route) => false,
    );
  }

  void _showToast(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: isError ? AppColors.error : AppColors.primary,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLanguage().tr(mr: 'बाहेर पडायचे आहे का?', en: 'Exit Onboarding?')),
        content: Text(
          AppLanguage().tr(
            mr: 'तुमची माहिती जतन झाली आहे. पुन्हा लॉगिन करून तुम्ही पुढील टप्पे पूर्ण करू शकता.',
            en: 'Your progress is saved. You can log in later to complete the remaining steps.',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppLanguage().tr(mr: 'रद्द करा', en: 'Cancel')),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(ctx);
              FarmerState().logout();
              Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: Text(AppLanguage().tr(mr: 'लॉगआउट', en: 'Logout'), style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_allCompletedCelebration) {
      return _buildCelebrationScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: _activeStep > 2
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded, color: AppColors.primaryDark),
                tooltip: AppLanguage().tr(mr: 'मागील टप्पा', en: 'Previous Step'),
                onPressed: () {
                  setState(() => _activeStep--);
                },
              )
            : Container(
                margin: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.agriculture_rounded, color: AppColors.primary, size: 22),
              ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLanguage().tr(mr: 'शेतकरी पडताळणी व नोंदणी', en: 'Farmer Onboarding & KYC'),
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
            ),
            Text(
              AppLanguage().tr(mr: 'टप्पा $_activeStep/६ • सर्व टप्पे आवश्यक आहेत', en: 'Step $_activeStep of 6 • All steps required'),
              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_rounded, color: Color(0xFF64748B), size: 20),
            tooltip: AppLanguage().tr(mr: 'लॉगआउट', en: 'Logout'),
            onPressed: _confirmLogout,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildStepperHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: _buildCurrentStepContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // STEPPER HEADER
  // ---------------------------------------------------------------------------
  Widget _buildStepperHeader() {
    final steps = [
      ('१', AppLanguage().tr(mr: 'नोंदणी', en: 'Register'), true),
      ('२', AppLanguage().tr(mr: 'बँक व ओळख', en: 'Bank & ID'), _isStep2Done),
      ('३', AppLanguage().tr(mr: 'कागदपत्रे', en: 'Documents'), _isStep3Done),
      ('४', AppLanguage().tr(mr: 'थेट व्हिडिओ', en: 'Video KYC'), _isStep4Done),
      ('५', AppLanguage().tr(mr: 'शेती तपशील', en: 'Farm Profile'), _isStep5Done),
      ('६', AppLanguage().tr(mr: 'शेताचे स्थान', en: 'Farm Location'), _isStep6Done),
    ];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
      child: Column(
        children: [
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: List.generate(steps.length, (idx) {
                final stepNum = idx + 1;
                final (badge, label, isDone) = steps[idx];
                final isActive = _activeStep == stepNum;

                return InkWell(
                  onTap: () {
                    if (stepNum == 1) {
                      _showToast(AppLanguage().tr(mr: 'नोंदणी आधीच पूर्ण झाली आहे', en: 'Registration already completed'));
                      return;
                    }
                    if (stepNum < _activeStep) {
                      // Going back to review/edit previous steps is ALWAYS allowed!
                      setState(() => _activeStep = stepNum);
                      return;
                    }
                    if (stepNum == _activeStep) return;

                    // Going forward is strictly blocked if current step is incomplete
                    if (_activeStep == 2 && !_isStep2Done) {
                      _showToast(AppLanguage().tr(mr: 'कृपया आधी बँक व ओळख तपशील भरा व जतन करा', en: 'Please save Bank & Identity details first'), isError: true);
                      return;
                    }
                    if (_activeStep == 3 && !_isStep3Done) {
                      _showToast(AppLanguage().tr(mr: 'कृपया आधी आवश्यक कागदपत्रे अपलोड करा', en: 'Please upload mandatory documents first'), isError: true);
                      return;
                    }
                    if (_activeStep == 4 && !_isStep4Done) {
                      _showToast(AppLanguage().tr(mr: 'कृपया आधी थेट व्हिडिओ पडताळणी पूर्ण करा', en: 'Please complete Live Video KYC first'), isError: true);
                      return;
                    }
                    if (_activeStep == 5 && !_isStep5Done) {
                      _showToast(AppLanguage().tr(mr: 'कृपया आधी शेती तपशील भरा व जतन करा', en: 'Please save Farm Profile first'), isError: true);
                      return;
                    }

                    // Progress sequentially without skipping
                    if (stepNum == _activeStep + 1) {
                      setState(() => _activeStep = stepNum);
                    } else {
                      _showToast(AppLanguage().tr(mr: 'कोणताही टप्पा वगळता (skip) येणार नाही. टप्प्यानुसार पुढे जा.', en: 'Skipping steps is not allowed. Follow sequential steps.'), isError: true);
                    }
                  },
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isActive
                          ? AppColors.primary
                          : (isDone ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9)),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isActive
                            ? AppColors.primary
                            : (isDone ? const Color(0xFF86EFAC) : const Color(0xFFCBD5E1)),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircleAvatar(
                          radius: 10,
                          backgroundColor: isActive
                              ? Colors.white
                              : (isDone ? const Color(0xFF16A34A) : const Color(0xFF94A3B8)),
                          child: isDone
                              ? const Icon(Icons.check, size: 12, color: Colors.white)
                              : Text(
                                  badge,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isActive ? AppColors.primary : Colors.white,
                                  ),
                                ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w600,
                            color: isActive
                                ? Colors.white
                                : (isDone ? const Color(0xFF166534) : const Color(0xFF475569)),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 8),
          // Progress bar
          LinearProgressIndicator(
            value: (_activeStep - 1) / 5.0,
            backgroundColor: const Color(0xFFE2E8F0),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: 4,
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_activeStep) {
      case 2:
        return _buildStep2BankAndIdentity();
      case 3:
        return _buildStep3Documents();
      case 4:
        return _buildStep4LiveVideo();
      case 5:
        return _buildStep5FarmProfile();
      case 6:
        return _buildStep6FarmLocation();
      default:
        return _buildStep2BankAndIdentity();
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 2 VIEW: BANK & IDENTITY
  // ---------------------------------------------------------------------------
  Widget _buildStep2BankAndIdentity() {
    return Form(
      key: _bankFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepHeader(
            icon: Icons.account_balance_rounded,
            title: AppLanguage().tr(mr: '२. बँक व ओळख तपशील', en: '2. Bank & Identity Details'),
            subtitle: AppLanguage().tr(
              mr: 'तुमच्या शेतमालाचे पैसे थेट खात्यात मिळण्यासाठी अचूक बँक आणि आधार तपशील भरा.',
              en: 'Fill accurate bank and Aadhaar details to receive crop payments directly into your account.',
            ),
          ),
          const SizedBox(height: 14),

          // Quick Bank Selection Chips
          Text(
            AppLanguage().tr(mr: 'प्रमुख बँका (निवडण्यासाठी टॅप करा):', en: 'Popular Banks:'),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
          ),
          const SizedBox(height: 6),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _popularBanks.map((b) {
                final isSelected = _bankNameController.text == b;
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(b, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppColors.primaryDark)),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    backgroundColor: Colors.white,
                    side: BorderSide(color: isSelected ? AppColors.primary : const Color(0xFFCBD5E1)),
                    onSelected: (val) {
                      setState(() {
                        _bankNameController.text = b;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 14),

          _buildTextField(
            controller: _bankHolderController,
            label: AppLanguage().tr(mr: 'खातेदाराचे पूर्ण नाव (बँक पासबुकनुसार)', en: 'Account Holder Name (as per passbook)'),
            icon: Icons.person_outline,
            validator: (v) => (v == null || v.trim().isEmpty) ? AppLanguage().tr(mr: 'खातेदाराचे नाव आवश्यक आहे', en: 'Name is required') : null,
          ),
          const SizedBox(height: 12),

          _buildTextField(
            controller: _bankNameController,
            label: AppLanguage().tr(mr: 'बँकेचे नाव', en: 'Bank Name'),
            icon: Icons.account_balance_outlined,
            validator: (v) => (v == null || v.trim().isEmpty) ? AppLanguage().tr(mr: 'बँकेचे नाव आवश्यक आहे', en: 'Bank name is required') : null,
          ),
          const SizedBox(height: 12),

          _buildTextField(
            controller: _bankAccountNoController,
            label: AppLanguage().tr(mr: 'बँक खाते क्रमांक', en: 'Bank Account Number'),
            icon: Icons.numbers_rounded,
            keyboardType: TextInputType.number,
            validator: (v) => (v == null || v.trim().length < 8) ? AppLanguage().tr(mr: 'वैध खाते क्रमांक टाका', en: 'Valid account number required') : null,
          ),
          const SizedBox(height: 12),

          _buildTextField(
            controller: _confirmAccountNoController,
            label: AppLanguage().tr(mr: 'खाते क्रमांक पुन्हा प्रविष्ट करा', en: 'Confirm Account Number'),
            icon: Icons.lock_outline_rounded,
            keyboardType: TextInputType.number,
            validator: (v) {
              if (v == null || v.trim().isEmpty) return AppLanguage().tr(mr: 'खाते क्रमांक पुन्हा टाका', en: 'Confirm account number');
              if (v.trim() != _bankAccountNoController.text.trim()) return AppLanguage().tr(mr: 'खाते क्रमांक जुळत नाही', en: 'Account numbers do not match');
              return null;
            },
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                flex: 3,
                child: _buildTextField(
                  controller: _bankIfscController,
                  label: AppLanguage().tr(mr: 'IFSC कोड (११ अंकी)', en: 'IFSC Code (11 chars)'),
                  icon: Icons.domain_rounded,
                  textCapitalization: TextCapitalization.characters,
                  validator: (v) {
                    if (v == null || v.trim().length != 11) return AppLanguage().tr(mr: '११ अंकी IFSC कोड टाका', en: 'Enter 11-char IFSC');
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: _buildTextField(
                  controller: _bankBranchController,
                  label: AppLanguage().tr(mr: 'शाखा', en: 'Branch'),
                  icon: Icons.location_city_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          _buildDropdown(
            label: AppLanguage().tr(mr: 'खाते प्रकार', en: 'Account Type'),
            value: _bankAccountType,
            items: ['Savings (बचत खाते)', 'Current (चालू खाते)'],
            onChanged: (val) {
              if (val != null) setState(() => _bankAccountType = val);
            },
          ),
          const SizedBox(height: 14),

          const Divider(),
          const SizedBox(height: 10),

          Text(
            AppLanguage().tr(mr: 'ओळख पडताळणी क्रमांक', en: 'Identity Verification Numbers'),
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
          ),
          const SizedBox(height: 10),

          _buildTextField(
            controller: _aadhaarController,
            label: AppLanguage().tr(mr: 'आधार क्रमांक (१२ अंकी) *', en: 'Aadhaar Card Number (12 digits) *'),
            icon: Icons.badge_outlined,
            keyboardType: TextInputType.number,
            maxLength: 12,
            validator: (v) {
              final clean = (v ?? '').replaceAll(RegExp(r'\D'), '');
              if (clean.length != 12) return AppLanguage().tr(mr: '१२ अंकी वैध आधार नंबर आवश्यक आहे', en: '12-digit Aadhaar required');
              return null;
            },
          ),
          const SizedBox(height: 6),

          _buildTextField(
            controller: _panCardController,
            label: AppLanguage().tr(mr: 'पॅन कार्ड क्रमांक (१० अंकी - ऐच्छिक)', en: 'PAN Card Number (10 chars - Optional)'),
            icon: Icons.credit_card_rounded,
            textCapitalization: TextCapitalization.characters,
            maxLength: 10,
          ),
          const SizedBox(height: 6),

          _buildTextField(
            controller: _upiIdController,
            label: AppLanguage().tr(mr: 'UPI आयडी (उदा. 9876543210@upi - ऐच्छिक)', en: 'UPI ID (Optional)'),
            icon: Icons.qr_code_rounded,
          ),
          const SizedBox(height: 20),

          _primaryButton(
            label: AppLanguage().tr(mr: 'जतन करा व कागदपत्रे टप्प्याकडे जा →', en: 'Save & Continue to Documents →'),
            onPressed: _isLoading ? null : _submitStep2BankAndIdentity,
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  void _pickAndUploadDoc(String docId, String title) {
    showAppPhotoPicker(
      context,
      title: title,
      subtitle: AppLanguage().tr(mr: 'कॅमेरा किंवा गॅलरी मधून निवडा', en: 'Select from camera or gallery'),
      allowPdf: true,
      onPhotoSelected: (photoStr) async {
        setState(() {
          _uploadingDocs[docId] = true;
        });
        try {
          await FarmerState().uploadDocument(docId, fileUrl: photoStr, status: 'pending');
          if (!mounted) return;
          _showToast(AppLanguage().tr(mr: '$title यशस्वीपणे अपलोड झाले! ✓', en: '$title uploaded! ✓'));
        } catch (e) {
          if (mounted) {
            _showToast('Upload failed: $e', isError: true);
          }
        } finally {
          if (mounted) {
            setState(() {
              _uploadingDocs[docId] = false;
            });
          }
        }
      },
    );
  }

  void _viewDocumentModal(DocumentItem doc, String title) {
    final isPdf = doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf');

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogCtx) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500, maxHeight: 650),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                    border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.file_present_rounded, color: Color(0xFF16A34A), size: 20),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 12),
                                const SizedBox(width: 4),
                                Text(
                                  AppLanguage().tr(mr: 'कागदपत्र पूर्वावलोकन (Preview)', en: 'Document Preview'),
                                  style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                        onPressed: () => Navigator.pop(dialogCtx),
                        tooltip: AppLanguage().tr(mr: 'बंद करा', en: 'Close'),
                      ),
                    ],
                  ),
                ),

                // Preview Content
                Flexible(
                  child: Container(
                    color: isPdf ? Colors.white : const Color(0xFF0F172A),
                    child: isPdf
                        ? Container(
                            padding: const EdgeInsets.all(32),
                            color: Colors.white,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(20),
                                  decoration: const BoxDecoration(
                                    color: Color(0xFFFEF2F2),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 64),
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  '$title.pdf',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  AppLanguage().tr(
                                    mr: 'PDF दस्तऐवज सुरक्षितपणे सेव्ह झाला आहे.',
                                    en: 'PDF document has been securely uploaded.',
                                  ),
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        : InteractiveViewer(
                            panEnabled: true,
                            minScale: 0.8,
                            maxScale: 5.0,
                            child: Center(
                              child: AppImageWidget(
                                imageStr: doc.fileUrl,
                                fit: BoxFit.contain,
                              ),
                            ),
                          ),
                  ),
                ),

                // Footer
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
                    border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: const Color(0xFF475569),
                            side: const BorderSide(color: Color(0xFFCBD5E1)),
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.close_rounded, size: 16),
                          label: Text(
                            AppLanguage().tr(mr: 'बंद करा', en: 'Close'),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          onPressed: () => Navigator.pop(dialogCtx),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 11),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          icon: const Icon(Icons.refresh_rounded, size: 16),
                          label: Text(
                            AppLanguage().tr(mr: 'बदला', en: 'Change'),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          onPressed: () {
                            Navigator.pop(dialogCtx);
                            _pickAndUploadDoc(doc.id, title);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 3 VIEW: DOCUMENTATION KYC
  // ---------------------------------------------------------------------------
  Widget _buildStep3Documents() {
    final docs = FarmerState().documents;
    if (docs.isEmpty) {
      FarmerState().fetchFromBackend();
    }

    final docList = [
      ('DOC-2', 'farmer_id', AppLanguage().tr(mr: 'शेतकरी ओळखपत्र (Farmer ID Card) *', en: 'Farmer ID Card *'), true, Icons.badge_rounded),
      ('DOC-3', 'land_712', AppLanguage().tr(mr: '७/१२ उतारा *', en: '7/12 Extract *'), true, Icons.description_outlined),
      ('DOC-4', 'land_8a', AppLanguage().tr(mr: '८-अ उतारा', en: '8A Extract'), false, Icons.article_outlined),
      ('DOC-1', 'aadhaar', AppLanguage().tr(mr: 'आधार कार्ड *', en: 'Aadhaar Card *'), true, Icons.badge_outlined),
      ('DOC-8', 'pan', AppLanguage().tr(mr: 'पॅन कार्ड', en: 'PAN Card'), false, Icons.credit_card_rounded),
      ('DOC-5', 'bank', AppLanguage().tr(mr: 'बँक पासबुक / चेक *', en: 'Bank Passbook / Cheque *'), true, Icons.account_balance_wallet_outlined),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          icon: Icons.file_upload_outlined,
          title: AppLanguage().tr(mr: '३. कागदपत्रे केवायसी', en: '3. Documentation KYC'),
          subtitle: AppLanguage().tr(
            mr: 'व्हेंडर पडताळणीसाठी आवश्यक कागदपत्रे कॅमेरा किंवा गॅलरीतून अपलोड करा.',
            en: 'Upload clear photos or PDFs of your farming and identity documents.',
          ),
        ),
        const SizedBox(height: 12),

        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: const Color(0xFFBFDBFE)),
          ),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: Color(0xFF1D4ED8), size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  AppLanguage().tr(
                    mr: 'आवश्यक कागदपत्रे: शेतकरी ओळखपत्र (Farmer ID), ७/१२ उतारा, आधार कार्ड आणि बँक पासबुक अपलोड करणे बंधनकारक आहे.',
                    en: 'Mandatory documents: Farmer ID Card, 7/12 Extract, Aadhaar Card, and Bank Passbook.',
                  ),
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF1E40AF), fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        ...docList.map((item) {
          final (docId, type, title, isRequired, icon) = item;
          final uploadedDoc = docs.firstWhere(
            (d) => d.id == docId || d.type.toLowerCase() == type.toLowerCase(),
            orElse: () => DocumentItem(id: docId, type: type, title: title, marathiTitle: title, isUploaded: false, status: 'not_uploaded'),
          );

          final isDone = uploadedDoc.isUploaded && uploadedDoc.fileUrl.isNotEmpty;
          final isUploading = _uploadingDocs[docId] == true;
          final isPdf = uploadedDoc.fileUrl.startsWith('data:application/pdf') || uploadedDoc.fileUrl.toLowerCase().endsWith('.pdf');

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isUploading
                    ? const Color(0xFF60A5FA)
                    : (isDone ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
                width: isUploading ? 1.5 : 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    GestureDetector(
                      onTap: isDone ? () => _viewDocumentModal(uploadedDoc, title) : null,
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isDone ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: isDone ? Border.all(color: const Color(0xFF86EFAC)) : null,
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: isDone
                            ? (isPdf
                                ? const Center(child: Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFDC2626), size: 24))
                                : AppImageWidget(imageStr: uploadedDoc.fileUrl, fit: BoxFit.cover))
                            : Icon(icon, color: const Color(0xFF64748B), size: 22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: isDone ? () => _viewDocumentModal(uploadedDoc, title) : null,
                        behavior: HitTestBehavior.opaque,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    title,
                                    style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                                  ),
                                ),
                                if (isRequired)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEE2E2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      AppLanguage().tr(mr: 'आवश्यक', en: 'Required'),
                                      style: const TextStyle(fontSize: 9.5, color: Color(0xFFDC2626), fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(
                                  isUploading
                                      ? Icons.cloud_upload_outlined
                                      : (isDone ? Icons.check_circle_rounded : Icons.pending_outlined),
                                  size: 13,
                                  color: isUploading
                                      ? const Color(0xFF2563EB)
                                      : (isDone ? const Color(0xFF16A34A) : const Color(0xFFF59E0B)),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isUploading
                                      ? AppLanguage().tr(mr: 'अपलोड होत आहे... ⏳', en: 'Uploading... ⏳')
                                      : (isDone
                                          ? AppLanguage().tr(mr: 'अपलोड पूर्ण ✓', en: 'Uploaded ✓')
                                          : AppLanguage().tr(mr: 'अपलोड बाकी ⏳', en: 'Pending ⏳')),
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isUploading
                                        ? const Color(0xFF2563EB)
                                        : (isDone ? const Color(0xFF16A34A) : const Color(0xFFD97706)),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (isDone) ...[
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF0F766E),
                          side: const BorderSide(color: Color(0xFF0F766E)),
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.visibility_outlined, size: 14),
                        label: Text(
                          AppLanguage().tr(mr: 'पहा', en: 'View'),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        onPressed: () => _viewDocumentModal(uploadedDoc, title),
                      ),
                      const SizedBox(width: 6),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF8FAFC),
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.refresh_rounded, size: 14),
                        label: Text(
                          AppLanguage().tr(mr: 'बदला', en: 'Change'),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        onPressed: isUploading ? null : () => _pickAndUploadDoc(docId, title),
                      ),
                    ] else ...[
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: isUploading
                            ? const SizedBox(
                                width: 13,
                                height: 13,
                                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                              )
                            : const Icon(Icons.upload_file_rounded, size: 14),
                        label: Text(
                          isUploading
                              ? AppLanguage().tr(mr: 'थांबा...', en: 'Wait...')
                              : AppLanguage().tr(mr: 'अपलोड', en: 'Upload'),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        onPressed: isUploading ? null : () => _pickAndUploadDoc(docId, title),
                      ),
                    ],
                  ],
                ),

                // Uploading progress indicator line directly below the document row
                if (isUploading) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const SizedBox(
                              width: 13,
                              height: 13,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                AppLanguage().tr(
                                  mr: '$title अपलोड होत आहे... कृपया थांबा',
                                  en: 'Uploading $title... Please wait',
                                ),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF15803D),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 7),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: const LinearProgressIndicator(
                            minHeight: 5,
                            backgroundColor: Color(0xFFDCFCE7),
                            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF16A34A)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          );
        }),

        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.arrow_back, size: 16),
                label: Text(
                  AppLanguage().tr(mr: '← मागे (बँक)', en: '← Back (Bank)'),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                ),
                onPressed: () => setState(() => _activeStep = 2),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              flex: 3,
              child: _primaryButton(
                label: AppLanguage().tr(mr: 'सबमिट व पुढे जा →', en: 'Submit & Proceed →'),
                onPressed: _submitStep3Documents,
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
      ],
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 4 VIEW: LIVE VIDEO VERIFICATION
  // ---------------------------------------------------------------------------
  Widget _buildStep4LiveVideo() {
    final docs = FarmerState().documents;
    final isDone = docs.any((d) => (d.type == 'video_kyc' || d.id == 'DOC-9') && d.isUploaded);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          icon: Icons.videocam_rounded,
          title: AppLanguage().tr(mr: '४. थेट चेहरा व व्हिडिओ पडताळणी', en: '4. Live Face Video Verification'),
          subtitle: AppLanguage().tr(
            mr: 'तुमची अस्सल शेतकरी ओळख तत्काळ प्रमाणित करण्यासाठी ५ सेकंदांची थेट कॅमेरा पडताळणी करा.',
            en: 'Perform a fast 5-second camera liveness verification to verify your farmer identity.',
          ),
        ),
        const SizedBox(height: 16),

        if (isDone) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF86EFAC)),
            ),
            child: Column(
              children: [
                const Icon(Icons.verified_rounded, color: Color(0xFF16A34A), size: 64),
                const SizedBox(height: 12),
                Text(
                  AppLanguage().tr(mr: 'थेट व्हिडिओ पडताळणी पूर्ण झाली! ✓', en: 'Live Video KYC Verified! ✓'),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                ),
                const SizedBox(height: 4),
                Text(
                  AppLanguage().tr(
                    mr: 'तुमचा पडताळणी व्हिडिओ यशस्वीरित्या रेकॉर्ड झाला असून व्हेंडरकडे मंजुरीसाठी पाठवला आहे.',
                    en: 'Your vertical video KYC clip was recorded and submitted for vendor approval.',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF15803D)),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF16A34A),
                    side: const BorderSide(color: Color(0xFF16A34A)),
                  ),
                  icon: const Icon(Icons.refresh_rounded, size: 16),
                  label: Text(AppLanguage().tr(mr: 'पुन्हा रेकॉर्ड करा', en: 'Re-record Video')),
                  onPressed: _startLiveVideoKyc,
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: Text(
                    AppLanguage().tr(mr: '← मागे (कागदपत्रे)', en: '← Back (Docs)'),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                  onPressed: () => setState(() => _activeStep = 3),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: _primaryButton(
                  label: AppLanguage().tr(mr: 'शेती तपशीलाकडे जा →', en: 'Continue to Farm →'),
                  onPressed: () {
                    setState(() => _activeStep = 5);
                  },
                ),
              ),
            ],
          ),
        ] else ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFCBD5E1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: const BoxDecoration(
                    color: Color(0xFFEFF6FF),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.face_retouching_natural_rounded, color: AppColors.primary, size: 40),
                ),
                const SizedBox(height: 12),
                Text(
                  AppLanguage().tr(mr: 'एआय चेहरा हालचाल पडताळणी', en: 'AI Live Face Verification'),
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                ),
                const SizedBox(height: 6),
                Text(
                  AppLanguage().tr(
                    mr: 'कॅमेरा सुरू झाल्यावर चेहरा वर्तुळात ठेवा आणि सूचनांनुसार मान व डोळे हलवा.',
                    en: 'Hold your phone upright, place face in circle, and follow the animated prompt.',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 16),
                _instructionPoint('१', AppLanguage().tr(mr: 'चांगल्या प्रकाशात उभे रहा.', en: 'Stand in good lighting.')),
                _instructionPoint('२', AppLanguage().tr(mr: 'कॅमेरा पोर्ट्रेट (सरळ) धरा.', en: 'Hold phone upright (portrait).')),
                _instructionPoint('३', AppLanguage().tr(mr: 'डोळ्यांची उघडझाप व मान वळवा.', en: 'Blink and turn head as guided.')),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.camera_alt_rounded),
                    label: Text(
                      AppLanguage().tr(mr: 'थेट व्हिडिओ पडताळणी सुरू करा', en: 'Start Live Video KYC'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    onPressed: _startLiveVideoKyc,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF475569),
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.arrow_back, size: 16),
                    label: Text(
                      AppLanguage().tr(mr: '← मागील टप्प्यावर जा (कागदपत्रे)', en: '← Back to Documents'),
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                    ),
                    onPressed: () => setState(() => _activeStep = 3),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 30),
      ],
    );
  }

  Widget _instructionPoint(String num, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          CircleAvatar(
            radius: 9,
            backgroundColor: AppColors.primaryLight,
            child: Text(num, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.primary)),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF334155))),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 5 VIEW: FARM PROFILE
  // ---------------------------------------------------------------------------
  Widget _buildStep5FarmProfile() {
    return Form(
      key: _farmFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepHeader(
            icon: Icons.grass_rounded,
            title: AppLanguage().tr(mr: '५. शेती तपशील', en: '5. Farm Profile'),
            subtitle: AppLanguage().tr(
              mr: 'तुमच्या शेताचे क्षेत्र, जमिनीचा प्रकार, सिंचन व पिकांची माहिती नोंदवा.',
              en: 'Enter your farm acreage, soil type, irrigation system and crop details.',
            ),
          ),
          const SizedBox(height: 14),

          _buildTextField(
            controller: _farmNameController,
            label: AppLanguage().tr(mr: 'शेताचे नाव *', en: 'Farm Name *'),
            icon: Icons.landscape_outlined,
            validator: (v) => (v == null || v.trim().isEmpty) ? AppLanguage().tr(mr: 'शेताचे नाव आवश्यक आहे', en: 'Farm name is required') : null,
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                flex: 3,
                child: _buildTextField(
                  controller: _totalAreaController,
                  label: AppLanguage().tr(mr: 'एकूण शेती क्षेत्र *', en: 'Total Farm Area *'),
                  icon: Icons.square_foot_rounded,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  validator: (v) => (v == null || (double.tryParse(v) ?? 0) <= 0) ? AppLanguage().tr(mr: 'वैध क्षेत्र टाका', en: 'Valid area required') : null,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: _buildDropdown(
                  label: AppLanguage().tr(mr: 'एकक', en: 'Unit'),
                  value: _totalAreaUnit,
                  items: ['Acre', 'Guntha', 'Hectare'],
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
                flex: 3,
                child: _buildTextField(
                  controller: _cultivatedAreaController,
                  label: AppLanguage().tr(mr: 'लागवड क्षेत्र *', en: 'Cultivated Area *'),
                  icon: Icons.agriculture_rounded,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: _buildDropdown(
                  label: AppLanguage().tr(mr: 'एकक', en: 'Unit'),
                  value: _cultivatedAreaUnit,
                  items: ['Acre', 'Guntha', 'Hectare'],
                  onChanged: (val) {
                    if (val != null) setState(() => _cultivatedAreaUnit = val);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          _buildDropdown(
            label: AppLanguage().tr(mr: 'जमिनीचा / मातीचा प्रकार', en: 'Soil Type'),
            value: _soilType,
            items: [
              'Black Soil (काळी माती)',
              'Red Soil (तांबडी माती)',
              'Alluvial (गाळाची माती)',
              'Sandy Loam (वालुकामय माती)',
              'Clay (चिकण माती)',
              'Medium Black (मध्यम काळी)',
            ],
            onChanged: (val) {
              if (val != null) setState(() => _soilType = val);
            },
          ),
          const SizedBox(height: 12),

          _buildDropdown(
            label: AppLanguage().tr(mr: 'सिंचन प्रकार', en: 'Irrigation Type'),
            value: _irrigationType,
            items: [
              'Drip (ठिबक)',
              'Sprinkler (तुषार)',
              'Flood (मोकळे पाणी)',
              'Rainfed (पावसावर)',
            ],
            onChanged: (val) {
              if (val != null) setState(() => _irrigationType = val);
            },
          ),
          const SizedBox(height: 12),

          _buildDropdown(
            label: AppLanguage().tr(mr: 'पाण्याचा स्त्रोत', en: 'Water Source'),
            value: _waterSource,
            items: [
              'Borewell (बोअरवेल)',
              'Well (विहीर)',
              'Canal (कालवा)',
              'River (नदी)',
              'Farm Pond (शेततळे)',
            ],
            onChanged: (val) {
              if (val != null) setState(() => _waterSource = val);
            },
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildDropdown(
                  label: AppLanguage().tr(mr: 'शेती पद्धत', en: 'Farming Method'),
                  value: _farmingMethod,
                  items: [
                    'Organic (सेंद्रिय)',
                    'Traditional (पारंपारिक)',
                    'Natural (नैसर्गिक)',
                    'Conventional (रासायनिक)',
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _farmingMethod = val);
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _buildDropdown(
                  label: AppLanguage().tr(mr: 'मालकी प्रकार', en: 'Farming Type'),
                  value: _farmingType,
                  items: [
                    'Individual (स्वतःची)',
                    'Leased (खंडाने)',
                    'Contract (कंत्राटी)',
                  ],
                  onChanged: (val) {
                    if (val != null) setState(() => _farmingType = val);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          _buildTextField(
            controller: _mainCropsController,
            label: AppLanguage().tr(mr: 'मुख्य पिके (उदा. कांदा, सोयाबीन, कापूस, गहू)', en: 'Main Crops (e.g. Onion, Soybean, Wheat)'),
            icon: Icons.spa_outlined,
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: Text(
                    AppLanguage().tr(mr: '← मागे (व्हिडिओ)', en: '← Back (Video)'),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                  onPressed: () => setState(() => _activeStep = 4),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: _primaryButton(
                  label: AppLanguage().tr(mr: 'जतन करा व पुढे जा →', en: 'Save & Continue →'),
                  onPressed: _isLoading ? null : _submitStep5FarmProfile,
                ),
              ),
            ],
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 6 VIEW: FARM LOCATION (GPS & MAP)
  // ---------------------------------------------------------------------------
  Widget _buildStep6FarmLocation() {
    final hasCoords = _latitude != 0 && _longitude != 0;

    return Form(
      key: _locationFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepHeader(
            icon: Icons.location_on_rounded,
            title: AppLanguage().tr(mr: '६. शेताचे स्थान (GPS व नकाशा)', en: '6. Farm Location (GPS & Map)'),
            subtitle: AppLanguage().tr(
              mr: 'शेताचे अचूक GPS स्थान निश्चित करा जेणेकरून शेतमाल पिकअप वेळेवर होईल.',
              en: 'Confirm your exact farm GPS coordinates and location for seamless crop pickup.',
            ),
          ),
          const SizedBox(height: 14),

          // GPS Auto-detect Button
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: hasCoords ? const Color(0xFF86EFAC) : const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 22),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        hasCoords
                            ? AppLanguage().tr(mr: 'GPS स्थान नोंदवले गेले ✓', en: 'GPS Coordinates Recorded ✓')
                            : AppLanguage().tr(mr: 'GPS द्वारे शेताचे स्थान शोधा', en: 'Fetch Farm Location via GPS'),
                        style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                      ),
                    ),
                  ],
                ),
                if (hasCoords) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 16),
                            const SizedBox(width: 6),
                            Text(
                              'GPS: ${_latitude.toStringAsFixed(6)}°, ${_longitude.toStringAsFixed(6)}°',
                              style: const TextStyle(fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                            ),
                          ],
                        ),
                        if (_locVillageController.text.isNotEmpty || _locTalukaController.text.isNotEmpty || _locDistrictController.text.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            [
                              if (_locVillageController.text.isNotEmpty) 'गाव: ${_locVillageController.text}',
                              if (_locTalukaController.text.isNotEmpty) 'तालुका: ${_locTalukaController.text}',
                              if (_locDistrictController.text.isNotEmpty) 'जिल्हा: ${_locDistrictController.text}',
                              if (_locPincodeController.text.isNotEmpty) 'पिन: ${_locPincodeController.text}',
                            ].join(' | '),
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF15803D)),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEFF6FF),
                          foregroundColor: const Color(0xFF1D4ED8),
                          elevation: 0,
                          side: const BorderSide(color: Color(0xFFBFDBFE)),
                        ),
                        icon: _isGettingGps
                            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.gps_fixed_rounded, size: 16),
                        label: Text(
                          AppLanguage().tr(mr: 'सध्याचे GPS स्थान घ्या', en: 'Get Current GPS'),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        onPressed: _isGettingGps ? null : _detectGpsLocation,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          elevation: 0,
                        ),
                        icon: const Icon(Icons.map_rounded, size: 16),
                        label: Text(
                          AppLanguage().tr(mr: 'नकाशावर निवडा', en: 'Pick on Map'),
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        onPressed: _openMapPicker,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Map Preview
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: SizedBox(
              height: 180,
              child: FarmLocationPreviewMap(
                latitude: _latitude,
                longitude: _longitude,
                onTap: _openMapPicker,
              ),
            ),
          ),
          const SizedBox(height: 14),

          _buildTextField(
            controller: _farmAddressController,
            label: AppLanguage().tr(mr: 'शेताचा पत्ता / स्थानिक खूण *', en: 'Farm Address / Landmark *'),
            icon: Icons.home_work_outlined,
            maxLines: 2,
            validator: (v) => (v == null || v.trim().isEmpty) ? AppLanguage().tr(mr: 'शेताचा पत्ता आवश्यक आहे', en: 'Address required') : null,
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _locVillageController,
                  label: AppLanguage().tr(mr: 'गाव *', en: 'Village *'),
                  icon: Icons.holiday_village_rounded,
                  suffixIcon: Tooltip(
                    message: AppLanguage().tr(mr: 'गावाची यादी पहा', en: 'Browse village list'),
                    child: IconButton(
                      icon: const Icon(Icons.arrow_drop_down_circle_outlined, color: AppColors.primary, size: 20),
                      onPressed: _openVillagePickerForForm,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildTextField(
                  controller: _locTalukaController,
                  label: AppLanguage().tr(mr: 'तालुका', en: 'Taluka'),
                  icon: Icons.map,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 4),
            child: Row(
              children: [
                InkWell(
                  onTap: _openVillagePickerForForm,
                  borderRadius: BorderRadius.circular(4),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.touch_app_rounded, size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          AppLanguage().tr(mr: 'अधिकृत यादीतून शेताचे गाव निवडा ▾', en: 'Select village from official list ▾'),
                          style: const TextStyle(fontSize: 11.5, color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _locDistrictController,
                  label: AppLanguage().tr(mr: 'जिल्हा', en: 'District'),
                  icon: Icons.landscape,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildTextField(
                  controller: _locPincodeController,
                  label: AppLanguage().tr(mr: 'पिनकोड', en: 'Pincode'),
                  icon: Icons.pin_drop,
                  keyboardType: TextInputType.number,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.arrow_back, size: 16),
                  label: Text(
                    AppLanguage().tr(mr: '← मागे (शेती)', en: '← Back (Farm)'),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                  ),
                  onPressed: () => setState(() => _activeStep = 5),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 3,
                child: _primaryButton(
                  label: AppLanguage().tr(mr: 'नोंदणी पूर्ण करा ✓', en: 'Complete Registration ✓'),
                  onPressed: _isLoading ? null : _submitStep6LocationAndFinish,
                ),
              ),
            ],
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // CELEBRATION / COMPLETION SCREEN
  // ---------------------------------------------------------------------------
  Widget _buildCelebrationScreen() {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 88,
                  height: 88,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 64),
                ),
                const SizedBox(height: 16),
                Text(
                  AppLanguage().tr(mr: 'अभिनंदन!', en: 'Congratulations!'),
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                ),
                const SizedBox(height: 6),
                Text(
                  AppLanguage().tr(
                    mr: 'सर्व ६ नोंदणी व केवायसी टप्पे यशस्वीरित्या पूर्ण झाले आहेत!',
                    en: 'All 6 registration and KYC steps have been completed successfully!',
                  ),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14, color: Color(0xFF475569)),
                ),
                const SizedBox(height: 24),

                // 6 Verified Badges
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      _verifiedRow(AppLanguage().tr(mr: '१. शेतकरी नोंदणी फॉर्म', en: '1. Farmer Registration Form')),
                      _verifiedRow(AppLanguage().tr(mr: '२. बँक व ओळख तपशील', en: '2. Bank & Identity Details')),
                      _verifiedRow(AppLanguage().tr(mr: '३. कागदपत्रे केवायसी (७/१२, आधार, बँक)', en: '3. Documentation KYC (7/12, Aadhaar, Bank)')),
                      _verifiedRow(AppLanguage().tr(mr: '४. थेट चेहरा व व्हिडिओ पडताळणी', en: '4. Live Face Video Verification')),
                      _verifiedRow(AppLanguage().tr(mr: '५. शेती तपशील व क्षेत्र माहिती', en: '5. Farm Profile & Crop Info')),
                      _verifiedRow(AppLanguage().tr(mr: '६. शेताचे अचूक GPS स्थान व नकाशा', en: '6. Farm GPS Location Confirmed')),
                    ],
                  ),
                ),
                const SizedBox(height: 30),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.arrow_forward_rounded),
                    label: Text(
                      AppLanguage().tr(mr: 'हरितसेतू ॲप सुरू करा', en: 'Enter Haritsetu App'),
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    ),
                    onPressed: _finishAndEnterApp,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _verifiedRow(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              AppLanguage().tr(mr: 'पूर्ण ✓', en: 'DONE ✓'),
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // HELPER WIDGETS
  // ---------------------------------------------------------------------------
  Widget _stepHeader({required IconData icon, required String title, required String subtitle}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B), height: 1.3),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    int? maxLength,
    int maxLines = 1,
    String? Function(String?)? validator,
    Widget? suffixIcon,
    VoidCallback? onTap,
    bool readOnly = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      maxLength: maxLength,
      maxLines: maxLines,
      validator: validator,
      readOnly: readOnly,
      onTap: onTap,
      style: const TextStyle(fontSize: 13, color: Color(0xFF1E293B)),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
        prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
        suffixIcon: suffixIcon,
        counterText: '',
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    final effectiveValue = items.contains(value) ? value : items.first;

    return DropdownButtonFormField<String>(
      initialValue: effectiveValue,
      isExpanded: true,
      items: items.map((i) => DropdownMenuItem(value: i, child: Text(i, style: const TextStyle(fontSize: 12.5, color: Color(0xFF1E293B))))).toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
      ),
    );
  }

  Widget _primaryButton({required String label, required VoidCallback? onPressed}) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          disabledBackgroundColor: const Color(0xFF94A3B8),
          padding: const EdgeInsets.symmetric(vertical: 14),
          elevation: 1,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        onPressed: onPressed,
        child: _isLoading
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Text(
                label,
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold),
              ),
      ),
    );
  }
}
