import '../../services/app_language.dart';
import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../../services/api_service.dart';
import '../../core/utils/photo_picker_sheet.dart';

class AddCropScreen extends StatefulWidget {
  final CropItem? editCrop;

  const AddCropScreen({super.key, this.editCrop});

  @override
  State<AddCropScreen> createState() => _AddCropScreenState();
}

class _AddCropScreenState extends State<AddCropScreen> {
  static String _translateOption(String val) {
    switch (val) {
      case 'Acre': return AppLanguage().tr(mr: 'एकर', en: 'Acre');
      case 'Hectare': return AppLanguage().tr(mr: 'हेक्टर', en: 'Hectare');
      case 'Kg': return AppLanguage().tr(mr: 'कि.ग्रा.', en: 'Kg');
      case 'Quintal': return AppLanguage().tr(mr: 'क्विंटल', en: 'Quintal');
      case 'Ton': return AppLanguage().tr(mr: 'टन', en: 'Ton');
      case 'Conventional': return AppLanguage().tr(mr: 'पारंपरिक', en: 'Conventional');
      case 'Mixed': return AppLanguage().tr(mr: 'मिश्र शेती', en: 'Mixed');
      case 'Natural': return AppLanguage().tr(mr: 'नैसर्गिक', en: 'Natural');
      case 'Organic': return AppLanguage().tr(mr: 'सेंद्रिय', en: 'Organic');
      case 'Drip': return AppLanguage().tr(mr: 'ठिबक', en: 'Drip');
      case 'Sprinkler': return AppLanguage().tr(mr: 'तुषार', en: 'Sprinkler');
      case 'Flood': return AppLanguage().tr(mr: 'पाटपाणी', en: 'Flood');
      case 'Rainfed': return AppLanguage().tr(mr: 'पावसावर आधारित', en: 'Rainfed');
      case 'Canal': return AppLanguage().tr(mr: 'कालवा', en: 'Canal');
      case 'Other': return AppLanguage().tr(mr: 'इतर', en: 'Other');
      case 'Planned': return AppLanguage().tr(mr: 'नियोजित', en: 'Planned');
      case 'Sown': return AppLanguage().tr(mr: 'लागवड झाली', en: 'Sown');
      case 'Crop Growing': return AppLanguage().tr(mr: 'पीक वाढ सुरू', en: 'Crop Growing');
      case 'Ready for Harvest': return AppLanguage().tr(mr: 'काढणीस तयार', en: 'Ready for Harvest');
      case 'Harvested': return AppLanguage().tr(mr: 'काढणी पूर्ण', en: 'Harvested');
      case 'Closed': return AppLanguage().tr(mr: 'बंद', en: 'Closed');
      default: return val;
    }
  }

  final _formKey = GlobalKey<FormState>();

  static const Map<String, List<String>> _knownCropVarieties = {
    'Tomato': ['Bajeerao', 'Abhinav', 'Sahoo', 'Namdhari', 'Heemsohna', 'Hybrid', 'Local'],
    'Onion': ['Nashik Red', 'Agrifound Light Red', 'Pusa Red', 'Hybrid', 'Local'],
    'Potato': ['Kufri Jyoti', 'Kufri Pukhraj', 'Kufri Chandramukhi', 'Hybrid', 'Local'],
    'Capsicum': ['California Wonder', 'Indra', 'Hybrid', 'Local'],
    'Brinjal': ['Pusa Purple Long', 'Hybrid', 'Local'],
    'Cabbage': ['Golden Acre', 'Hybrid', 'Local'],
    'Cauliflower': ['Pusa Snowball', 'Hybrid', 'Local'],
    'Okra': ['Parbhani Kranti', 'Hybrid', 'Local'],
    'Chilli': ['Guntur', 'Byadgi', 'Hybrid', 'Local'],
    'Cotton': ['Bt Hybrid', 'Desi', 'Hybrid', 'Local'],
    'Soybean': ['JS 335', 'MAUS', 'Hybrid', 'Local'],
    'Wheat': ['Lokwan', 'HD 2967', 'Hybrid', 'Local'],
    'Rice': ['Indrayani', 'Kolam', 'Basmati', 'Hybrid', 'Local'],
    'Sugarcane': ['Co 86032', 'Local'],
    'Grapes': ['Thompson Seedless', 'Sharad Seedless', 'Local'],
    'Pomegranate': ['Bhagwa', 'Ganesh', 'Local'],
    'Banana': ['Grand Naine', 'Robusta', 'Local'],
    'Maize': ['Hybrid', 'Local'],
    'Groundnut': ['TAG 24', 'Hybrid', 'Local'],
    'Turmeric': ['Salem', 'Rajapore', 'Local'],
  };

