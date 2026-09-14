import 'package:flutter/material.dart';

import '../../config/theme.dart';
import '../../core/utils/product_utils.dart';

/// Compact brand + sort bar matching website `ProductFiltersBar`.
class ProductFiltersBar extends StatelessWidget {
  const ProductFiltersBar({
    super.key,
    required this.brands,
    required this.selectedBrand,
    required this.sortBy,
    required this.onBrandChange,
    required this.onSortChange,
    this.onClear,
    this.hasActiveFilters = false,
    this.showBrand = true,
    this.showSort = true,
  });

  final List<String> brands;
  final String selectedBrand;
  final ProductSortOption sortBy;
  final ValueChanged<String> onBrandChange;
  final ValueChanged<ProductSortOption> onSortChange;
  final VoidCallback? onClear;
  final bool hasActiveFilters;
  final bool showBrand;
  final bool showSort;

  @override
  Widget build(BuildContext context) {
    final listingSort = ProductSortOption.listingOptions.contains(sortBy)
        ? sortBy
        : ProductSortOption.listingDefault;
    final brandValue =
        selectedBrand.isEmpty || brands.contains(selectedBrand) ? selectedBrand : '';

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(12, 6, 12, 8),
      child: Row(
        children: [
          if (showBrand) ...[
            Expanded(
              child: _FilterDropdown<String>(
                value: brandValue,
                hint: 'All brands',
                items: [
                  const DropdownMenuItem(value: '', child: Text('All brands')),
                  ...brands.map(
                    (brand) => DropdownMenuItem(
                      value: brand,
                      child: Text(brand, overflow: TextOverflow.ellipsis),
                    ),
                  ),
                ],
                onChanged: (value) => onBrandChange(value ?? ''),
              ),
            ),
            const SizedBox(width: 8),
          ],
          if (showSort) ...[
            Expanded(
              child: _FilterDropdown<ProductSortOption>(
                value: listingSort,
                items: ProductSortOption.listingOptions
                    .map(
                      (option) => DropdownMenuItem(
                        value: option,
                        child: Text(
                          option.label,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  if (value != null) onSortChange(value);
                },
              ),
            ),
          ],
          if (hasActiveFilters && onClear != null) ...[
            const SizedBox(width: 8),
            SizedBox(
              height: 36,
              child: OutlinedButton(
                onPressed: onClear,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  foregroundColor: AppColors.textSecondary,
                  side: const BorderSide(color: AppColors.borderLight),
                  textStyle: const TextStyle(
                    inherit: false,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                child: const Text('Clear'),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.value,
    required this.items,
    required this.onChanged,
    this.hint,
  });

  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? hint;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 36,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          isExpanded: true,
          value: value,
          hint: hint != null
              ? Text(
                  hint!,
                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                )
              : null,
          style: const TextStyle(
            fontSize: 12,
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
          ),
          icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 18),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }
}
