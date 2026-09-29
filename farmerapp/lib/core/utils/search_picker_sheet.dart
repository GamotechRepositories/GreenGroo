import 'package:flutter/material.dart';

import '../../services/app_language.dart';
import '../constants/app_colors.dart';

/// Bottom sheet with a search box and a selectable list.
/// Returns the tapped item, or null when dismissed.
Future<T?> showSearchPickerSheet<T>({
  required BuildContext context,
  required String title,
  required List<T> items,
  required String Function(T item) labelOf,
  String Function(T item)? subtitleOf,
  List<String> Function(T item)? searchTermsOf,
  T? selected,
  Widget? footer,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(18))),
    builder: (_) => _SearchPickerSheet<T>(
      title: title,
      items: items,
      labelOf: labelOf,
      subtitleOf: subtitleOf,
      searchTermsOf: searchTermsOf,
      selected: selected,
      footer: footer,
    ),
  );
}

class _SearchPickerSheet<T> extends StatefulWidget {
  final String title;
  final List<T> items;
  final String Function(T item) labelOf;
  final String Function(T item)? subtitleOf;
  final List<String> Function(T item)? searchTermsOf;
  final T? selected;
  final Widget? footer;

  const _SearchPickerSheet({
    required this.title,
    required this.items,
    required this.labelOf,
    this.subtitleOf,
    this.searchTermsOf,
    this.selected,
    this.footer,
  });

  @override
  State<_SearchPickerSheet<T>> createState() => _SearchPickerSheetState<T>();
}

class _SearchPickerSheetState<T> extends State<_SearchPickerSheet<T>> {
  String _query = '';

  List<T> get _filtered {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return widget.items;
    return widget.items.where((item) {
      final terms = widget.searchTermsOf?.call(item) ??
          [widget.labelOf(item), if (widget.subtitleOf != null) widget.subtitleOf!(item)];
      return terms.any((t) => t.toLowerCase().contains(q));
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.78,
      child: Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: const Color(0xFFD1D5DB), borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 8, 4),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryDark),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: TextField(
                onChanged: (v) => setState(() => _query = v),
                style: const TextStyle(fontSize: 13.5),
                decoration: InputDecoration(
                  isDense: true,
                  hintText: AppLanguage().tr(mr: 'शोधा...', en: 'Search...'),
                  prefixIcon: const Icon(Icons.search, size: 18),
                  filled: true,
                  fillColor: const Color(0xFFF3F4F6),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                ),
              ),
            ),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Text(
                        AppLanguage().tr(mr: 'काहीही सापडले नाही', en: 'No results found'),
                        style: const TextStyle(fontSize: 12.5, color: AppColors.muted),
                      ),
                    )
                  : ListView.separated(
                      itemCount: filtered.length,
                      separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFF3F4F6)),
                      itemBuilder: (_, i) {
                        final item = filtered[i];
                        final isSelected = item == widget.selected;
                        return ListTile(
                          dense: true,
                          title: Text(
                            widget.labelOf(item),
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                              color: isSelected ? AppColors.primary : AppColors.text,
                            ),
                          ),
                          subtitle: widget.subtitleOf == null
                              ? null
                              : Text(widget.subtitleOf!(item), style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                          trailing: isSelected ? const Icon(Icons.check_circle, color: AppColors.primary, size: 18) : null,
                          onTap: () => Navigator.pop(context, item),
                        );
                      },
                    ),
            ),
            if (widget.footer != null) ...[
              const Divider(height: 1),
              SafeArea(top: false, child: widget.footer!),
            ],
          ],
        ),
      ),
    );
  }
}
