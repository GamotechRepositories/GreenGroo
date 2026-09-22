import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class AddProductScreen extends StatefulWidget {
  final String? prefilledCrop;
  const AddProductScreen({super.key, this.prefilledCrop});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _priceController = TextEditingController();
  final _stockController = TextEditingController();

  String _selectedCategory = 'Vegetables (भाजीपाला)';
  String _selectedGrade = 'Grade A';
  String _selectedUnit = 'Kg';
  String _selectedStatus = 'Active';
  String _selectedCropLinked = '';

  final List<String> _categories = [
    'Vegetables (भाजीपाला)',
    'Fruits (फळे)',
    'Grains & Cereals (धान्य व कडधान्ये)',
    'Spices (मसाले)',
    'Commercial Crops (नगदी पिके)',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.prefilledCrop != null && widget.prefilledCrop!.isNotEmpty) {
      _selectedCropLinked = widget.prefilledCrop!;
      _nameController.text = widget.prefilledCrop!;
    } else {
      final crops = FarmerState().crops;
      if (crops.isNotEmpty) {
        _selectedCropLinked = crops.first.cropName;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _priceController.dispose();
    _stockController.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      final price = double.tryParse(_priceController.text.trim()) ?? 0.0;
      final stock = double.tryParse(_stockController.text.trim()) ?? 0.0;
      final prodId = 'PRD-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}';

      final newProduct = ProductItem(
        id: prodId,
        productName: _nameController.text.trim(),
        category: _selectedCategory,
        cropLinked: _selectedCropLinked,
        grade: _selectedGrade,
        unit: _selectedUnit,
        pricePerUnit: price,
        stockQuantity: stock,
        status: _selectedStatus,
      );

      FarmerState().addProduct(newProduct);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('उत्पादन "${newProduct.productName}" यशस्वीरीत्या जोडले गेले!'),
          backgroundColor: AppColors.primary,
        ),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final crops = FarmerState().crops;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Add Product (नवीन उत्पादन जोडा)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
                    const Text(
                      'Basic Information (उत्पादनाचा तपशील)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 14),

                    // Product Name
                    const Text('Product Title (उत्पादनाचे नाव)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _nameController,
                      decoration: _inputDecoration(hint: 'उदा. Fresh Hybrid Tomatoes (Grade A)'),
                      validator: (val) => val == null || val.trim().isEmpty ? 'कृपया नाव टाका' : null,
                    ),
                    const SizedBox(height: 14),

                    // Category
                    const Text('Category (प्रवर्ग)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _selectedCategory,
                      decoration: _inputDecoration(),
                      items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 13)))).toList(),
                      onChanged: (val) => setState(() => _selectedCategory = val!),
                    ),
                    const SizedBox(height: 14),

                    // Link to Farm Crop
                    if (crops.isNotEmpty) ...[
                      const Text('Link to My Crop (पिकाशी जोडा)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        value: _selectedCropLinked.isNotEmpty ? _selectedCropLinked : crops.first.cropName,
                        decoration: _inputDecoration(),
                        items: crops.map((c) => DropdownMenuItem(value: c.cropName, child: Text('${c.cropName} (${c.variety})', style: const TextStyle(fontSize: 13)))).toList(),
                        onChanged: (val) => setState(() => _selectedCropLinked = val!),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Quality Grade
                    const Text('Quality Grade (प्रतवारी)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Row(
                      children: FarmerConstants.productGrades.map((g) {
                        final isSelected = _selectedGrade == g;
                        Color chipColor = g == 'Grade A' ? AppColors.success : (g == 'Grade B' ? AppColors.info : AppColors.warning);

                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(g, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : chipColor, fontWeight: FontWeight.bold)),
                            selected: isSelected,
                            selectedColor: chipColor,
                            backgroundColor: Colors.white,
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
              ),
              const SizedBox(height: 16),

              // Pricing & Stock
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
                    const Text(
                      'Pricing & Stock (दर व उपलब्ध साठा)',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 14),

                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Unit Price (दर प्रति युनिट)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              TextFormField(
                                controller: _priceController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: _inputDecoration(hint: 'उदा. ₹ 25'),
                                validator: (val) => val == null || double.tryParse(val) == null ? 'योग्य दर टाका' : null,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Unit (एकक)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              DropdownButtonFormField<String>(
                                value: _selectedUnit,
                                decoration: _inputDecoration(),
                                items: FarmerConstants.productUnits.map((u) => DropdownMenuItem(value: u, child: Text(u, style: const TextStyle(fontSize: 13)))).toList(),
                                onChanged: (val) => setState(() => _selectedUnit = val!),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    const Text('Available Stock Quantity (उपलब्ध साठा)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _stockController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: _inputDecoration(hint: 'उदा. 500 (Kg/Quintal)'),
                      validator: (val) => val == null || double.tryParse(val) == null ? 'योग्य प्रमाण टाका' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: SafeArea(
          top: false,
          child: SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _submit,
              child: const Text('Publish Product (उत्पादन विक्रीसाठी जोडा)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
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
