import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../core/utils/detect_current_location.dart';

Future<Map<String, dynamic>?> showMapLocationPickerSheet(
  BuildContext context,
  WidgetRef ref, {
  Map<String, dynamic>? initialLocation,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => MapLocationPickerSheetContent(initialLocation: initialLocation),
  );
}

class MapLocationPickerSheetContent extends ConsumerStatefulWidget {
  const MapLocationPickerSheetContent({super.key, this.initialLocation});

  final Map<String, dynamic>? initialLocation;

  @override
  ConsumerState<MapLocationPickerSheetContent> createState() =>
      _MapLocationPickerSheetContentState();
}

class _MapLocationPickerSheetContentState
    extends ConsumerState<MapLocationPickerSheetContent> {
  int _gpsSeq = 0;
  final _searchController = TextEditingController();
  String _searchQuery = '';
  List<String> _searchResults = [];
  bool _searching = false;
  bool _detectingGps = false;

  Map<String, dynamic> _selectedLocation = {};

  final List<Map<String, dynamic>> _popularLocations = [
    {
      'lat': 18.5685,
      'lng': 73.7542,
      'city': 'Pune',
      'state': 'Maharashtra',
      'area': 'Mahalunge',
      'pincode': '411045',
      'address': 'Mahalunge High Street, Mahalunge, Pune, Maharashtra 411045',
      'landmark': 'Mahalunge',
    },
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
      'lat': 18.5987,
      'lng': 73.7687,
      'city': 'Pune',
      'state': 'Maharashtra',
      'area': 'Wakad',
      'pincode': '411057',
      'address': 'Datta Mandir Road, Wakad, Pune',
      'landmark': 'Wakad Chowk',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialLocation != null && widget.initialLocation!.isNotEmpty) {
      _selectedLocation = Map<String, dynamic>.from(widget.initialLocation!);
    } else {
      final loc = ref.read(deliveryLocationProvider);
      if (loc != null) {
        _selectedLocation = {
          if (loc.latitude != null) 'lat': loc.latitude,
          if (loc.longitude != null) 'lng': loc.longitude,
          'city': loc.city ?? '',
          'state': loc.state ?? '',
          'area': loc.area ?? '',
          'pincode': loc.pincode ?? '',
          'address': loc.address ?? loc.displayAddress,
          'landmark': loc.area ?? '',
        };
      } else {
        _selectedLocation = Map<String, dynamic>.from(_popularLocations.first);
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _detectCurrentGPS() async {
    final seq = ++_gpsSeq;
    setState(() => _detectingGps = true);
    try {
      final detected = await detectPhoneLocation(ref.read(apiServiceProvider));
      if (!mounted || seq != _gpsSeq) return;
      setState(() {
        _selectedLocation = {
          'lat': detected.latitude,
          'lng': detected.longitude,
          'city': detected.city,
          'state': detected.state,
          'area': detected.area,
          'pincode': detected.pincode,
          'address': detected.address.isNotEmpty ? detected.address : detected.displayLine,
          'landmark': detected.area,
        };
        _detectingGps = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Detected: ${detected.displayLine}'),
          backgroundColor: const Color(0xFF047857),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    } on PhoneLocationException catch (e) {
      if (!mounted || seq != _gpsSeq) return;
      setState(() => _detectingGps = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted || seq != _gpsSeq) return;
      setState(() => _detectingGps = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not detect your current location.')),
      );
    }
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
    _gpsSeq++;
    try {
      final data =
          await ref.read(apiServiceProvider).fetchLocationByPincode(pincode);
      if (data != null && mounted) {
        setState(() {
          _selectedLocation = {
            'city': data['city'] ?? 'Pune',
            'state': data['state'] ?? 'Maharashtra',
            'area': _searchQuery.isNotEmpty ? _searchQuery : 'Pune',
            'pincode': pincode,
            'address': '${_searchQuery.isNotEmpty ? "$_searchQuery, " : ""}${data['city']}, ${data['state']} $pincode',
            'landmark': _searchQuery.isNotEmpty ? _searchQuery : '',
          };
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final maxSheetHeight = mediaQuery.size.height * 0.85;

    final selectedArea = _selectedLocation['area']?.toString() ?? '';
    final selectedCity = _selectedLocation['city']?.toString() ?? '';
    final selectedPin = _selectedLocation['pincode']?.toString() ?? '';

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
                        const Icon(Icons.map_outlined, color: AppColors.primary, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          'Choose Delivery Location',
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

              // Use Current Location GPS button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: InkWell(
                  onTap: _detectingGps ? null : _detectCurrentGPS,
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                    decoration: BoxDecoration(
                      color: const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFA7F3D0)),
                    ),
                    child: Row(
                      children: [
                        if (_detectingGps)
                          const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                          )
                        else
                          const Icon(Icons.my_location_rounded, color: AppColors.primary, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            _detectingGps ? 'Detecting current GPS location...' : 'Use current location (GPS)',
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF047857),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 10),

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
                      prefixIcon: _searching
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                              ),
                            )
                          : const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 21),
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
                          leading: const Icon(Icons.location_on_outlined, color: AppColors.primary),
                          title: Text('Pincode $pincode', style: const TextStyle(fontWeight: FontWeight.w600)),
                          onTap: () => _selectSearchResult(pincode),
                        ),
                      ),
                      const Divider(height: 24),
                    ],

                    Text(
                      'Common Localities',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._popularLocations.map((loc) {
                      final isSelected = loc['area'] == selectedArea &&
                          loc['pincode'] == selectedPin;

                      return InkWell(
                        onTap: () {
                          _gpsSeq++;
                          setState(() => _selectedLocation = Map<String, dynamic>.from(loc));
                        },
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFECFDF5) : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected ? AppColors.primary : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.5 : 1.0,
                            ),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
                                color: isSelected ? AppColors.primary : const Color(0xFF94A3B8),
                                size: 20,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${loc['area']}, ${loc['city']} (${loc['pincode']})',
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
                        const Icon(Icons.check_circle_rounded, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedArea.isNotEmpty
                                ? 'Selected: $selectedArea, $selectedCity ($selectedPin)'
                                : 'No location selected',
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
                        onPressed: selectedArea.isNotEmpty
                            ? () => Navigator.of(context).pop(_selectedLocation)
                            : null,
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
                          backgroundColor: AppColors.primary,
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
