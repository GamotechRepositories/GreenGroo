import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

typedef ProductFilterApply = void Function({
  String? brand,
  String? minPrice,
  String? maxPrice,
});

class ProductFilterSheet extends StatefulWidget {
  const ProductFilterSheet({
    super.key,
    required this.brands,
    this.currentBrand,
    this.currentMinPrice,
    this.currentMaxPrice,
    required this.onApply,
    required this.onClear,
  });

  final List<String> brands;
  final String? currentBrand;
  final String? currentMinPrice;
  final String? currentMaxPrice;
  final ProductFilterApply onApply;
  final VoidCallback onClear;

  @override
  State<ProductFilterSheet> createState() => _ProductFilterSheetState();
}

class _ProductFilterSheetState extends State<ProductFilterSheet> {
  late String? _brand;
  late final TextEditingController _minController;
  late final TextEditingController _maxController;

  @override
  void initState() {
    super.initState();
    _brand = widget.currentBrand?.isNotEmpty == true ? widget.currentBrand : null;
    _minController = TextEditingController(text: widget.currentMinPrice ?? '');
    _maxController = TextEditingController(text: widget.currentMaxPrice ?? '');
  }

  @override
  void dispose() {
    _minController.dispose();
    _maxController.dispose();
    super.dispose();
  }

  void _apply() {
    widget.onApply(
      brand: _brand,
      minPrice: _minController.text.trim().isEmpty ? null : _minController.text.trim(),
      maxPrice: _maxController.text.trim().isEmpty ? null : _maxController.text.trim(),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final hasFilters = (_brand != null && _brand!.isNotEmpty) ||
        _minController.text.trim().isNotEmpty ||
        _maxController.text.trim().isNotEmpty;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Filter products',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                  if (hasFilters)
                    TextButton(
                      onPressed: () {
                        widget.onClear();
                        Navigator.pop(context);
                      },
                      child: const Text('Clear all'),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                initialValue: _brand,
                decoration: const InputDecoration(
                  labelText: 'Brand',
                  filled: true,
                  fillColor: Colors.white,
                ),
                items: [
                  const DropdownMenuItem<String?>(value: null, child: Text('All brands')),
                  ...widget.brands.map(
                    (brand) => DropdownMenuItem<String?>(value: brand, child: Text(brand)),
                  ),
                ],
                onChanged: (value) => setState(() => _brand = value),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _minController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(
                        labelText: 'Min price (₹)',
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _maxController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      decoration: const InputDecoration(
                        labelText: 'Max price (₹)',
                        filled: true,
                        fillColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _apply,
                child: const Text('Apply filters'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
