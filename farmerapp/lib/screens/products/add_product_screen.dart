import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../crops/add_crop_screen.dart';

class GradeRow {
  String grade; // 'A', 'B', 'C', 'D'
  String quantity;
  String price;

  GradeRow({required this.grade, this.quantity = '', this.price = ''});
}

class AddProductScreen extends StatefulWidget {
  final String? prefilledCrop;
  final ProductItem? editingProduct;

  const AddProductScreen({super.key, this.prefilledCrop, this.editingProduct});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  static const List<String> _cropUnits = ['Kg', 'Quintal', 'Ton', 'Box', 'Dozen', 'Piece', 'Crate', 'Bag'];
  static const List<String> _farmingTypes = ['Conventional', 'Organic', 'Natural', 'IPM', 'Hydroponic', 'Other'];
  static const List<String> _allGradeOptions = ['A', 'B', 'C', 'D'];

  String? _selectedCropId;
  String _cropName = '';
  String _productName = '';
  final _varietyController = TextEditingController();
  String _farmingType = 'Conventional';
  final _customFarmingTypeController = TextEditingController();
  final _availableQtyController = TextEditingController();
  String _unit = 'Kg';

  DateTime? _sowingDate;
  DateTime? _harvestDate;
  DateTime? _availableFrom;
  DateTime? _availableUntil;

  final List<GradeRow> _grades = [];
  Map<String, String> _errors = {};

  // Photo slots matching web portal
  String _mainPhoto = '';
  String _farmPhoto = '';
  String _cropPhoto = '';
  String _harvestPhoto = '';
  List<String> _extraFarmPhotos = [];
  List<String> _extraCropPhotos = [];
  List<String> _extraHarvestPhotos = [];

  bool _isSubmitting = false;

  bool get isEditing => widget.editingProduct != null;

  @override
  void initState() {
    super.initState();
    final p = widget.editingProduct;
    final crops = FarmerState().crops;

    if (p != null) {
      _productName = p.productName;
      _cropName = p.cropLinked;
      _varietyController.text = p.variety;
      _farmingType = _farmingTypes.contains(p.farmingType) ? p.farmingType : (_farmingTypes.firstWhere((t) => p.farmingType.toLowerCase().contains(t.toLowerCase()), orElse: () => 'Conventional'));
      _availableQtyController.text = p.stockQuantity > 0 ? p.stockQuantity.toStringAsFixed(0) : '';
      _unit = _cropUnits.contains(p.unit) ? p.unit : 'Kg';

      try {
        if (p.sowingDate.isNotEmpty) _sowingDate = DateTime.tryParse(p.sowingDate);
      } catch (_) {}
      try {
        if (p.harvestDate.isNotEmpty) _harvestDate = DateTime.tryParse(p.harvestDate);
      } catch (_) {}
      try {
        if (p.availableFrom.isNotEmpty) _availableFrom = DateTime.tryParse(p.availableFrom);
      } catch (_) {}
      try {
        if (p.availableUntil.isNotEmpty) _availableUntil = DateTime.tryParse(p.availableUntil);
      } catch (_) {}

      // Grade initialization
      if (p.gradeAQty > 0 || p.gradeAPrice > 0) {
        _grades.add(GradeRow(grade: 'A', quantity: p.gradeAQty > 0 ? p.gradeAQty.toStringAsFixed(0) : '', price: p.gradeAPrice > 0 ? p.gradeAPrice.toStringAsFixed(0) : ''));
      }
      if (p.gradeBQty > 0 || p.gradeBPrice > 0) {
        _grades.add(GradeRow(grade: 'B', quantity: p.gradeBQty > 0 ? p.gradeBQty.toStringAsFixed(0) : '', price: p.gradeBPrice > 0 ? p.gradeBPrice.toStringAsFixed(0) : ''));
      }
      if (p.gradeCQty > 0 || p.gradeCPrice > 0) {
        _grades.add(GradeRow(grade: 'C', quantity: p.gradeCQty > 0 ? p.gradeCQty.toStringAsFixed(0) : '', price: p.gradeCPrice > 0 ? p.gradeCPrice.toStringAsFixed(0) : ''));
      }
      if (_grades.isEmpty) {
        _grades.add(GradeRow(grade: 'A', quantity: p.stockQuantity.toStringAsFixed(0), price: p.pricePerUnit.toStringAsFixed(0)));
      }

      // Photos initialization
      _mainPhoto = p.imageUrl.isNotEmpty ? p.imageUrl : (p.photos.isNotEmpty ? p.photos.first : '');
      if (p.photos.length > 1) {
        _farmPhoto = p.photos[1];
      }
      if (p.photos.length > 2) {
        _cropPhoto = p.photos[2];
      }
      if (p.photos.length > 3) {
        _harvestPhoto = p.photos[3];
      }

      // Match crop ID if possible
      final matched = crops.firstWhere(
        (c) => c.cropName.toLowerCase() == p.cropLinked.toLowerCase(),
        orElse: () => crops.isNotEmpty ? crops.first : CropItem(id: '', cropName: p.cropLinked, variety: p.variety, acreage: 1, sowingDate: '', estHarvestDate: '', status: '', progress: 0, stageIndex: 0),
      );
      _selectedCropId = matched.id.isNotEmpty ? matched.id : null;
    } else {
      // New Product
      _grades.add(GradeRow(grade: 'A', quantity: '', price: ''));

      // If prefilled crop given or available
      if (widget.prefilledCrop != null && widget.prefilledCrop!.isNotEmpty) {
        final match = crops.firstWhere(
          (c) => c.cropName.toLowerCase().contains(widget.prefilledCrop!.toLowerCase()),
          orElse: () => crops.isNotEmpty ? crops.first : CropItem(id: '', cropName: widget.prefilledCrop!, variety: 'Standard', acreage: 1, sowingDate: '', estHarvestDate: '', status: '', progress: 0, stageIndex: 0),
        );
        if (match.id.isNotEmpty) {
          _selectCrop(match);
        }
      } else if (crops.isNotEmpty) {
        _selectCrop(crops.first);
      }
    }
  }

