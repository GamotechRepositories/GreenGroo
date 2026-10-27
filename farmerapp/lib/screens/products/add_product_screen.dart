import 'dart:convert';
import 'package:flutter/material.dart';
import '../../services/app_language.dart';
import 'package:image_picker/image_picker.dart';
import '../../models/farmer_models.dart';
import '../../services/farmer_state.dart';
import '../../core/utils/photo_picker_sheet.dart';

class GradeRow {
  String grade; // 'A', 'B', 'C', 'D'
  String quantity;
  String price;

  GradeRow({required this.grade, this.quantity = '', this.price = ''});
}

class AvailableProductOption {
  final String key;
  final String displayName;
  final String cleanName;
  final String? variety;
  final String? unit;
  final String? category;
  final String? imageUrl;
  final double? suggestedPrice;
  final String source; // 'Catalog' | 'All Products' | 'Produce' | 'Crop'

  const AvailableProductOption({
    required this.key,
    required this.displayName,
    required this.cleanName,
    this.variety,
    this.unit,
    this.category,
    this.imageUrl,
    this.suggestedPrice,
    this.source = 'Produce',
  });
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

  String? _selectedProductOptionKey;
  String _cropName = '';
  String _productName = '';
  final _productNameController = TextEditingController();
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

  String _translateOption(String val) {
    final lang = AppLanguage();
    switch (val.toLowerCase()) {
      case 'kg': return lang.tr(mr: 'किलो', en: 'Kg');
      case 'quintal': return lang.tr(mr: 'क्विंटल', en: 'Quintal');
      case 'ton': return lang.tr(mr: 'टन', en: 'Ton');
      case 'box': return lang.tr(mr: 'बॉक्स', en: 'Box');
      case 'dozen': return lang.tr(mr: 'डझन', en: 'Dozen');
      case 'piece': return lang.tr(mr: 'नग', en: 'Piece');
      case 'crate': return lang.tr(mr: 'क्रेटा', en: 'Crate');
      case 'bag': return lang.tr(mr: 'बॅग', en: 'Bag');

      case 'conventional': return lang.tr(mr: 'पारंपारिक शेती', en: 'Conventional');
      case 'organic': return lang.tr(mr: 'सेंद्रिय शेती', en: 'Organic');
      case 'natural': return lang.tr(mr: 'नैसर्गिक शेती', en: 'Natural');
      case 'ipm': return lang.tr(mr: 'आयपीएम', en: 'IPM');
      case 'hydroponic': return lang.tr(mr: 'हायड्रोपोनिक', en: 'Hydroponic');
      case 'other': return lang.tr(mr: 'इतर', en: 'Other');

      case 'main': return lang.tr(mr: 'मुख्य फोटो', en: 'Main');
      case 'farm': return lang.tr(mr: 'शेताचा फोटो', en: 'Farm');
      case 'crop': return lang.tr(mr: 'पिकाचा फोटो', en: 'Crop');
      case 'harvest': return lang.tr(mr: 'काढणीचा फोटो', en: 'Harvest');

      default: return val;
    }
  }


  @override
  void initState() {
    super.initState();
    final p = widget.editingProduct;
    FarmerState().fetchVendorAvailableProducts().then((_) {
      if (mounted) setState(() {});
    });
    final options = _getProductOptions();

    if (p != null) {
      _productName = p.productName;
      _productNameController.text = p.productName;
      _cropName = p.cropLinked.isNotEmpty ? p.cropLinked : p.productName;
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

      // Match option key
      for (final opt in options) {
        if (opt.cleanName.toLowerCase() == p.productName.toLowerCase() ||
            (p.cropLinked.isNotEmpty && opt.cleanName.toLowerCase() == p.cropLinked.toLowerCase())) {
          _selectedProductOptionKey = opt.key;
          break;
        }
      }
    } else {
      // New Product
      _grades.add(GradeRow(grade: 'A', quantity: '', price: ''));

      // If prefilled crop given or available
      if (widget.prefilledCrop != null && widget.prefilledCrop!.isNotEmpty) {
        final pref = widget.prefilledCrop!.toLowerCase();
        AvailableProductOption? match;
        for (final opt in options) {
          if (opt.cleanName.toLowerCase().contains(pref) || pref.contains(opt.cleanName.toLowerCase())) {
            match = opt;
            break;
          }
        }
        if (match != null) {
          _selectProductOption(match);
        } else {
          _productName = widget.prefilledCrop!;
          _productNameController.text = widget.prefilledCrop!;
          _cropName = widget.prefilledCrop!;
        }
      }
    }
  }

