import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../config/theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/utils/address_utils.dart';
import 'location_autocomplete_field.dart';

const addressFormDefaults = <String, String>{
  'fullName': '',
  'number': '',
  'email': '',
  'shopNo': '',
  'shopName': '',
  'fullAddress': '',
  'landmark': '',
  'city': '',
  'state': '',
  'pincode': '',
};

class AddressForm extends ConsumerStatefulWidget {
  const AddressForm({
    super.key,
    this.initial,
    required this.onSubmit,
    required this.onCancel,
    this.submitting = false,
    this.plain = false,
  });

  final Map<String, String>? initial;
  final ValueChanged<Map<String, String>> onSubmit;
  final VoidCallback onCancel;
  final bool submitting;
  final bool plain;

  @override
  ConsumerState<AddressForm> createState() => _AddressFormState();
}

class _AddressFormState extends ConsumerState<AddressForm> {
  late final Map<String, TextEditingController> _controllers;
  String? _validationError;

  @override
  void initState() {
    super.initState();
    final initial = widget.initial ?? addressFormDefaults;
    _controllers = {
      for (final key in addressFormDefaults.keys)
        key: TextEditingController(text: initial[key] ?? ''),
    };
    _controllers['pincode']!.addListener(_onPincodeChanged);
  }

  void _onPincodeChanged() {
    final pincode = _controllers['pincode']!.text.trim();
    if (pincode.length == 6) {
      _handlePincodeSelected(pincode);
    }
  }

  @override
  void dispose() {
    _controllers['pincode']!.removeListener(_onPincodeChanged);
    for (final controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Map<String, String> _currentForm() {
    return {
      for (final entry in _controllers.entries)
        entry.key: entry.value.text.trim(),
    };
  }

  void _clearCityAndPincode() {
    _controllers['city']!.text = '';
    _controllers['pincode']!.text = '';
  }

  void _clearPincode() {
    _controllers['pincode']!.text = '';
  }

  Future<void> _handlePincodeSelected(String value) async {
    final pincode = value.replaceAll(RegExp(r'\D'), '').substring(
          0,
          value.length.clamp(0, 6),
        );
    _controllers['pincode']!.text = pincode;

    if (pincode.length != 6) return;

    try {
      final result =
          await ref.read(apiServiceProvider).fetchLocationByPincode(pincode);
      if (!mounted || result == null) return;
      if ((result['state'] ?? '').isNotEmpty) {
        _controllers['state']!.text = result['state']!;
      }
      if ((result['city'] ?? '').isNotEmpty) {
        _controllers['city']!.text = result['city']!;
      }
    } catch (_) {
      // keep typed pincode
    }
  }

  void _handleSubmit() {
    final form = _currentForm();
    final error = validateAddressForm(form);
    if (error != null) {
      setState(() => _validationError = error);
      return;
    }
    widget.onSubmit(form);
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiServiceProvider);
    final stateValue = _controllers['state']!.text.trim();
    final cityValue = _controllers['city']!.text.trim();

    final formContent = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_validationError != null) ...[
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              _validationError!,
              style: TextStyle(color: Colors.red.shade700, fontSize: 13),
            ),
          ),
          const SizedBox(height: 12),
        ],
        Row(
          children: [
            Expanded(child: _field('fullName', 'Full name')),
            const SizedBox(width: 12),
            Expanded(
              child: _field(
                'number',
                'Number',
                keyboardType: TextInputType.phone,
                maxLength: 10,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _field('email', 'Email ID', keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _field('shopNo', 'Shop no.')),
            const SizedBox(width: 12),
            Expanded(child: _field('shopName', 'Shop name')),
          ],
        ),
        const SizedBox(height: 12),
        _field('fullAddress', 'Full address', maxLines: 2),
        const SizedBox(height: 12),
        _field('landmark', 'Landmark'),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: LocationAutocompleteField(
                controller: _controllers['state']!,
                hint: 'State',
                fetchSuggestions: (query) => api.fetchLocationStates(q: query),
                onSelected: (_) => setState(_clearCityAndPincode),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: LocationAutocompleteField(
                controller: _controllers['city']!,
                hint: stateValue.isEmpty ? 'Select state first' : 'City',
                enabled: stateValue.isNotEmpty,
                fetchSuggestions: (query) => api.fetchLocationCities(
                  state: _controllers['state']!.text.trim(),
                  q: query,
                ),
                onSelected: (_) => setState(_clearPincode),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: LocationAutocompleteField(
                controller: _controllers['pincode']!,
                hint: cityValue.isEmpty ? 'Select city first' : 'Pincode',
                enabled: stateValue.isNotEmpty && cityValue.isNotEmpty,
                keyboardType: TextInputType.number,
                maxLength: 6,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                fetchSuggestions: (query) => api.fetchLocationPincodes(
                  state: _controllers['state']!.text.trim(),
                  city: _controllers['city']!.text.trim(),
                  q: query,
                ),
                onSelected: _handlePincodeSelected,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            TextButton(onPressed: widget.onCancel, child: const Text('Cancel')),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: widget.submitting ? null : _handleSubmit,
              child: Text(widget.submitting ? 'Saving...' : 'Save Address'),
            ),
          ],
        ),
      ],
    );

    if (widget.plain) return formContent;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: formContent,
    );
  }

  Widget _field(
    String name,
    String hint, {
    TextInputType? keyboardType,
    int maxLines = 1,
    int? maxLength,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextField(
      controller: _controllers[name],
      keyboardType: keyboardType,
      maxLines: maxLines,
      maxLength: maxLength,
      inputFormatters: inputFormatters,
      decoration: InputDecoration(
        hintText: hint,
        counterText: '',
        filled: true,
        fillColor: Colors.white,
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
      onChanged: (_) {
        if (_validationError != null) {
          setState(() => _validationError = null);
        }
      },
    );
  }
}
