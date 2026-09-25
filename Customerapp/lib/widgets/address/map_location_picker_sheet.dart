import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../../core/providers/app_providers.dart';

Future<Map<String, dynamic>?> showMapLocationPickerSheet(
  BuildContext context,
  WidgetRef ref,
) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const MapLocationPickerSheetContent(),
  );
}

class MapLocationPickerSheetContent extends ConsumerStatefulWidget {
  const MapLocationPickerSheetContent({super.key});

  @override
  ConsumerState<MapLocationPickerSheetContent> createState() =>
      _MapLocationPickerSheetContentState();
}

class _MapLocationPickerSheetContentState
    extends ConsumerState<MapLocationPickerSheetContent> {
  final _searchController = TextEditingController();
  String _searchQuery = '';
  List<String> _searchResults = [];
  bool _searching = false;

  Map<String, dynamic> _selectedLocation = {
    'lat': 18.5912,
    'lng': 73.7389,
    'city': 'Pune',
    'state': 'Maharashtra',
    'area': 'Hinjawadi Phase 2',
    'pincode': '411057',
    'address':
        'Geras Imperium Rise Plaza, Rajiv Gandhi Infotech Park, Hinjawadi Phase 2, Pune, Maharashtra 411057',
    'landmark': 'Hinjawadi Phase 2',
  };

  final List<Map<String, dynamic>> _popularLocations = [
    {
      'lat': 18.5912,
      'lng': 73.7389,
      'city': 'Pune',
      'state': 'Maharashtra',
      'area': 'Hinjawadi Phase 2',
      'pincode': '411057',
      'address': 'Rajiv Gandhi Infotech Park, Hinjawadi Phase 2, Pune',
      'landmark': 'Phase 2 Tech Park',
    },
    {
      'lat': 18.5590,
      'lng': 73.7868,
      'city': 'Pune',
      'state': 'Maharashtra',
      'area': 'Aundh',
      'pincode': '411007',
      'address': 'ITI Road, Parihar Chowk, Aundh, Pune',
      'landmark': 'Parihar Chowk',
    },
    {
      'lat': 18.5679,
      'lng': 73.7715,
      'city': 'Pune',
      'state': 'Maharashtra',
      'area': 'Baner',
      'pincode': '411045',
      'address': 'Baner Road, High Street, Baner, Pune',
      'landmark': 'Baner High Street',
    },
    {
      'lat': 19.0760,
      'lng': 72.8777,
      'city': 'Mumbai',
      'state': 'Maharashtra',
      'area': 'Bandra West',
      'pincode': '400050',
      'address': 'Linking Road, Bandra West, Mumbai',
      'landmark': 'Linking Road',
    },
    {
      'lat': 12.9716,
      'lng': 77.5946,
      'city': 'Bengaluru',
      'state': 'Karnataka',
      'area': 'Indiranagar',
      'pincode': '560038',
      'address': '100 Feet Road, Indiranagar, Bengaluru',
      'landmark': '100 Feet Road',
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String val) async {
    setState(() {
      _searchQuery = val.trim();
      _searching = true;
    });

    if (_searchQuery.isEmpty) {
      setState(() {
        _searchResults = [];
        _searching = false;
      });
      return;
    }

    try {
      final res = await ref.read(apiServiceProvider).fetchLocationPincodes(
            state: 'Maharashtra',
            city: 'Pune',
            q: _searchQuery,
          );
      if (!mounted) return;
      setState(() {
        _searchResults = res;
        _searching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _searching = false);
    }
  }

  void _selectSearchResult(String pincode) async {
    try {
      final data =
          await ref.read(apiServiceProvider).fetchLocationByPincode(pincode);
      if (data != null && mounted) {
        setState(() {
          _selectedLocation = {
            'lat': 18.5204,
            'lng': 73.8567,
            'city': data['city'] ?? 'Pune',
            'state': data['state'] ?? 'Maharashtra',
            'area': _searchQuery.isNotEmpty ? _searchQuery : 'City Center',
            'pincode': pincode,
            'address': '${_searchQuery.isNotEmpty ? "$_searchQuery, " : ""}${data['city']}, ${data['state']} $pincode',
            'landmark': _searchQuery.isNotEmpty ? _searchQuery : 'Main Road',
          };
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxSheetHeight = mediaQuery.size.height * 0.85;

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        Positioned(
          top: -50,
          child: GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4)),
                ],
              ),
              child: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
            ),
          ),
        ),

        Container(
          constraints: BoxConstraints(maxHeight: maxSheetHeight),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.map_outlined, color: Color(0xFF2563EB), size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Choose Location on Map',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: 'Search area, street name or pincode...',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        fontSize: 13.5,
                        color: const Color(0xFF94A3B8),
                      ),
                      prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 21),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    if (_searchQuery.isNotEmpty && _searchResults.isNotEmpty) ...[
                      Text(
                        'Search Results',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      ..._searchResults.map(
                        (pincode) => ListTile(
                          dense: true,
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.location_on_outlined, color: Color(0xFF2563EB)),
                          title: Text('Pincode $pincode', style: const TextStyle(fontWeight: FontWeight.w600)),
                          onTap: () => _selectSearchResult(pincode),
                        ),
                      ),
                      const Divider(height: 24),
                    ],

                    Text(
                      'Select Location',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._popularLocations.map((loc) {
                      final isSelected = loc['area'] == _selectedLocation['area'] &&
                          loc['city'] == _selectedLocation['city'];

                      return InkWell(
                        onTap: () => setState(() => _selectedLocation = loc),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFEFF6FF) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF94A3B8),
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${loc['area']}, ${loc['city']}',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    Text(
                                      loc['address'].toString(),
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 12,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle_rounded, color: Color(0xFF2563EB), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Selected: ${_selectedLocation['area']}, ${_selectedLocation['city']} (${_selectedLocation['pincode']})',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () => Navigator.of(context).pop(_selectedLocation),
                        icon: const Icon(Icons.check_rounded, color: Colors.white),
                        label: Text(
                          'Confirm Location',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