  static const List<String> _areaUnits = ['Acre', 'Hectare'];
  static const List<String> _quantityUnits = ['Kg', 'Quintal', 'Ton'];
  static const List<String> _farmingMethods = ['Conventional', 'Mixed', 'Natural', 'Other'];
  static const List<String> _irrigationTypes = ['Drip', 'Sprinkler', 'Flood', 'Rainfed', 'Canal', 'Other'];
  static const List<String> _farmingTypes = ['Conventional', 'Organic'];
  static const List<String> _cropStatuses = [
    'Planned',
    'Sown',
    'Crop Growing',
    'Ready for Harvest',
    'Harvested',
    'Closed',
  ];

  List<Map<String, dynamic>> _catalog = [];

  // Nothing selected by default in UI
  String? _selectedCrop;
  final _customCropController = TextEditingController();

  String? _selectedVariety;
  final _customVarietyController = TextEditingController();

  final _areaController = TextEditingController();
  String _selectedAreaUnit = 'Acre';

  final _quantityController = TextEditingController();
  String _selectedQuantityUnit = 'Kg';

  // Dates: default null
  DateTime? _sowingDate;
  DateTime? _harvestDate;

  // Farming: default null
  String? _selectedFarmingMethod;
  final _customFarmingMethodController = TextEditingController();

  String? _selectedIrrigationType;
  final _customIrrigationController = TextEditingController();

  String? _selectedFarmingType;
  String? _selectedStatus;

  final List<String> _photos = [];
  bool _isSubmitting = false;

  bool get isEdit => widget.editCrop != null;

  @override
  void initState() {
    super.initState();
    _loadCatalog();

    if (isEdit) {
      final c = widget.editCrop!;
      _selectedCrop = c.cropName.split('(')[0].trim();
      _selectedVariety = c.variety.trim();

      _areaController.text = c.acreage > 0 ? c.acreage.toString() : '';
      _selectedAreaUnit = _areaUnits.contains(c.areaUnit) ? c.areaUnit : 'Acre';

      _quantityController.text = c.estimatedQuantity > 0 ? c.estimatedQuantity.toStringAsFixed(0) : '';
      _selectedQuantityUnit = _quantityUnits.contains(c.unit) ? c.unit : 'Kg';

      try {
        if (c.sowingDate.contains('-')) {
          _sowingDate = DateTime.parse(c.sowingDate);
        }
      } catch (_) {}
      try {
        if (c.estHarvestDate.contains('-')) {
          _harvestDate = DateTime.parse(c.estHarvestDate);
        }
      } catch (_) {}

      _selectedFarmingMethod = _farmingMethods.firstWhere(
        (m) => m.toLowerCase() == c.farmingMethod.toLowerCase() || c.farmingMethod.toLowerCase().contains(m.toLowerCase()),
        orElse: () => 'Conventional',
      );

      _selectedIrrigationType = _irrigationTypes.firstWhere(
        (i) => i.toLowerCase() == c.irrigationType.toLowerCase() || c.irrigationType.toLowerCase().contains(i.toLowerCase()),
        orElse: () => 'Drip',
      );

      _selectedFarmingType = _farmingTypes.firstWhere(
        (t) => t.toLowerCase() == c.farmingType.toLowerCase() || c.farmingType.toLowerCase().contains(t.toLowerCase()),
        orElse: () => 'Conventional',
      );

      _selectedStatus = _cropStatuses.firstWhere(
        (s) => s.toLowerCase() == c.status.toLowerCase() || c.status.toLowerCase().contains(s.toLowerCase()),
        orElse: () => 'Crop Growing',
      );

      _photos.addAll(c.photos);
    }
  }

