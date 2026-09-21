import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class ProductsScreen extends StatelessWidget {
  const ProductsScreen({super.key});

  final List<Map<String, dynamic>> _mockProducts = const [
    {
      'name': 'Fresh Brinjal (Pusa Purple)',
      'sku': 'GGC-PRD-BRN-01',
      'category': 'Vegetables',
      'pricePerKg': '₹35.00',
      'availableStock': '250 Kg',
      'grade': 'Grade A',
      'status': 'In Stock',
    },
    {
      'name': 'Hybrid Red Tomatoes',
      'sku': 'GGC-PRD-TOM-02',
      'category': 'Vegetables',
      'pricePerKg': '₹28.00',
      'availableStock': '400 Kg',
      'grade': 'Grade A',
      'status': 'In Stock',
    },
    {
      'name': 'Nashik Red Onions',
      'sku': 'GGC-PRD-ONI-03',
      'category': 'Vegetables',
      'pricePerKg': '₹32.00',
      'availableStock': '650 Kg',
      'grade': 'Grade B',
      'status': 'Low Stock',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Farm Products (शेतमाल)'),
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.add, color: AppColors.primary),
          ),
        ],
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _mockProducts.length,
        separatorBuilder: (_, index) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final product = _mockProducts[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Center(
                    child: Icon(Icons.eco, color: AppColors.primary, size: 28),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              product['name'] as String,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              product['status'] as String,
                              style: const TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'SKU: ${product['sku']} • ${product['category']}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Rate: ${product['pricePerKg']}/Kg',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                          Text(
                            'Stock: ${product['availableStock']}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
