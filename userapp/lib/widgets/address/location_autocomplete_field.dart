import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../config/theme.dart';

class LocationAutocompleteField extends StatefulWidget {
  const LocationAutocompleteField({
    super.key,
    required this.controller,
    required this.hint,
    required this.fetchSuggestions,
    this.enabled = true,
    this.keyboardType,
    this.maxLength,
    this.inputFormatters,
    this.onSelected,
  });

  final TextEditingController controller;
  final String hint;
  final Future<List<String>> Function(String query) fetchSuggestions;
  final bool enabled;
  final TextInputType? keyboardType;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onSelected;

  @override
  State<LocationAutocompleteField> createState() => _LocationAutocompleteFieldState();
}

class _LocationAutocompleteFieldState extends State<LocationAutocompleteField> {
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  List<String> _suggestions = [];
  bool _loading = false;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _removeOverlay();
    super.dispose();
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  Future<void> _loadSuggestions(String query) async {
    if (!widget.enabled) return;

    setState(() => _loading = true);
    try {
      final items = await widget.fetchSuggestions(query);
      if (!mounted) return;
      setState(() {
        _suggestions = items;
        _loading = false;
      });
      _showOverlay();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _suggestions = const [];
        _loading = false;
      });
      _showOverlay();
    }
  }

  void _scheduleLoad(String query) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 200), () {
      _loadSuggestions(query);
    });
  }

  void _showOverlay() {
    _removeOverlay();

    final overlay = Overlay.of(context);
    if (overlay == null) return;

    final renderBox = context.findRenderObject() as RenderBox?;
    final width = renderBox?.size.width ?? MediaQuery.of(context).size.width;

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: width,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, 52),
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(8),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 240),
              child: _loading
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: Text('Loading...', style: TextStyle(fontSize: 12)),
                    )
                  : _suggestions.isEmpty
                      ? const Padding(
                          padding: EdgeInsets.all(12),
                          child: Text('No suggestions found', style: TextStyle(fontSize: 12)),
                        )
                      : ListView.builder(
                          padding: EdgeInsets.zero,
                          shrinkWrap: true,
                          itemCount: _suggestions.length,
                          itemBuilder: (context, index) {
                            final item = _suggestions[index];
                            return ListTile(
                              dense: true,
                              title: Text(item, style: const TextStyle(fontSize: 14)),
                              onTap: () {
                                widget.controller.text = item;
                                widget.onSelected?.call(item);
                                _removeOverlay();
                              },
                            );
                          },
                        ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(_overlayEntry!);
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: TextField(
        controller: widget.controller,
        enabled: widget.enabled,
        keyboardType: widget.keyboardType,
        maxLength: widget.maxLength,
        inputFormatters: widget.inputFormatters,
        decoration: InputDecoration(
          hintText: widget.hint,
          counterText: '',
          filled: true,
          fillColor: widget.enabled ? Colors.white : Colors.grey.shade50,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.borderLight),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.borderLight),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.primary),
          ),
        ),
        onTap: () {
          if (!widget.enabled) return;
          _scheduleLoad(widget.controller.text);
        },
        onChanged: (value) {
          if (!widget.enabled) return;
          _scheduleLoad(value);
        },
        onEditingComplete: _removeOverlay,
      ),
    );
  }
}