  Future<void> _loadCatalog() async {
    try {
      final res = await ApiService().fetchCropsCatalog();
      if (res is List) {
        setState(() {
          _catalog = res.map((item) => item as Map<String, dynamic>).toList();
        });
      }
    } catch (_) {}
  }

  List<String> get _registeredCropOptions {
    final set = <String>{};

    for (final c in _catalog) {
      final name = (c['cropName'] ?? c['name'] ?? '').toString().trim();
      if (name.isNotEmpty) set.add(name);
    }

    for (final c in FarmerState().crops) {
      final clean = c.cropName.split('(')[0].trim();
      if (clean.isNotEmpty) set.add(clean);
    }

    if (isEdit && _selectedCrop != null && _selectedCrop!.isNotEmpty) {
      set.add(_selectedCrop!);
    }

    if (set.isEmpty) {
      return ['Tomato', 'Brinjal', 'Onion', 'Other'];
    }

    return [...set, 'Other'];
  }

  List<String> _getVarietiesForSelectedCrop(String? cropName) {
    if (cropName == null || cropName.isEmpty) return [];

    final set = <String>{};

    for (final c in _catalog) {
      final cName = (c['cropName'] ?? c['name'] ?? '').toString().trim().toLowerCase();
      if (cName == cropName.toLowerCase()) {
        final v = (c['variety'] ?? '').toString().trim();
        if (v.isNotEmpty) set.add(v);
      }
    }

    if (_knownCropVarieties.containsKey(cropName)) {
      set.addAll(_knownCropVarieties[cropName]!);
    }

    if (isEdit && _selectedVariety != null && _selectedVariety!.isNotEmpty) {
      set.add(_selectedVariety!);
    }

    if (set.isEmpty) {
      return ['Hybrid', 'Local', 'Other'];
    }

    return [...set, 'Other'];
  }

  void _onCropSelected(String? crop) {
    setState(() {
      _selectedCrop = crop;
      _selectedVariety = null;
      if (crop != 'Other') {
        _customCropController.clear();
      }
    });
  }

  String get _resolvedCropName {
    if (_selectedCrop == 'Other') {
      final custom = _customCropController.text.trim();
      return custom.isNotEmpty ? custom : '';
    }
    return _selectedCrop ?? '';
  }

  String get _resolvedVariety {
    if (_selectedVariety == 'Other') {
      final custom = _customVarietyController.text.trim();
      return custom.isNotEmpty ? custom : '';
    }
    return _selectedVariety ?? '';
  }