  List<AvailableProductOption> _getProductOptions() {
    final List<AvailableProductOption> list = [];
    final Set<String> seen = {};

    for (final p in FarmerState().vendorAvailableProducts) {
      final name = (p['productName'] ?? p['name'] ?? '').toString().trim();
      if (name.isEmpty) continue;
      final key = name.toLowerCase();
      if (!seen.add(key)) continue;
      final variety = (p['variety'] ?? p['varietyName'] ?? '').toString().trim();
      final unit = (p['unit'] ?? 'Kg').toString().trim();
      final image = (p['image'] ?? p['imageUrl'] ?? '').toString().trim();
      final priceRaw = p['sellingPrice'] ?? p['discountedPrice'] ?? p['price'];
      list.add(AvailableProductOption(
        key: key,
        displayName: name,
        cleanName: name,
        variety: variety.isNotEmpty ? variety : null,
        unit: unit.isNotEmpty ? unit : 'Kg',
        category: (p['category'] ?? '').toString(),
        imageUrl: image.isNotEmpty ? image : null,
        suggestedPrice: priceRaw is num ? priceRaw.toDouble() : double.tryParse('$priceRaw'),
        source: 'Vendor',
      ));
    }

    list.sort((a, b) => a.cleanName.toLowerCase().compareTo(b.cleanName.toLowerCase()));
    return list;
  }