  void _selectCrop(CropItem crop) {
    setState(() {
      _selectedCropId = crop.id;
      _cropName = crop.cropName;
      _productName = crop.cropName.split('(')[0].trim();
      _varietyController.text = crop.variety.isNotEmpty ? crop.variety : 'Standard';
      _unit = _cropUnits.contains(crop.unit) ? crop.unit : 'Kg';

      try {
        if (crop.sowingDate.contains('-')) {
          _sowingDate = DateTime.tryParse(crop.sowingDate);
        }
      } catch (_) {}
      try {
        if (crop.estHarvestDate.contains('-')) {
          _harvestDate = DateTime.tryParse(crop.estHarvestDate);
        }
      } catch (_) {}

      if (_harvestDate != null) {
        _availableFrom = _harvestDate;
        _availableUntil = _harvestDate!.add(const Duration(days: 60));
      }

      if (_availableQtyController.text.isEmpty && crop.estimatedQuantity > 0) {
        _availableQtyController.text = crop.estimatedQuantity.toStringAsFixed(0);
        if (_grades.isNotEmpty && _grades[0].quantity.isEmpty) {
          _grades[0].quantity = crop.estimatedQuantity.toStringAsFixed(0);
        }
      }

      if (crop.photos.isNotEmpty && _mainPhoto.isEmpty) {
        _mainPhoto = crop.photos.first;
      }
      if (crop.photos.length > 1 && _cropPhoto.isEmpty) {
        _cropPhoto = crop.photos[1];
      }

      _errors.remove('cropId');
      _errors.remove('productName');
      _errors.remove('variety');
    });
  }

