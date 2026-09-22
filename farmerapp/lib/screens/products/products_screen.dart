import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import 'add_product_screen.dart';
import '../main_shell.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  String _selectedGradeFilter = 'All';
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final allProducts = FarmerState().products;
        final products = allProducts.where((p) {
          final matchesGrade = _selectedGradeFilter == 'All' || p.grade == _selectedGradeFilter;
          final matchesSearch = _searchQuery.isEmpty ||
              p.productName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              p.category.toLowerCase().contains(_searchQuery.toLowerCase());
          return matchesGrade && matchesSearch;
        }).toList();

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text('My Products (माझी उत्पादने)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          floatingActionButton: FloatingActionButton.extended(
            heroTag: null,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.add),
            label: const Text('Add Product', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
            },
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Search Box
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Search product (उदा. Tomato, Brinjal)...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.muted),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val),
                ),
                const SizedBox(height: 12),

                // Grade Filter Chips
                Row(
                  children: ['All', 'Grade A', 'Grade B', 'Grade C'].map((grade) {
                    final isSelected = _selectedGradeFilter == grade;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(grade, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppColors.text)),
                        selected: isSelected,
                        selectedColor: AppColors.primary,
                        backgroundColor: Colors.white,
                        side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedGradeFilter = grade);
                        },
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),

                Text(
                  'Products for Sale (${products.length})',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                ),
                const SizedBox(height: 10),

                if (products.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: Column(
                      children: [
                        const Icon(Icons.inventory_2_outlined, size: 40, color: AppColors.muted),
                        const SizedBox(height: 8),
                        const Text('कोणतेही उत्पादन सापडले नाही', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen())),
                          child: const Text('Add Product Now'),
                        ),
                      ],
                    ),
                  )
                else
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: products.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return _ProductCard(product: product);
                    },
                  ),
                const SizedBox(height: 60),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ProductCard extends StatelessWidget {
  final ProductItem product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    Color gradeColor;
    Color gradeText;
    if (product.grade == 'Grade A') {
      gradeColor = AppColors.gradeAHead;
      gradeText = AppColors.gradeAText;
    } else if (product.grade == 'Grade B') {
      gradeColor = AppColors.gradeBHead;
      gradeText = AppColors.gradeBText;
    } else {
      gradeColor = AppColors.gradeCHead;
      gradeText = AppColors.gradeCText;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.productName,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 2),
                    Text('${product.category} • Linked: ${product.cropLinked}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: gradeColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  product.grade,
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: gradeText),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('दर (Price)', style: TextStyle(fontSize: 10, color: AppColors.muted)),
                  Text(
                    '₹ ${product.pricePerUnit.toStringAsFixed(0)} / ${product.unit}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('उपलब्ध साठा (Stock)', style: TextStyle(fontSize: 10, color: AppColors.muted)),
                  Text(
                    '${product.stockQuantity.toStringAsFixed(0)} ${product.unit}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.text),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 6),
                  Text(product.status, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
                ],
              ),
              TextButton.icon(
                style: TextButton.styleFrom(padding: EdgeInsets.zero),
                icon: const Icon(Icons.edit, size: 14, color: AppColors.primary),
                label: const Text('साठा बदला (Update Stock)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary)),
                onPressed: () => _showUpdateStockDialog(context, product),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showUpdateStockDialog(BuildContext context, ProductItem product) {
    final controller = TextEditingController(text: product.stockQuantity.toStringAsFixed(0));
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text('${product.productName} साठा'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('नवीन उपलब्ध साठा प्रविष्ट करा:', style: TextStyle(fontSize: 12)),
              const SizedBox(height: 8),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  suffixText: product.unit,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('रद्द करा')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
              onPressed: () {
                final newStock = double.tryParse(controller.text.trim()) ?? product.stockQuantity;
                FarmerState().updateProductStock(product.id, newStock);
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('साठा यशस्वीरीत्या अपडेट झाला!')),
                );
              },
              child: const Text('सेव्ह करा'),
            ),
          ],
        );
      },
    );
  }
}