  void _selectProductOption(AvailableProductOption opt) {
    setState(() {
      _selectedProductOptionKey = opt.key;

      final pName = opt.cleanName;
      _productName = pName;
      _productNameController.text = pName;
      _cropName = pName;

      final pVariety = (opt.variety ?? '').trim();
      _varietyController.text = pVariety;

      final pUnit = opt.unit ?? 'Kg';
      if (_cropUnits.contains(pUnit)) {
        _unit = pUnit;
      }

      final img = opt.imageUrl ?? '';
      if (img.isNotEmpty) {
        _mainPhoto = img;
      }

      if (opt.suggestedPrice != null && opt.suggestedPrice! > 0) {
        if (_grades.isNotEmpty) {
          _grades[0].price = opt.suggestedPrice!.toStringAsFixed(0);
        }
      }

      if (_harvestDate == null) {
        _harvestDate = DateTime.now().add(const Duration(days: 30));
        _availableFrom = _harvestDate;
        _availableUntil = _harvestDate!.add(const Duration(days: 60));
      }

      _errors.remove('productName');
      _errors.remove('cropId');
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
          title: AppLanguage().tr(mr: '$slot फोटो निवडा', en: 'Select $slot Photo'),
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

    final pName = _productNameController.text.trim().isNotEmpty ? _productNameController.text.trim() : _productName.trim();
    if (pName.isEmpty || (!isEditing && _selectedProductOptionKey == null)) {
      next['productName'] = AppLanguage().tr(mr: 'संकलन केंद्रातील उत्पादन निवडा', en: 'Select a product from your collection centre');
    }
    if (_varietyController.text.trim().isEmpty) {
      next['variety'] = AppLanguage().tr(mr: 'वाण आवश्यक आहे', en: 'Variety is required');
    }

    if (isPublish) {
      if (_harvestDate == null) next['harvestDate'] = AppLanguage().tr(mr: 'काढणी तारीख आवश्यक आहे', en: 'Harvest date is required');
      if (_availableFrom == null) next['availableFrom'] = AppLanguage().tr(mr: 'उपलब्ध पासून तारीख आवश्यक आहे', en: 'Available from date is required');
      if (_availableUntil == null) next['availableUntil'] = AppLanguage().tr(mr: 'उपलब्ध पर्यंत तारीख आवश्यक आहे', en: 'Available until date is required');
      if (_availableFrom != null && _availableUntil != null && _availableUntil!.isBefore(_availableFrom!)) {
        next['availableUntil'] = AppLanguage().tr(mr: 'शेवटची तारीख सुरुवातीच्या तारखेपूर्वी असू शकत नाही', en: 'Until date cannot be before from date');
      }
      final totalQty = _grades.fold<double>(0.0, (sum, g) => sum + (double.tryParse(g.quantity) ?? 0.0)) + (double.tryParse(_availableQtyController.text) ?? 0.0);
      if (totalQty <= 0) next['availableQuantity'] = AppLanguage().tr(mr: 'प्रमाण 0 पेक्षा जास्त असावे', en: 'Quantity must be greater than 0');
      if (_grades.isEmpty) next['grades'] = AppLanguage().tr(mr: 'किमान एक ग्रेड जोडा', en: 'Add at least one grade');
      if (_mainPhoto.isEmpty) next['mainPhoto'] = AppLanguage().tr(mr: 'मुख्य उत्पादन फोटो आवश्यक आहे', en: 'Main product photo is required');
    }

    setState(() => _errors = next);
    return next.isEmpty;
  }

  Future<void> _submit(bool publish) async {
    if (!_validate(publish)) return;

    setState(() => _isSubmitting = true);

    try {
      final totalQty = _grades.fold<double>(0.0, (sum, g) => sum + (double.tryParse(g.quantity) ?? 0.0));
      final resolvedQty = totalQty > 0 ? totalQty : (double.tryParse(_availableQtyController.text) ?? 0);
      final resolvedFarmingType = _farmingType == 'Other' ? _customFarmingTypeController.text.trim() : _farmingType;
      final resolvedName = _productNameController.text.trim().isNotEmpty ? _productNameController.text.trim() : _productName.trim();
      final resolvedCrop = _cropName.isNotEmpty ? _cropName : resolvedName;

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

      final existingPrice = isEditing && widget.editingProduct != null ? widget.editingProduct!.pricePerUnit : 0.0;
      final grAPrice = double.tryParse(grA.price) ?? existingPrice;
      final grAQty = double.tryParse(grA.quantity) ?? resolvedQty;
      final grBPrice = double.tryParse(grB.price) ?? (isEditing && widget.editingProduct != null ? widget.editingProduct!.gradeBPrice : 0.0);
      final grBQty = double.tryParse(grB.quantity) ?? 0.0;
      final grCPrice = double.tryParse(grC.price) ?? (isEditing && widget.editingProduct != null ? widget.editingProduct!.gradeCPrice : 0.0);
      final grCQty = double.tryParse(grC.quantity) ?? 0.0;

      final status = publish ? 'Active' : 'Draft';

      if (isEditing) {
        final existing = widget.editingProduct!;
        final updated = ProductItem(
          id: existing.id,
          productId: existing.productId,
          productName: resolvedName,
          variety: _varietyController.text.trim(),
          category: 'Vegetables',
          cropLinked: resolvedCrop,
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
              content: Text(publish ? AppLanguage().tr(mr: 'उत्पादन सादर व प्रकाशित झाले!', en: 'Product submitted & published!') : AppLanguage().tr(mr: 'मसुदा जतन झाला', en: 'Draft saved')),
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
          productName: resolvedName,
          variety: _varietyController.text.trim(),
          category: 'Vegetables',
          cropLinked: resolvedCrop,
          grade: 'Grade ${_grades.isNotEmpty ? _grades.first.grade : 'A'}',
          unit: _unit,
          pricePerUnit: grAPrice,
          stockQuantity: resolvedQty,
          minimumOrderQuantity: 10.0,
          farmingType: resolvedFarmingType.isNotEmpty ? resolvedFarmingType : 'Conventional',
          farmName: FarmerState().profile.farmName,
          farmLocation: [
            FarmerState().profile.village,
            FarmerState().profile.taluka,
            FarmerState().profile.district,
          ].where((part) => part.isNotEmpty).join(', '),
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
          isSelfAdded: true,
        );

        FarmerState().addProduct(newProduct);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(publish ? AppLanguage().tr(mr: 'उत्पादन मंजुरीसाठी सादर व प्रकाशित झाले!', en: 'Product submitted for approval & published!') : AppLanguage().tr(mr: 'मसुदा यशस्वीरीत्या जतन झाला', en: 'Draft saved successfully')),
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
    _productNameController.dispose();
    _varietyController.dispose();
    _customFarmingTypeController.dispose();
    _availableQtyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productOptions = _getProductOptions();
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
          isEditing ? AppLanguage().tr(mr: 'उत्पादनात बदल करा', en: 'Edit Product') : AppLanguage().tr(mr: 'उत्पादन जोडा', en: 'Add Product'),
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLanguage().tr(mr: 'मागे', en: 'Back'), style: const TextStyle(color: Color(0xFF217346), fontWeight: FontWeight.bold, fontSize: 13)),
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
                // Top Subtitle
                Text(
                  AppLanguage().tr(
                    mr: 'संकलन केंद्रातील उत्पादन निवडा, वाण आपोआप भरेल, नंतर मसुदा म्हणून जतन करा किंवा प्रकाशित करा.',
                    en: 'Select a collection centre product, variety fills automatically, then save as draft or publish.',
                  ),
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                ),
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
                              Text(AppLanguage().tr(mr: 'उत्पादन क्रमांक', en: 'PRODUCT ID'), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: Color(0xFF047857))),
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
                      _buildSectionTitle(AppLanguage().tr(mr: 'उत्पादन माहिती', en: 'PRODUCT DETAILS')),
                      const SizedBox(height: 6),

                      _buildLabel(AppLanguage().tr(mr: 'उत्पादनाचे नाव', en: 'Product Name'), required: true),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedProductOptionKey != null && productOptions.any((o) => o.key == _selectedProductOptionKey)
                            ? _selectedProductOptionKey
                            : null,
                        hint: Row(
                          children: [
                            const Icon(Icons.inventory_2_outlined, size: 15, color: Color(0xFF64748B)),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                productOptions.isEmpty
                                    ? AppLanguage().tr(mr: 'संकलन केंद्रात अद्याप उत्पादने नाहीत', en: 'No products at your collection centre yet')
                                    : AppLanguage().tr(mr: 'उत्पादन निवडा', en: 'Select product'),
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        isExpanded: true,
                        decoration: _inputDecoration(error: _errors['productName']),
                        items: productOptions.map((opt) {
                          return DropdownMenuItem<String>(
                            value: opt.key,
                            child: Row(
                              children: [
                                if (opt.imageUrl != null && opt.imageUrl!.isNotEmpty) ...[
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: SizedBox(
                                      width: 22,
                                      height: 22,
                                      child: AppImageWidget(imageStr: opt.imageUrl!, fit: BoxFit.cover),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ] else ...[
                                  Container(
                                    width: 22,
                                    height: 22,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFECFDF5),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: const Color(0xFFA7F3D0)),
                                    ),
                                    child: const Center(
                                      child: Icon(Icons.inventory_2_outlined, size: 12, color: Color(0xFF047857)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Expanded(
                                  child: Text(
                                    opt.displayName,
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (opt.unit != null && opt.unit!.isNotEmpty)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                    margin: const EdgeInsets.only(left: 6),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                    child: Text(
                                      opt.unit!,
                                      style: const TextStyle(fontSize: 10, color: Color(0xFF64748B), fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final opt = productOptions.firstWhere((o) => o.key == val);
                            _selectProductOption(opt);
                          }
                        },
                      ),
                      const SizedBox(height: 10),

                      _buildLabel(AppLanguage().tr(mr: 'वाण', en: 'Variety'), required: true),
                      SizedBox(
                        height: 38,
                        child: TextFormField(
                          controller: _varietyController,
                          readOnly: true,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
                          decoration: _inputDecoration(
                            hint: _productName.isEmpty
                                ? AppLanguage().tr(mr: 'आधी उत्पादन निवडा', en: 'Select product first')
                                : AppLanguage().tr(mr: 'आपोआप निवडले', en: 'Auto selected'),
                            error: _errors['variety'],
                          ),
                        ),
                      ),
                      if (_errors['variety'] != null) _buildErrorText(_errors['variety']!),
                      const SizedBox(height: 10),

                      // 2-Column Row 2: Farming Type & Quantity with Unit
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildLabel(AppLanguage().tr(mr: 'शेती पद्धती', en: 'Farming Type'), required: true),
                                DropdownButtonFormField<String>(
                                  initialValue: _farmingTypes.contains(_farmingType) ? _farmingType : 'Conventional',
                                  isExpanded: true,
                                  decoration: _inputDecoration(),
                                  items: _farmingTypes.map((t) => DropdownMenuItem(value: t, child: Text(_translateOption(t), style: const TextStyle(fontSize: 11.5)))).toList(),
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
                                      decoration: _inputDecoration(hint: AppLanguage().tr(mr: 'प्रकार लिहा', en: 'Specify type')),
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
                                _buildLabel(AppLanguage().tr(mr: 'उपलब्ध प्रमाण', en: 'Quantity'), required: true),
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
                                            items: _cropUnits.map((u) => DropdownMenuItem(value: u, child: Text(_translateOption(u), style: const TextStyle(fontSize: 11)))).toList(),
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
                                _buildLabel(AppLanguage().tr(mr: 'लागवड तारीख', en: 'Sowing Date')),
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
                                _buildLabel(AppLanguage().tr(mr: 'काढणी तारीख', en: 'Harvest Date'), required: true),
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
                                          _harvestDate != null ? _formatDate(_harvestDate) : AppLanguage().tr(mr: 'तारीख निवडा', en: 'Select date'),
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
                                _buildLabel(AppLanguage().tr(mr: 'पासून', en: 'From'), required: true),
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
                                          _availableFrom != null ? _formatDate(_availableFrom) : AppLanguage().tr(mr: 'तारीख निवडा', en: 'Select date'),
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
                                _buildLabel(AppLanguage().tr(mr: 'पर्यंत', en: 'Until'), required: true),
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
                                          _availableUntil != null ? _formatDate(_availableUntil) : AppLanguage().tr(mr: 'तारीख निवडा', en: 'Select date'),
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
                          _buildSectionTitle(AppLanguage().tr(mr: 'दर्जा व प्रमाण *', en: 'GRADE *')),
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
                                child: Text(AppLanguage().tr(mr: '+ जोडा', en: '+ Add'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
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
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 2),
                        child: Row(
                          children: [
                            SizedBox(width: 42, child: Text(AppLanguage().tr(mr: 'दर्जा', en: 'GRADE'), style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
                            SizedBox(width: 8),
                            Expanded(child: Text(AppLanguage().tr(mr: 'प्रमाण', en: 'QTY'), style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
                            SizedBox(width: 8),
                            SizedBox(width: 72, child: Text(AppLanguage().tr(mr: 'एकक', en: 'UNIT'), style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)))),
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
                                    decoration: _inputDecoration(hint: AppLanguage().tr(mr: 'प्रमाण', en: 'Qty')),
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
                                    items: _cropUnits.map((u) => DropdownMenuItem(value: u, child: Text(_translateOption(u), style: const TextStyle(fontSize: 11.5)))).toList(),
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
                      _buildSectionTitle(AppLanguage().tr(mr: 'उत्पादन फोटो', en: 'PHOTOS')),
                      const SizedBox(height: 2),
                      Text(
                        AppLanguage().tr(mr: 'स्पष्ट आणि पुरेशा प्रकाशात काढलेले फोटो. उत्पादन स्पष्ट दिसले पाहिजे.', en: 'Clear, well-lit photos. Product should be clearly visible.'),
                        style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
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
                              label: _translateOption('main'),
                              required: true,
                              photoUrl: _mainPhoto,
                              slotKey: 'main',
                              error: _errors['mainPhoto'],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildPhotoTile(
                              label: _translateOption('farm'),
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
                              label: _translateOption('crop'),
                              photoUrl: _cropPhoto,
                              slotKey: 'crop',
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildPhotoTile(
                              label: _translateOption('harvest'),
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
                      _isSubmitting ? AppLanguage().tr(mr: 'जतन करत आहे…', en: 'Saving…') : AppLanguage().tr(mr: 'मसुदा जतन करा', en: 'Save Draft'),
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
                      _isSubmitting ? AppLanguage().tr(mr: 'जतन करत आहे…', en: 'Saving…') : AppLanguage().tr(mr: 'प्रकाशित करा', en: 'Publish'),
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
              : Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('+', style: TextStyle(fontSize: 14, color: Color(0xFF94A3B8))),
                      Text(AppLanguage().tr(mr: 'फोटो जोडा', en: 'Add photo'), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
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
                  child: Text(AppLanguage().tr(mr: 'अपलोड', en: 'Upload'), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
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
                  child: Text(AppLanguage().tr(mr: 'कॅमेरा', en: 'Camera'), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
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