  String _formatDate(DateTime? d) {
    if (d == null) return '';
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  Future<void> _pickDate({required String field}) async {
    DateTime initial = DateTime.now();
    if (field == 'harvest' && _harvestDate != null) {
      initial = _harvestDate!;
    } else if (field == 'from' && _availableFrom != null) {
      initial = _availableFrom!;
    } else if (field == 'until' && _availableUntil != null) {
      initial = _availableUntil!;
    }

    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2024),
      lastDate: DateTime(2032),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF217346),
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
        if (field == 'harvest') {
          _harvestDate = picked;
          _errors.remove('harvestDate');
          if (_availableFrom == null) _availableFrom = picked;
          if (_availableUntil == null) _availableUntil = picked.add(const Duration(days: 60));
        } else if (field == 'from') {
          _availableFrom = picked;
          _errors.remove('availableFrom');
          if (_availableUntil != null && _availableUntil!.isBefore(picked)) {
            _availableUntil = picked.add(const Duration(days: 30));
          }
        } else if (field == 'until') {
          _availableUntil = picked;
          _errors.remove('availableUntil');
        }
      });
    }
  }

  Future<void> _pickImageForSlot(ImageSource source, String slot) async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: source,
        maxWidth: 1200,
        maxHeight: 1200,
        imageQuality: 80,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        final base64Str = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        _setSlotPhoto(slot, base64Str);
      }
    } catch (_) {
      if (mounted) {
        showAppPhotoPicker(
          context,
          title: 'Select $slot Photo',
          presetCategory: 'Vegetables',
          onPhotoSelected: (photo) => _setSlotPhoto(slot, photo),
        );
      }
    }
  }

  void _setSlotPhoto(String slot, String photoStr) {
    setState(() {
      if (slot == 'main') {
        _mainPhoto = photoStr;
        _errors.remove('mainPhoto');
      } else if (slot == 'farm') {
        _farmPhoto = photoStr;
      } else if (slot == 'crop') {
        _cropPhoto = photoStr;
      } else if (slot == 'harvest') {
        _harvestPhoto = photoStr;
      }
    });
  }

  void _removeSlotPhoto(String slot) {
    setState(() {
      if (slot == 'main') _mainPhoto = '';
      if (slot == 'farm') _farmPhoto = '';
      if (slot == 'crop') _cropPhoto = '';
      if (slot == 'harvest') _harvestPhoto = '';
    });
  }

  List<String> get _unusedGrades {
    final used = _grades.map((g) => g.grade).toSet();
    return _allGradeOptions.where((g) => !used.contains(g)).toList();
  }

  void _addGrade() {
    final unused = _unusedGrades;
    if (unused.isEmpty) return;
    setState(() {
      _grades.add(GradeRow(grade: unused.first, quantity: '', price: ''));
      _errors.remove('grades');
    });
  }

  void _removeGrade(int index) {
    if (_grades.length <= 1) return;
    setState(() {
      _grades.removeAt(index);
    });
  }

  bool _validate(bool isPublish) {
    final next = <String, String>{};

    if (_productName.trim().isEmpty) next['productName'] = 'Product name is required';
    if (_selectedCropId == null && _cropName.isEmpty) next['cropId'] = 'Crop is required';

    if (isPublish) {
      if (_varietyController.text.trim().isEmpty) next['variety'] = 'Variety is required';
      if (_harvestDate == null) next['harvestDate'] = 'Harvest date is required';
      if (_availableFrom == null) next['availableFrom'] = 'Available from date is required';
      if (_availableUntil == null) next['availableUntil'] = 'Available until date is required';
      if (_availableFrom != null && _availableUntil != null && _availableUntil!.isBefore(_availableFrom!)) {
        next['availableUntil'] = 'Until date cannot be before from date';
      }
      final totalQty = _grades.fold<double>(0.0, (sum, g) => sum + (double.tryParse(g.quantity) ?? 0.0)) + (double.tryParse(_availableQtyController.text) ?? 0.0);
      if (totalQty <= 0) next['availableQuantity'] = 'Quantity must be greater than 0';
      if (_grades.isEmpty) next['grades'] = 'Add at least one grade';
      if (_mainPhoto.isEmpty) next['mainPhoto'] = 'Main product photo is required';
    }

    setState(() => _errors = next);
    return next.isEmpty;
  }

  Future<void> _submit(bool publish) async {
    if (!_validate(publish)) return;

    setState(() => _isSubmitting = true);

    try {
      final totalQty = _grades.fold<double>(0.0, (sum, g) => sum + (double.tryParse(g.quantity) ?? 0.0));
      final resolvedQty = totalQty > 0 ? totalQty : (double.tryParse(_availableQtyController.text) ?? 500.0);
      final resolvedFarmingType = _farmingType == 'Other' ? _customFarmingTypeController.text.trim() : _farmingType;

      final allPhotos = <String>[];
      if (_mainPhoto.isNotEmpty) allPhotos.add(_mainPhoto);
      if (_farmPhoto.isNotEmpty) allPhotos.add(_farmPhoto);
      if (_cropPhoto.isNotEmpty) allPhotos.add(_cropPhoto);
      if (_harvestPhoto.isNotEmpty) allPhotos.add(_harvestPhoto);
      allPhotos.addAll(_extraFarmPhotos);
      allPhotos.addAll(_extraCropPhotos);
      allPhotos.addAll(_extraHarvestPhotos);

      final grA = _grades.firstWhere((g) => g.grade == 'A', orElse: () => GradeRow(grade: 'A', quantity: '0', price: '0'));
      final grB = _grades.firstWhere((g) => g.grade == 'B', orElse: () => GradeRow(grade: 'B', quantity: '0', price: '0'));
      final grC = _grades.firstWhere((g) => g.grade == 'C', orElse: () => GradeRow(grade: 'C', quantity: '0', price: '0'));

      final grAPrice = double.tryParse(grA.price) ?? 30.0;
      final grAQty = double.tryParse(grA.quantity) ?? resolvedQty;
      final grBPrice = double.tryParse(grB.price) ?? (grAPrice * 0.4);
      final grBQty = double.tryParse(grB.quantity) ?? 0.0;
      final grCPrice = double.tryParse(grC.price) ?? 0.0;
      final grCQty = double.tryParse(grC.quantity) ?? 0.0;

      final status = publish ? 'Active' : 'Draft';

      if (isEditing) {
        final existing = widget.editingProduct!;
        final updated = ProductItem(
          id: existing.id,
          productId: existing.productId,
          productName: _productName,
          variety: _varietyController.text.trim(),
          category: 'Vegetables (भाजीपाला)',
          cropLinked: _cropName,
          grade: 'Grade ${_grades.isNotEmpty ? _grades.first.grade : 'A'}',
          unit: _unit,
          pricePerUnit: grAPrice,
          stockQuantity: resolvedQty,
          minimumOrderQuantity: existing.minimumOrderQuantity,
          farmingType: resolvedFarmingType.isNotEmpty ? resolvedFarmingType : 'Conventional',
          farmName: existing.farmName,
          farmLocation: existing.farmLocation,
          sowingDate: _formatDate(_sowingDate),
          harvestDate: _formatDate(_harvestDate),
          availableFrom: _formatDate(_availableFrom),
          availableUntil: _formatDate(_availableUntil),
          status: status,
          imageUrl: _mainPhoto,
          photos: allPhotos,
          gradeAPrice: grAPrice,
          gradeAQty: grAQty,
          gradeBPrice: grBPrice,
          gradeBQty: grBQty,
          gradeCPrice: grCPrice,
          gradeCQty: grCQty,
        );

        FarmerState().updateProduct(updated);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(publish ? 'Product submitted & published!' : 'Draft saved'),
              backgroundColor: const Color(0xFF217346),
            ),
          );
          Navigator.pop(context, updated);
        }
      } else {
        final timestamp = DateTime.now().millisecondsSinceEpoch.toString().substring(8);
        final prodId = 'PRD-$timestamp';
        final businessId = 'GGC-PRD-20260908-000$timestamp';

        final newProduct = ProductItem(
          id: prodId,
          productId: businessId,
          productName: _productName,
          variety: _varietyController.text.trim(),
          category: 'Vegetables (भाजीपाला)',
          cropLinked: _cropName,
          grade: 'Grade ${_grades.isNotEmpty ? _grades.first.grade : 'A'}',
          unit: _unit,
          pricePerUnit: grAPrice,
          stockQuantity: resolvedQty,
          minimumOrderQuantity: 10.0,
          farmingType: resolvedFarmingType.isNotEmpty ? resolvedFarmingType : 'Conventional',
          farmName: 'Nehe Mala',
          farmLocation: 'Sawargaon Tal, Sangamner',
          sowingDate: _formatDate(_sowingDate),
          harvestDate: _formatDate(_harvestDate),
          availableFrom: _formatDate(_availableFrom),
          availableUntil: _formatDate(_availableUntil),
          status: status,
          imageUrl: _mainPhoto,
          photos: allPhotos,
          gradeAPrice: grAPrice,
          gradeAQty: grAQty,
          gradeBPrice: grBPrice,
          gradeBQty: grBQty,
          gradeCPrice: grCPrice,
          gradeCQty: grCQty,
        );

        FarmerState().addProduct(newProduct);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(publish ? 'Product submitted for approval & published!' : 'Draft saved successfully'),
              backgroundColor: const Color(0xFF217346),
            ),
          );
          Navigator.pop(context, newProduct);
        }
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    _varietyController.dispose();
    _customFarmingTypeController.dispose();
    _availableQtyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final crops = FarmerState().crops;
    final unused = _unusedGrades;

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
          isEditing ? 'Edit Product' : 'Add Product',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Back', style: TextStyle(color: Color(0xFF217346), fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Subtitle & Warning
                const Text(
                  'Link this product to a crop, then save as draft or publish for approval.',
                  style: TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                ),
                if (crops.isEmpty) ...[
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Add a crop first, then create a product.', style: TextStyle(fontSize: 11, color: Color(0xFFB45309))),
                        GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCropScreen())),
                          child: const Text('Add Crop', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF217346))),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 10),

                // Main Excel Card Container (Matching EXCEL_PANEL)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.02),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Product ID Banner (if editing)
                      if (isEditing && widget.editingProduct != null) ...[
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
                              const Text('PRODUCT ID', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF047857))),
                              Text(
                                widget.editingProduct!.displayBusinessId,
                                style: const TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],

                      // ==========================================
                      // SECTION 1: PRODUCT (2-Column Excel Layout)
                      // ==========================================
                      _buildSectionTitle('PRODUCT'),
                      const SizedBox(height: 6),

                      // Select Crop (Full Width)
                      _buildLabel('Select Crop', required: true),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedCropId != null && crops.any((c) => c.id == _selectedCropId) ? _selectedCropId : null,
                        hint: const Text('Select crop', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5)),
                        isExpanded: true,
                        decoration: _inputDecoration(error: _errors['cropId']),
                        items: crops.map((c) {
                          return DropdownMenuItem<String>(
                            value: c.id,
                            child: Text(
                              '${c.cropName} ${c.variety.isNotEmpty ? '(${c.variety})' : ''} — ${c.businessId}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final c = crops.firstWhere((item) => item.id == val);
                            _selectCrop(c);
                          }
                        },
                      ),
                      if (_errors['cropId'] != null) _buildErrorText(_errors['cropId']!),
                      const SizedBox(height: 10),

                      // 2-Column Row 1: Product Name & Variety
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Product Name', required: true),
                                Container(
                                  height: 38,
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  alignment: Alignment.centerLeft,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFCBD5E1)),
                                  ),
                                  child: Text(
                                    _productName.isNotEmpty ? _productName : 'Select crop first',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: _productName.isNotEmpty ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (_errors['productName'] != null) _buildErrorText(_errors['productName']!),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Variety', required: true),
                                SizedBox(
                                  height: 38,
                                  child: TextFormField(
                                    controller: _varietyController,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                    decoration: _inputDecoration(hint: 'Variety name', error: _errors['variety']),
                                    onChanged: (_) => setState(() => _errors.remove('variety')),
                                  ),
                                ),
                                if (_errors['variety'] != null) _buildErrorText(_errors['variety']!),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // 2-Column Row 2: Farming Type & Quantity with Unit
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Farming Type', required: true),
                                DropdownButtonFormField<String>(
                                  initialValue: _farmingTypes.contains(_farmingType) ? _farmingType : 'Conventional',
                                  isExpanded: true,
                                  decoration: _inputDecoration(),
                                  items: _farmingTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 11.5)))).toList(),
                                  onChanged: (val) {
                                    if (val != null) setState(() => _farmingType = val);
                                  },
                                ),
                                if (_farmingType == 'Other') ...[
                                  const SizedBox(height: 4),
                                  SizedBox(
                                    height: 36,
                                    child: TextFormField(
                                      controller: _customFarmingTypeController,
                                      style: const TextStyle(fontSize: 11.5),
                                      decoration: _inputDecoration(hint: 'Specify type'),
                                    ),
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
                                _buildLabel('Quantity', required: true),
                                SizedBox(
                                  height: 38,
                                  child: TextFormField(
                                    controller: _availableQtyController,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                    decoration: _inputDecoration(hint: '0').copyWith(
                                      contentPadding: const EdgeInsets.only(left: 8, right: 2, top: 8, bottom: 8),
                                      suffixIcon: Padding(
                                        padding: const EdgeInsets.only(right: 4),
                                        child: DropdownButtonHideUnderline(
                                          child: DropdownButton<String>(
                                            value: _unit,
                                            isDense: true,
                                            icon: const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                            items: _cropUnits.map((u) => DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 11)))).toList(),
                                            onChanged: (val) {
                                              if (val != null) setState(() => _unit = val);
                                            },
                                          ),
                                        ),
                                      ),
                                      suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
                                    ),
                                    onChanged: (_) => setState(() => _errors.remove('availableQuantity')),
                                  ),
                                ),
                                if (_errors['availableQuantity'] != null) _buildErrorText(_errors['availableQuantity']!),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // 2-Column Row 3: Sowing Date & Harvest Date
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Sowing Date'),
                                Container(
                                  height: 38,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  alignment: Alignment.centerLeft,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFCBD5E1)),
                                  ),
                                  child: Text(
                                    _sowingDate != null ? _formatDate(_sowingDate) : '—',
                                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
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
                                _buildLabel('Harvest Date', required: true),
                                InkWell(
                                  onTap: () => _pickDate(field: 'harvest'),
                                  child: Container(
                                    height: 38,
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: _errors['harvestDate'] != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1)),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          _harvestDate != null ? _formatDate(_harvestDate) : 'Select date',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: _harvestDate != null ? FontWeight.bold : FontWeight.normal,
                                            color: _harvestDate != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                          ),
                                        ),
                                        const Icon(Icons.calendar_today, size: 13, color: Color(0xFF64748B)),
                                      ],
                                    ),
                                  ),
                                ),
                                if (_errors['harvestDate'] != null) _buildErrorText(_errors['harvestDate']!),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // 2-Column Row 4: Available From & Available Until
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('From', required: true),
                                InkWell(
                                  onTap: () => _pickDate(field: 'from'),
                                  child: Container(
                                    height: 38,
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: _errors['availableFrom'] != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1)),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          _availableFrom != null ? _formatDate(_availableFrom) : 'Select date',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: _availableFrom != null ? FontWeight.bold : FontWeight.normal,
                                            color: _availableFrom != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                          ),
                                        ),
                                        const Icon(Icons.calendar_today, size: 13, color: Color(0xFF64748B)),
                                      ],
                                    ),
                                  ),
                                ),
                                if (_errors['availableFrom'] != null) _buildErrorText(_errors['availableFrom']!),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel('Until', required: true),
                                InkWell(
                                  onTap: () => _pickDate(field: 'until'),
                                  child: Container(
                                    height: 38,
                                    padding: const EdgeInsets.symmetric(horizontal: 8),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: _errors['availableUntil'] != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1)),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          _availableUntil != null ? _formatDate(_availableUntil) : 'Select date',
                                          style: TextStyle(
                                            fontSize: 11.5,
                                            fontWeight: _availableUntil != null ? FontWeight.bold : FontWeight.normal,
                                            color: _availableUntil != null ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                          ),
                                        ),
                                        const Icon(Icons.calendar_today, size: 13, color: Color(0xFF64748B)),
                                      ],
                                    ),
                                  ),
                                ),
                                if (_errors['availableUntil'] != null) _buildErrorText(_errors['availableUntil']!),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // ==========================================
                      // SECTION 2: GRADE * (Dynamic Grade Rows)
                      // ==========================================
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildSectionTitle('GRADE *'),
                          if (unused.isNotEmpty)
                            SizedBox(
                              height: 28,
                              child: OutlinedButton(
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 0),
                                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                ),
                                onPressed: _addGrade,
                                child: const Text('+ Add', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                              ),
                            ),
                        ],
                      ),
                      if (_errors['grades'] != null) ...[
                        const SizedBox(height: 2),
                        _buildErrorText(_errors['grades']!),
                      ],
                      const SizedBox(height: 6),

                      // Grade Column Headers
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 2),
                        child: Row(
                          children: [
                            SizedBox(width: 42, child: Text('GRADE', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
                            SizedBox(width: 8),
                            Expanded(child: Text('QTY', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
                            SizedBox(width: 8),
                            SizedBox(width: 72, child: Text('UNIT', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
                            SizedBox(width: 34),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Grade Rows List
                      ..._grades.asMap().entries.map((entry) {
                        final idx = entry.key;
                        final grade = entry.value;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Row(
                            children: [
                              // Grade Badge Box
                              Container(
                                width: 42,
                                height: 38,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF8FAFC),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: Text(
                                  grade.grade,
                                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Quantity Input
                              Expanded(
                                child: SizedBox(
                                  height: 38,
                                  child: TextFormField(
                                    initialValue: grade.quantity,
                                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                    decoration: _inputDecoration(hint: 'Qty'),
                                    onChanged: (v) => grade.quantity = v,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),

                              // Unit Dropdown
                              Container(
                                width: 72,
                                height: 38,
                                padding: const EdgeInsets.symmetric(horizontal: 6),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: DropdownButtonHideUnderline(
                                  child: DropdownButton<String>(
                                    value: _unit,
                                    isExpanded: true,
                                    isDense: true,
                                    items: _cropUnits.map((u) => DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 11.5)))).toList(),
                                    onChanged: (val) {
                                      if (val != null) setState(() => _unit = val);
                                    },
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),

                              // Delete Button
                              SizedBox(
                                width: 28,
                                height: 38,
                                child: IconButton(
                                  icon: const Icon(Icons.close, size: 16, color: Color(0xFFDC2626)),
                                  padding: EdgeInsets.zero,
                                  onPressed: _grades.length > 1 ? () => _removeGrade(idx) : null,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 14),

                      // ==========================================
                      // SECTION 3: PHOTOS (2x2 Grid with Upload & Camera)
                      // ==========================================
                      _buildSectionTitle('PHOTOS'),
                      const SizedBox(height: 2),
                      const Text(
                        'Clear, well-lit photos. Product should be clearly visible.',
                        style: TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                      ),
                      if (_errors['mainPhoto'] != null) ...[
                        const SizedBox(height: 2),
                        _buildErrorText(_errors['mainPhoto']!),
                      ],
                      const SizedBox(height: 8),

                      // 2x2 Photo Tiles Grid
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildPhotoTile(
                              label: 'Main',
                              required: true,
                              photoUrl: _mainPhoto,
                              slotKey: 'main',
                              error: _errors['mainPhoto'],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildPhotoTile(
                              label: 'Farm',
                              photoUrl: _farmPhoto,
                              slotKey: 'farm',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: _buildPhotoTile(
                              label: 'Crop',
                              photoUrl: _cropPhoto,
                              slotKey: 'crop',
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildPhotoTile(
                              label: 'Harvest',
                              photoUrl: _harvestPhoto,
                              slotKey: 'harvest',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
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
          child: Row(
            children: [
              // Save Draft Button (EXCEL_BTN)
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF334155),
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFFCBD5E1)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _isSubmitting ? null : () => _submit(false),
                    child: Text(
                      _isSubmitting ? 'Saving…' : 'Save Draft',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Publish Button (EXCEL_BTN_PRIMARY)
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF217346),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _isSubmitting ? null : () => _submit(true),
                    child: Text(
                      _isSubmitting ? 'Saving…' : 'Publish',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhotoTile({
    required String label,
    bool required = false,
    required String photoUrl,
    required String slotKey,
    String? error,
  }) {
    final hasPhoto = photoUrl.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
            if (required) const Text(' *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFDC2626))),
          ],
        ),
        const SizedBox(height: 4),

        // Photo Preview Box
        Container(
          height: 76,
          width: double.infinity,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: error != null ? const Color(0xFFDC2626) : const Color(0xFFE2E8F0)),
          ),
          clipBehavior: Clip.antiAlias,
          child: hasPhoto
              ? Stack(
                  fit: StackFit.expand,
                  children: [
                    AppImageWidget(imageStr: photoUrl, fit: BoxFit.cover),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => _removeSlotPhoto(slotKey),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, size: 10, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                )
              : const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('+', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
                      Text('Add photo', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
        ),
        const SizedBox(height: 4),

        // Upload (Gallery) & Camera Action Buttons matching web portal
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 28,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF217346),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onPressed: () => _pickImageForSlot(ImageSource.gallery, slotKey),
                  child: const Text('Upload', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
            const SizedBox(width: 4),
            Expanded(
              child: SizedBox(
                height: 28,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF334155),
                    backgroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onPressed: () => _pickImageForSlot(ImageSource.camera, slotKey),
                  child: const Text('Camera', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
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

  Widget _buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 3),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            text,
            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
          ),
          if (required) const Text(' *', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFDC2626))),
        ],
      ),
    );
  }

  Widget _buildErrorText(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Text(text, style: const TextStyle(fontSize: 9.5, color: Color(0xFFDC2626), fontWeight: FontWeight.bold)),
    );
  }

  InputDecoration _inputDecoration({String? hint, String? error}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: error != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: BorderSide(color: error != null ? const Color(0xFFDC2626) : const Color(0xFFCBD5E1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF217346), width: 1.2)),
    );
  }
}
