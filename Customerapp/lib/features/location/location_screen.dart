import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../widgets/address/location_autocomplete_field.dart';

class LocationScreen extends ConsumerStatefulWidget {
  const LocationScreen({super.key});

  @override
  ConsumerState<LocationScreen> createState() => _LocationScreenState();
}

class _LocationScreenState extends ConsumerState<LocationScreen> {
  final _stateController = TextEditingController();
  final _cityController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _areaController = TextEditingController();

  String? _error;
  final bool _loading = false;

  @override
  void dispose() {
    _stateController.dispose();
    _cityController.dispose();
    _pincodeController.dispose();
    _areaController.dispose();
    super.dispose();
  }

  Future<void> _handleSaveLocation() async {
    final state = _stateController.text.trim();
    final city = _cityController.text.trim();
    final pincode = _pincodeController.text.trim();
    final area = _areaController.text.trim();

    if (city.isEmpty && pincode.isEmpty) {
      setState(() => _error = 'Please enter city or pincode');
      return;
    }

    final newLoc = DeliveryLocation(
      state: state,
      city: city,
      pincode: pincode,
      area: area,
      label: [area, city, pincode].where((e) => e.isNotEmpty).join(', '),
    );

    await ref.read(deliveryLocationProvider.notifier).setLocation(newLoc);
    ref.invalidate(nearestStoreProvider);

    if (mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final api = ref.read(apiServiceProvider);
    final stateValue = _stateController.text.trim();
    final cityValue = _cityController.text.trim();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Select Delivery Location',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w800,
          ),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF111827),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _error!,
                  style: TextStyle(color: Colors.red.shade800, fontSize: 13),
                ),
              ),
              const SizedBox(height: 16),
            ],

            Text(
              'Enter location details to check stock at your nearest dark store',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF6B7280),
              ),
            ),
            const SizedBox(height: 20),

            // Area / Street
            TextField(
              controller: _areaController,
              decoration: InputDecoration(
                hintText: 'Area / Locality (e.g. Balewadi)',
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // State Autocomplete
            LocationAutocompleteField(
              controller: _stateController,
              hint: 'State (e.g. Maharashtra)',
              fetchSuggestions: (q) => api.fetchLocationStates(q: q),
              onSelected: (_) => setState(() {
                _cityController.text = '';
                _pincodeController.text = '';
              }),
            ),
            const SizedBox(height: 14),

            // City Autocomplete
            LocationAutocompleteField(
              controller: _cityController,
              hint: stateValue.isEmpty ? 'Select state first' : 'City (e.g. Pune)',
              enabled: stateValue.isNotEmpty,
              fetchSuggestions: (q) => api.fetchLocationCities(
                state: stateValue,
                q: q,
              ),
              onSelected: (_) => setState(() {
                _pincodeController.text = '';
              }),
            ),
            const SizedBox(height: 14),

            // Pincode Autocomplete
            LocationAutocompleteField(
              controller: _pincodeController,
              hint: cityValue.isEmpty ? 'Select city first' : 'Pincode (e.g. 411045)',
              enabled: stateValue.isNotEmpty && cityValue.isNotEmpty,
              keyboardType: TextInputType.number,
              maxLength: 6,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              fetchSuggestions: (q) => api.fetchLocationPincodes(
                state: stateValue,
                city: cityValue,
                q: q,
              ),
              onSelected: (pincode) async {
                final locData = await api.fetchLocationByPincode(pincode);
                if (locData != null && mounted) {
                  setState(() {
                    _cityController.text = locData['city'] ?? cityValue;
                    _stateController.text = locData['state'] ?? stateValue;
                  });
                }
              },
            ),
            const SizedBox(height: 24),

            ElevatedButton(
              onPressed: _loading ? null : _handleSaveLocation,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0C831F),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                'Set Delivery Location',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
