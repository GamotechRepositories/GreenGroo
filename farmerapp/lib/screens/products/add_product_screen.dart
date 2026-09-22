import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class AddProductScreen extends StatefulWidget {
  final String? prefilledCrop;
  final ProductItem? editingProduct;

  const AddProductScreen({super.key, this.prefilledCrop, this.editingProduct});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _varietyController;
  late final TextEditingController _priceController;
  late final TextEditingController _stockController;
  late final TextEditingController _moqController;
  late final TextEditingController _farmNameController;
  late final TextEditingController _farmLocationController;
  late final TextEditingController _sowingDateController;
  late final TextEditingController _harvestDateController;
  late final TextEditingController _availableFromController;
  late final TextEditingController _availableUntilController;

  late String _selectedCategory;
  late String _selectedGrade;
  late String _selectedUnit;
  late String _selectedStatus;
  late String _selectedCropLinked;
  late String _selectedFarmingType;

  final List<String> _categories = [
    'Vegetables (भाजीपाला)',
    'Fruits (फळे)',
    'Grains & Cereals (धान्य व कडधान्ये)',
    'Spices (मसाले)',
    'Commercial Crops (नगदी पिके)',
  ];

  final List<String> _farmingTypes = [
    'Organic (सेंद्रिय)',
    'Conventional (पारंपारिक)',
    'IPM (एकात्मिक कीड व्यवस्थापन)',
    'Natural (नैसर्गिक)',
  ];

  bool get isEditing => widget.editingProduct != null;

  @override
  void initState() {
    super.initState();
    final p = widget.editingProduct;

    _nameController = TextEditingController(text: p?.productName ?? widget.prefilledCrop ?? '');
    _varietyController = TextEditingController(text: p?.variety ?? 'Standard');
    _priceController = TextEditingController(text: p != null ? p.pricePerUnit.toStringAsFixed(0) : '30');
    _stockController = TextEditingController(text: p != null ? p.stockQuantity.toStringAsFixed(0) : '500');
    _moqController = TextEditingController(text: p != null ? p.minimumOrderQuantity.toStringAsFixed(0) : '20');
    _farmNameController = TextEditingController(text: p?.farmName ?? 'My Krushi Farm');
    _farmLocationController = TextEditingController(text: p?.farmLocation ?? 'Sawargaon Tal, Baramati');
    _sowingDateController = TextEditingController(text: p?.sowingDate ?? '15 Aug 2026');
    _harvestDateController = TextEditingController(text: p?.harvestDate ?? '14 Oct 2026');
    _availableFromController = TextEditingController(text: p?.availableFrom ?? '15 Oct 2026');
    _availableUntilController = TextEditingController(text: p?.availableUntil ?? '30 Nov 2026');

    _selectedCategory = p?.category ?? 'Vegetables (भाजीपाला)';
    _selectedGrade = p?.grade ?? 'Grade A';
    _selectedUnit = p?.unit ?? 'Kg';
    _selectedStatus = p?.status ?? 'Active';
    _selectedFarmingType = p?.farmingType ?? 'Organic (सेंद्रिय)';

    if (p != null && p.cropLinked.isNotEmpty) {
      _selectedCropLinked = p.cropLinked;
    } else if (widget.prefilledCrop != null && widget.prefilledCrop!.isNotEmpty) {
      _selectedCropLinked = widget.prefilledCrop!;
    } else {
      final crops = FarmerState().crops;
      _selectedCropLinked = crops.isNotEmpty ? crops.first.cropName : 'Brinjal (वांगी)';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _varietyController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    _moqController.dispose();
    _farmNameController.dispose();
    _farmLocationController.dispose();
    _sowingDateController.dispose();
    _harvestDateController.dispose();
    _availableFromController.dispose();
    _availableUntilController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final price = double.tryParse(_priceController.text.trim()) ?? 30.0;
      final stock = double.tryParse(_stockController.text.trim()) ?? 500.0;
      final moq = double.tryParse(_moqController.text.trim()) ?? 20.0;

      if (isEditing) {
        final existing = widget.editingProduct!;
        final updatedProduct = ProductItem(
          id: existing.id,
          productId: existing.productId,
          productName: _nameController.text.trim(),
          variety: _varietyController.text.trim(),
          category: _selectedCategory,
          cropLinked: _selectedCropLinked,
          grade: _selectedGrade,
          unit: _selectedUnit,
          pricePerUnit: price,
          stockQuantity: stock,
          minimumOrderQuantity: moq,
          farmingType: _selectedFarmingType,
          farmName: _farmNameController.text.trim(),
          farmLocation: _farmLocationController.text.trim(),
          sowingDate: _sowingDateController.text.trim(),
          harvestDate: _harvestDateController.text.trim(),
          availableFrom: _availableFromController.text.trim(),
          availableUntil: _availableUntilController.text.trim(),
          status: _selectedStatus,
          imageUrl: existing.imageUrl,
          photos: existing.photos,
        );

        FarmerState().updateProduct(updatedProduct);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Product "${updatedProduct.productName}" updated successfully!'),
            backgroundColor: const Color(0xFF217346),
            duration: const Duration(seconds: 2),
          ),
        );
        Navigator.pop(context, updatedProduct);
      } else {
        final timestamp = DateTime.now().millisecondsSinceEpoch.toString().substring(8);
        final prodId = 'PRD-$timestamp';
        final businessId = 'GGC-PRD-20260908-000$timestamp';

        final newProduct = ProductItem(
          id: prodId,
          productId: businessId,
          productName: _nameController.text.trim(),
          variety: _varietyController.text.trim(),
          category: _selectedCategory,
          cropLinked: _selectedCropLinked,
          grade: _selectedGrade,
          unit: _selectedUnit,
          pricePerUnit: price,
          stockQuantity: stock,
          minimumOrderQuantity: moq,
          farmingType: _selectedFarmingType,
          farmName: _farmNameController.text.trim(),
          farmLocation: _farmLocationController.text.trim(),
          sowingDate: _sowingDateController.text.trim(),
          harvestDate: _harvestDateController.text.trim(),
          availableFrom: _availableFromController.text.trim(),
          availableUntil: _availableUntilController.text.trim(),
          status: _selectedStatus,
        );

        FarmerState().addProduct(newProduct);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Product "${newProduct.productName}" published successfully!'),
            backgroundColor: const Color(0xFF217346),
            duration: const Duration(seconds: 2),
          ),
        );
        Navigator.pop(context, newProduct);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final crops = FarmerState().crops;

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
          isEditing ? 'Edit Product (${widget.editingProduct?.productName})' : 'Add Product (नवीन उत्पादन जोडा)',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(12),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Basic Product Information
              _buildFormSection(
                title: 'Basic Product Information',
                icon: Icons.inventory_2_outlined,
                children: [
                  // Product Name
                  _buildLabel('Product Title / Name *'),
                  TextFormField(
                    controller: _nameController,
                    decoration: _inputDecoration(hint: 'e.g. Fresh Organic Brinjal (ताजी वांगी)'),
                    validator: (val) => val == null || val.trim().isEmpty ? 'Please enter product name' : null,
                  ),
                  const SizedBox(height: 10),

                  // Variety & Category Row
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Variety'),
                            TextFormField(
                              controller: _varietyController,
                              decoration: _inputDecoration(hint: 'e.g. Pusa Purple Long / Abhinav'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Category'),
                            DropdownButtonFormField<String>(
                              value: _selectedCategory,
                              isExpanded: true,
                              decoration: _inputDecoration(),
                              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 12)))).toList(),
                              onChanged: (val) => setState(() => _selectedCategory = val!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Linked Crop & Farming Type
                  Row(
                    children: [
                      if (crops.isNotEmpty) ...[
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Linked Crop'),
                              DropdownButtonFormField<String>(
                                value: crops.any((c) => c.cropName == _selectedCropLinked) ? _selectedCropLinked : crops.first.cropName,
                                isExpanded: true,
                                decoration: _inputDecoration(),
                                items: crops.map((c) => DropdownMenuItem(value: c.cropName, child: Text('${c.cropName} (${c.variety})', style: const TextStyle(fontSize: 12)))).toList(),
                                onChanged: (val) => setState(() => _selectedCropLinked = val!),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Farming Type'),
                            DropdownButtonFormField<String>(
                              value: _selectedFarmingType,
                              isExpanded: true,
                              decoration: _inputDecoration(),
                              items: _farmingTypes.map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 12)))).toList(),
                              onChanged: (val) => setState(() => _selectedFarmingType = val!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Quality Grade Chips
                  _buildLabel('Primary Quality Grade'),
                  Row(
                    children: FarmerConstants.productGrades.map((g) {
                      final isSelected = _selectedGrade == g;
                      Color chipColor = g == 'Grade A' ? const Color(0xFF065F46) : (g == 'Grade B' ? const Color(0xFF1E40AF) : const Color(0xFF92400E));
                      Color chipBg = g == 'Grade A' ? const Color(0xFFECFDF5) : (g == 'Grade B' ? const Color(0xFFEFF6FF) : const Color(0xFFFFFBEB));

                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(
                            g,
                            style: TextStyle(
                              fontSize: 11.5,
                              color: isSelected ? Colors.white : chipColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: chipColor,
                          backgroundColor: chipBg,
                          side: BorderSide(color: chipColor),
                          onSelected: (selected) {
                            if (selected) setState(() => _selectedGrade = g);
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 2. Pricing, Stock & Minimum Order
              _buildFormSection(
                title: 'Pricing, Stock & Order Specifications',
                icon: Icons.currency_rupee,
                children: [
                  Row(
                    children: [
                      Expanded(
                        flex: 3,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Selling Price (₹ / Unit) *'),
                            TextFormField(
                              controller: _priceController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: _inputDecoration(hint: 'e.g. 30'),
                              validator: (val) => val == null || double.tryParse(val) == null ? 'Enter valid price' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Unit'),
                            DropdownButtonFormField<String>(
                              value: _selectedUnit,
                              decoration: _inputDecoration(),
                              items: FarmerConstants.productUnits.map((u) => DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 12)))).toList(),
                              onChanged: (val) => setState(() => _selectedUnit = val!),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Available Stock Qty *'),
                            TextFormField(
                              controller: _stockController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: _inputDecoration(hint: 'e.g. 500'),
                              validator: (val) => val == null || double.tryParse(val) == null ? 'Enter quantity' : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Min Order Quantity (MOQ)'),
                            TextFormField(
                              controller: _moqController,
                              keyboardType: const TextInputType.numberWithOptions(decimal: true),
                              decoration: _inputDecoration(hint: 'e.g. 20'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 3. Farm Details & Harvest Window
              _buildFormSection(
                title: 'Farm Details & Availability Window',
                icon: Icons.calendar_today_outlined,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Farm Name'),
                            TextFormField(
                              controller: _farmNameController,
                              decoration: _inputDecoration(hint: 'e.g. My Krushi Farm'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Farm Location'),
                            TextFormField(
                              controller: _farmLocationController,
                              decoration: _inputDecoration(hint: 'e.g. Sawargaon Tal, Baramati'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Sowing Date'),
                            TextFormField(
                              controller: _sowingDateController,
                              decoration: _inputDecoration(hint: 'e.g. 15 Aug 2026'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Harvest Date'),
                            TextFormField(
                              controller: _harvestDateController,
                              decoration: _inputDecoration(hint: 'e.g. 14 Oct 2026'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Available From'),
                            TextFormField(
                              controller: _availableFromController,
                              decoration: _inputDecoration(hint: 'e.g. 15 Oct 2026'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildLabel('Available Until'),
                            TextFormField(
                              controller: _availableUntilController,
                              decoration: _inputDecoration(hint: 'e.g. 30 Nov 2026'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Listing Status
                  _buildLabel('Initial Listing Status'),
                  DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    decoration: _inputDecoration(),
                    items: ['Active', 'Draft', 'Paused', 'Published'].map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 12)))).toList(),
                    onChanged: (val) => setState(() => _selectedStatus = val!),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF217346),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: Icon(isEditing ? Icons.save_outlined : Icons.publish_outlined, size: 18),
                  label: Text(
                    isEditing ? 'Save Product Changes' : 'Publish Product (उत्पादन जोडा)',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  onPressed: _submit,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFormSection({required String title, required IconData icon, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Color(0xFFF1F5F9),
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                Icon(icon, size: 14, color: const Color(0xFF065F46)),
                const SizedBox(width: 6),
                Text(
                  title,
                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 0.2),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF217346), width: 1.5)),
    );
  }
}