  String _formatDate(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  String? _getPreviewId() {
    if (isEdit && widget.editCrop != null) {
      return widget.editCrop!.businessId;
    }
    final crop = _resolvedCropName;
    final variety = _resolvedVariety;
    if (crop.isEmpty || variety.isEmpty) return null;

    final cleanName = crop.replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final code = cleanName.length >= 3 ? cleanName.substring(0, 3) : 'CRP';
    final cleanVar = variety.replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final varCode = cleanVar.length >= 3 ? cleanVar.substring(0, 3) : 'HYB';
    return 'GGC-CRP-VEG-$code-$varCode-00001';
  }

  Future<void> _pickDate({required bool isSowing}) async {
    final initialDate = isSowing
        ? (_sowingDate ?? DateTime.now())
        : (_harvestDate ?? (_sowingDate?.add(const Duration(days: 90)) ?? DateTime.now().add(const Duration(days: 90))));

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2024),
      lastDate: DateTime(2032),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primary,
              onPrimary: Colors.white,
              onSurface: Color(0xFF0F172A),
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        if (isSowing) {
          _sowingDate = picked;
          if (_harvestDate != null && _harvestDate!.isBefore(_sowingDate!)) {
            _harvestDate = _sowingDate!.add(const Duration(days: 75));
          }
        } else {
          _harvestDate = picked;
        }
      });
    }
  }

  void _addPhotoDialog() {
    if (_photos.length >= 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कमाल ४ फोटो अनुमत आहेत.', en: 'Maximum 4 crop photos allowed.'))),
      );
      return;
    }

    showAppPhotoPicker(
      context,
      title: AppLanguage().tr(mr: 'पिकाचा फोटो जोडा', en: 'Add Crop Photo'),
      subtitle: AppLanguage().tr(mr: 'लाईव्ह कॅमेऱ्याने फोटो काढा किंवा गॅलरी मधून निवडा', en: 'Take live photo or select from gallery'),
      presetCategory: 'Crop',
      onPhotoSelected: (photoStr) {
        setState(() {
          if (!_photos.contains(photoStr)) {
            _photos.add(photoStr);
          }
        });
      },
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final cropName = _resolvedCropName;
    final variety = _resolvedVariety;

    if (cropName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया पीक निवडा किंवा प्रविष्ट करा.', en: 'Please select or enter a crop name.'))),
      );
      return;
    }
    if (variety.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया वाण निवडा किंवा प्रविष्ट करा.', en: 'Please select or enter a variety.'))),
      );
      return;
    }

    if (_sowingDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया लागवड तारीख निवडा.', en: 'Please select sowing date.'))),
      );
      return;
    }

    if (_harvestDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया अंदाजे काढणी तारीख निवडा.', en: 'Please select expected harvest date.'))),
      );
      return;
    }

    if (_selectedFarmingMethod == null || _selectedFarmingMethod!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया शेती पद्धत निवडा.', en: 'Please select farming method.'))),
      );
      return;
    }

    if (_selectedIrrigationType == null || _selectedIrrigationType!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLanguage().tr(mr: 'कृपया सिंचन प्रकार निवडा.', en: 'Please select irrigation type.'))),
      );
      return;
    }

    final area = double.tryParse(_areaController.text.trim()) ?? 1.0;
    final qty = double.tryParse(_quantityController.text.trim()) ?? 1000.0;
    final sowingStr = _formatDate(_sowingDate!);
    final harvestStr = _formatDate(_harvestDate!);
    final farmingMethod = _selectedFarmingMethod == 'Other' ? _customFarmingMethodController.text.trim() : (_selectedFarmingMethod ?? 'Conventional');
    final irrigationType = _selectedIrrigationType == 'Other' ? _customIrrigationController.text.trim() : (_selectedIrrigationType ?? 'Drip');
    final farmingType = _selectedFarmingType ?? 'Conventional';

    setState(() => _isSubmitting = true);

    try {
      if (isEdit) {
        final existing = widget.editCrop!;
        final updated = CropItem(
          id: existing.id,
          cropName: cropName,
          variety: variety,
          acreage: area,
          areaUnit: _selectedAreaUnit,
          sowingDate: sowingStr,
          estHarvestDate: harvestStr,
          estimatedQuantity: qty,
          unit: _selectedQuantityUnit,
          farmingMethod: farmingMethod.isNotEmpty ? farmingMethod : 'Conventional',
          farmingType: farmingType,
          irrigationType: irrigationType.isNotEmpty ? irrigationType : 'Drip',
          soilType: existing.soilType,
          photos: _photos,
          status: _selectedStatus ?? 'Crop Growing',
          progress: existing.progress,
          stageIndex: existing.stageIndex,
        );
        FarmerState().updateCrop(updated);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLanguage().tr(mr: 'पीक माहिती अद्ययावत केली', en: 'Crop updated')), backgroundColor: AppColors.primary),
          );
          Navigator.pop(context);
        }
      } else {
        final cropId = 'CRP-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
        final newCrop = CropItem(
          id: cropId,
          cropName: cropName,
          variety: variety,
          acreage: area,
          areaUnit: _selectedAreaUnit,
          sowingDate: sowingStr,
          estHarvestDate: harvestStr,
          estimatedQuantity: qty,
          unit: _selectedQuantityUnit,
          farmingMethod: farmingMethod.isNotEmpty ? farmingMethod : 'Conventional',
          farmingType: farmingType,
          irrigationType: irrigationType.isNotEmpty ? irrigationType : 'Drip',
          soilType: 'Black Soil',
          photos: _photos,
          status: 'Planned',
          progress: 0.04,
          stageIndex: 0,
        );
        FarmerState().addCrop(newCrop);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLanguage().tr(mr: 'नवीन पीक जतन केले', en: 'Crop saved')), backgroundColor: AppColors.primary),
          );
          Navigator.pop(context);
        }
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _customCropController.dispose();
    _customVarietyController.dispose();
    _areaController.dispose();
    _quantityController.dispose();
    _customFarmingMethodController.dispose();
    _customIrrigationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final registeredCrops = _registeredCropOptions;
    final availableVarieties = _getVarietiesForSelectedCrop(_selectedCrop);
    final previewId = _getPreviewId();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isEdit ? AppLanguage().tr(mr: 'पीक संपादित करा', en: 'Edit Crop') : AppLanguage().tr(mr: 'नवीन पीक जोडा', en: 'Add Crop'),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLanguage().tr(mr: 'मागे', en: 'Back'), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Form(
          key: _formKey,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Crop ID / Preview Banner (Compact)
                if (isEdit)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFD1FAE5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'CROP ID',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF047857)),
                        ),
                        Text(
                          previewId ?? widget.editCrop!.businessId,
                          style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'CROP ID PREVIEW',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF64748B)),
                        ),
                        Text(
                          previewId ?? AppLanguage().tr(mr: 'पीक व वाण निवडा', en: 'Select crop & variety'),
                          style: TextStyle(
                            fontFamily: previewId != null ? 'monospace' : null,
                            fontSize: 11,
                            fontWeight: previewId != null ? FontWeight.bold : FontWeight.normal,
                            color: previewId != null ? const Color(0xFF065F46) : const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 10),

                // SECTION 1: CROP (2 Columns)
                _buildSectionHeader(AppLanguage().tr(mr: 'पीक माहिती', en: 'CROP')),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'पीक निवडा *', en: 'Select Crop *')),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedCrop != null && registeredCrops.contains(_selectedCrop) ? _selectedCrop : null,
                            hint: Text(AppLanguage().tr(mr: 'पीक निवडा', en: 'Select Crop'), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            decoration: _inputDecoration(),
                            isDense: true,
                            items: registeredCrops.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                            onChanged: _onCropSelected,
                            validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                          ),
                          if (_selectedCrop == 'Other') ...[
                            const SizedBox(height: 4),
                            TextFormField(
                              controller: _customCropController,
                              decoration: _inputDecoration(hint: 'Crop name'),
                              validator: (v) => _selectedCrop == 'Other' && (v == null || v.trim().isEmpty) ? 'Enter crop name' : null,
                              onChanged: (_) => setState(() {}),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'वाण *', en: 'Variety *')),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedVariety != null && availableVarieties.contains(_selectedVariety) ? _selectedVariety : null,
                            hint: Text(
                              _selectedCrop == null ? AppLanguage().tr(mr: 'आधी पीक निवडा', en: 'Select crop first') : AppLanguage().tr(mr: 'वाण निवडा', en: 'Select Variety'),
                              style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                            ),
                            decoration: _inputDecoration(),
                            isDense: true,
                            items: _selectedCrop == null
                                ? []
                                : availableVarieties.map((v) => DropdownMenuItem(value: v, child: Text(v, style: const TextStyle(fontSize: 12)))).toList(),
                            onChanged: _selectedCrop == null
                                ? null
                                : (val) {
                                    setState(() => _selectedVariety = val);
                                  },
                            validator: (val) => val == null || val.isEmpty ? 'Required' : null,
                          ),
                          if (_selectedVariety == 'Other') ...[
                            const SizedBox(height: 4),
                            TextFormField(
                              controller: _customVarietyController,
                              decoration: _inputDecoration(hint: 'Variety name'),
                              validator: (v) => _selectedVariety == 'Other' && (v == null || v.trim().isEmpty) ? 'Enter variety' : null,
                              onChanged: (_) => setState(() {}),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // SECTION 2: AREA & QUANTITY (2 Columns, well-adjusted without overflow)
                _buildSectionHeader(AppLanguage().tr(mr: 'क्षेत्र आणि प्रमाण', en: 'AREA & QUANTITY')),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'क्षेत्र *', en: 'Area *')),
                          TextFormField(
                            controller: _areaController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                            decoration: _inputDecoration(hint: '0.0').copyWith(
                              contentPadding: const EdgeInsets.only(left: 8, right: 2, top: 8, bottom: 8),
                              suffixIcon: Padding(
                                padding: const EdgeInsets.only(right: 4),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: _selectedAreaUnit,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                    items: _areaUnits.map((u) => DropdownMenuItem(value: u, child: Text(_translateOption(u), style: const TextStyle(fontSize: 11)))).toList(),
                                    onChanged: (val) {
                                      if (val != null) setState(() => _selectedAreaUnit = val);
                                    },
                                  ),
                                ),
                              ),
                              suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Required';
                              final n = double.tryParse(v);
                              if (n == null || n <= 0) return '> 0';
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'अंदाजे उत्पादन *', en: 'Quantity *')),
                          TextFormField(
                            controller: _quantityController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                            decoration: _inputDecoration(hint: '0').copyWith(
                              contentPadding: const EdgeInsets.only(left: 8, right: 2, top: 8, bottom: 8),
                              suffixIcon: Padding(
                                padding: const EdgeInsets.only(right: 4),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: _selectedQuantityUnit,
                                    isDense: true,
                                    icon: const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                    items: _quantityUnits.map((u) => DropdownMenuItem(value: u, child: Text(_translateOption(u), style: const TextStyle(fontSize: 11)))).toList(),
                                    onChanged: (val) {
                                      if (val != null) setState(() => _selectedQuantityUnit = val);
                                    },
                                  ),
                                ),
                              ),
                              suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Required';
                              final n = double.tryParse(v);
                              if (n == null || n <= 0) return '> 0';
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // SECTION 3: DATES (2 Columns, Default Null)
                _buildSectionHeader(AppLanguage().tr(mr: 'लागवड व काढणी तारखा', en: 'DATES')),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'लागवड तारीख *', en: 'Sowing Date *')),
                          InkWell(
                            onTap: () => _pickDate(isSowing: true),
                            child: Container(
                              height: 38,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _sowingDate != null ? _formatDate(_sowingDate!) : AppLanguage().tr(mr: 'तारीख निवडा', en: 'Select Date'),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: _sowingDate != null ? FontWeight.w600 : FontWeight.normal,
                                      color: _sowingDate != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                    ),
                                  ),
                                  const Icon(Icons.calendar_today, size: 13, color: Color(0xFF64748B)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'अंदाजे काढणी तारीख *', en: 'Harvest Date *')),
                          InkWell(
                            onTap: () => _pickDate(isSowing: false),
                            child: Container(
                              height: 38,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _harvestDate != null ? _formatDate(_harvestDate!) : AppLanguage().tr(mr: 'तारीख निवडा', en: 'Select Date'),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: _harvestDate != null ? FontWeight.w600 : FontWeight.normal,
                                      color: _harvestDate != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                    ),
                                  ),
                                  const Icon(Icons.calendar_today, size: 13, color: Color(0xFF64748B)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // SECTION 4: FARMING (2 Columns, Default Null)
                _buildSectionHeader(AppLanguage().tr(mr: 'शेती पद्धत', en: 'FARMING')),
                const SizedBox(height: 6),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'शेती पद्धत *', en: 'Farming Method *')),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedFarmingMethod,
                            hint: Text(AppLanguage().tr(mr: 'पद्धत निवडा', en: 'Select Method'), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            decoration: _inputDecoration(),
                            isDense: true,
                            items: _farmingMethods.map((m) => DropdownMenuItem(value: m, child: Text(_translateOption(m), style: const TextStyle(fontSize: 11)))).toList(),
                            onChanged: (val) => setState(() => _selectedFarmingMethod = val),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                          ),
                          if (_selectedFarmingMethod == 'Other') ...[
                            const SizedBox(height: 4),
                            TextFormField(controller: _customFarmingMethodController, decoration: _inputDecoration(hint: 'Method name')),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'सिंचन प्रकार *', en: 'Irrigation Type *')),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedIrrigationType,
                            hint: Text(AppLanguage().tr(mr: 'सिंचन निवडा', en: 'Select Irrigation'), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            decoration: _inputDecoration(),
                            isDense: true,
                            items: _irrigationTypes.map((i) => DropdownMenuItem(value: i, child: Text(_translateOption(i), style: const TextStyle(fontSize: 11)))).toList(),
                            onChanged: (val) => setState(() => _selectedIrrigationType = val),
                            validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                          ),
                          if (_selectedIrrigationType == 'Other') ...[
                            const SizedBox(height: 4),
                            TextFormField(controller: _customIrrigationController, decoration: _inputDecoration(hint: 'Irrigation name')),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildLabel(AppLanguage().tr(mr: 'सेंद्रिय / रासायनिक', en: 'Organic / Conventional')),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedFarmingType,
                            hint: Text(AppLanguage().tr(mr: 'प्रकार निवडा', en: 'Select Type'), style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11)),
                            decoration: _inputDecoration(),
                            isDense: true,
                            items: _farmingTypes.map((t) => DropdownMenuItem(value: t, child: Text(_translateOption(t), style: const TextStyle(fontSize: 11)))).toList(),
                            onChanged: (val) => setState(() => _selectedFarmingType = val),
                          ),
                        ],
                      ),
                    ),
                    if (isEdit) ...[
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel(AppLanguage().tr(mr: 'स्थिती', en: 'Status')),
                            DropdownButtonFormField<String>(
                              initialValue: _selectedStatus,
                              decoration: _inputDecoration(),
                              isDense: true,
                              items: _cropStatuses.map((s) => DropdownMenuItem(value: s, child: Text(_translateOption(s), style: const TextStyle(fontSize: 11)))).toList(),
                              onChanged: (val) => setState(() => _selectedStatus = val),
                            ),
                          ],
                        ),
                      ),
                    ] else
                      const Expanded(child: SizedBox()),
                  ],
                ),
                const SizedBox(height: 12),

                // SECTION 5: PHOTOS (Compact)
                _buildSectionHeader(AppLanguage().tr(mr: 'पिकाचे फोटो', en: 'PHOTOS')),
                const SizedBox(height: 6),
                Row(
                  children: [
                    ..._photos.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final url = entry.value;
                      return Container(
                        margin: const EdgeInsets.only(right: 6),
                        width: 48,
                        height: 48,
                        child: Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                width: 48,
                                height: 48,
                                color: const Color(0xFFE2E8F0),
                                child: AppImageWidget(
                                  imageStr: url,
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: 1,
                              right: 1,
                              child: GestureDetector(
                                onTap: () => setState(() => _photos.removeAt(idx)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                  child: const Icon(Icons.close, size: 10, color: Colors.white),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                    if (_photos.length < 4)
                      InkWell(
                        onTap: _addPhotoDialog,
                        child: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.solid),
                            borderRadius: BorderRadius.circular(6),
                            color: const Color(0xFFF8FAFC),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_outlined, size: 16, color: Color(0xFF64748B)),
                              Text('Photo', style: TextStyle(fontSize: 8, color: Color(0xFF64748B))),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: Color(0xFFE2E8F0))),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: SafeArea(
          top: false,
          child: SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: _isSubmitting ? null : _submit,
              child: Text(
                _isSubmitting
                    ? AppLanguage().tr(mr: 'जतन करत आहे…', en: 'Saving…')
                    : (isEdit ? AppLanguage().tr(mr: 'बदल जतन करा', en: 'Save Changes') : AppLanguage().tr(mr: 'पीक जतन करा', en: 'Save Crop')),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 10,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.8,
        color: Color(0xFF64748B),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: AppColors.primary, width: 1.2)),
    );
  }
}
