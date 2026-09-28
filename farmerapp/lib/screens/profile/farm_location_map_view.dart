import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import '../../core/constants/app_colors.dart';

/// Representation of a chosen farm location with geocoded details
class FarmGeoLocation {
  final double latitude;
  final double longitude;
  final String village;
  final String taluka;
  final String district;
  final String state;
  final String pincode;
  final String formattedAddress;

  const FarmGeoLocation({
    required this.latitude,
    required this.longitude,
    this.village = '',
    this.taluka = '',
    this.district = '',
    this.state = 'Maharashtra',
    this.pincode = '',
    this.formattedAddress = '',
  });

  String get shortLabel {
    final parts = [village, taluka, district].where((s) => s.isNotEmpty).toList();
    if (parts.isNotEmpty) return parts.join(', ');
    return '${latitude.toStringAsFixed(4)}°, ${longitude.toStringAsFixed(4)}°';
  }
}

/// Slippy map projection utilities
class OsmTileMath {
  static const double tileSize = 256.0;

  static double lngToPixelX(double lng, double zoom) {
    final safeZoom = zoom.clamp(0.0, 18.0);
    final safeLng = lng.clamp(-180.0, 180.0);
    final zFact = tileSize * math.pow(2.0, safeZoom);
    return ((safeLng + 180.0) / 360.0) * zFact;
  }

  static double latToPixelY(double lat, double zoom) {
    final safeZoom = zoom.clamp(0.0, 18.0);
    final zFact = tileSize * math.pow(2.0, safeZoom);
    final clampedLat = lat.clamp(-85.05112878, 85.05112878);
    final latRad = clampedLat * math.pi / 180.0;
    final sinLat = math.sin(latRad).clamp(-0.9999, 0.9999);
    final y = (1.0 - (math.log((1.0 + sinLat) / (1.0 - sinLat)) / (2.0 * math.pi))) / 2.0;
    return y * zFact;
  }

  static double pixelXToLng(double px, double zoom) {
    final safeZoom = zoom.clamp(0.0, 18.0);
    final zFact = tileSize * math.pow(2.0, safeZoom);
    if (zFact <= 0) return 0.0;
    return (px / zFact) * 360.0 - 180.0;
  }

  static double pixelYToLat(double py, double zoom) {
    final safeZoom = zoom.clamp(0.0, 18.0);
    final zFact = tileSize * math.pow(2.0, safeZoom);
    if (zFact <= 0) return 0.0;
    final n = math.pi - (2.0 * math.pi * py) / zFact;
    return (180.0 / math.pi) * math.atan(0.5 * (math.exp(n) - math.exp(-n))).clamp(-85.05112878, 85.05112878);
  }

  static String getTileUrl(int x, int y, int z) {
    final safeZ = z.clamp(0, 18);
    final maxTiles = 1 << safeZ;
    final wrapX = ((x % maxTiles) + maxTiles) % maxTiles;
    final clampY = y.clamp(0, maxTiles - 1);
    final subdomains = ['a', 'b', 'c'];
    final sub = subdomains[(wrapX + clampY).abs() % subdomains.length];
    return 'https://$sub.tile.openstreetmap.org/$safeZ/$wrapX/$clampY.png';
  }
}

/// Interactive OpenStreetMap Canvas View
class InteractiveOsmMap extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final double initialZoom;
  final double height;
  final bool isInteractive;
  final ValueChanged<FarmGeoLocation>? onLocationChanged;
  final VoidCallback? onExpandRequested;

  const InteractiveOsmMap({
    super.key,
    required this.initialLat,
    required this.initialLng,
    this.initialZoom = 15.0,
    this.height = 200.0,
    this.isInteractive = true,
    this.onLocationChanged,
    this.onExpandRequested,
  });

  @override
  State<InteractiveOsmMap> createState() => _InteractiveOsmMapState();
}

class _InteractiveOsmMapState extends State<InteractiveOsmMap> {
  late double _lat;
  late double _lng;
  late double _zoom;
  bool _isDragging = false;
  Timer? _geocodeDebounce;
  bool _isGeocoding = false;

  @override
  void initState() {
    super.initState();
    // Default to Pune (18.5204, 73.8567) if 0
    _lat = (widget.initialLat == 0 && widget.initialLng == 0) ? 18.5204 : widget.initialLat;
    _lng = (widget.initialLat == 0 && widget.initialLng == 0) ? 73.8567 : widget.initialLng;
    _zoom = widget.initialZoom;
    _reverseGeocode(_lat, _lng);
  }

  @override
  void didUpdateWidget(covariant InteractiveOsmMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    if ((widget.initialLat != oldWidget.initialLat || widget.initialLng != oldWidget.initialLng) &&
        (widget.initialLat != 0 || widget.initialLng != 0)) {
      if ((widget.initialLat - _lat).abs() > 0.0001 || (widget.initialLng - _lng).abs() > 0.0001) {
        setState(() {
          _lat = widget.initialLat;
          _lng = widget.initialLng;
        });
        _reverseGeocode(_lat, _lng);
      }
    }
  }

  @override
  void dispose() {
    _geocodeDebounce?.cancel();
    super.dispose();
  }

  void _onPanUpdate(DragUpdateDetails details, Size size) {
    if (!widget.isInteractive) return;
    setState(() {
      _isDragging = true;
      final currentPxX = OsmTileMath.lngToPixelX(_lng, _zoom);
      final currentPxY = OsmTileMath.latToPixelY(_lat, _zoom);

      final nextPxX = currentPxX - details.delta.dx;
      final nextPxY = currentPxY - details.delta.dy;

      _lng = OsmTileMath.pixelXToLng(nextPxX, _zoom).clamp(-180.0, 180.0);
      _lat = OsmTileMath.pixelYToLat(nextPxY, _zoom).clamp(-85.0, 85.0);
    });

    _triggerDebouncedGeocode();
  }

  void _onPanEnd(DragEndDetails details) {
    if (!widget.isInteractive) return;
    setState(() => _isDragging = false);
    _triggerDebouncedGeocode(immediate: true);
  }

  void _triggerDebouncedGeocode({bool immediate = false}) {
    _geocodeDebounce?.cancel();
    if (immediate) {
      _reverseGeocode(_lat, _lng);
    } else {
      _geocodeDebounce = Timer(const Duration(milliseconds: 600), () {
        _reverseGeocode(_lat, _lng);
      });
    }
  }

  Future<void> _reverseGeocode(double lat, double lng) async {
    if (!mounted) return;
    setState(() => _isGeocoding = true);
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=$lat&lon=$lng&addressdetails=1',
      );
      final res = await http.get(uri, headers: {
        'User-Agent': 'GreenGrooFarmerApp/1.0 (contact: info@greengrocc.com)',
      }).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final addr = data['address'] as Map<String, dynamic>? ?? {};

        final village = (addr['village'] ??
                addr['town'] ??
                addr['suburb'] ??
                addr['neighbourhood'] ??
                addr['hamlet'] ??
                addr['city'] ??
                '')
            .toString();

        final taluka = (addr['county'] ??
                addr['subdistrict'] ??
                addr['taluk'] ??
                addr['tehsil'] ??
                '')
            .toString();

        final district = (addr['state_district'] ??
                addr['district'] ??
                addr['city'] ??
                '')
            .toString();

        final state = (addr['state'] ?? 'Maharashtra').toString();
        final pincode = (addr['postcode'] ?? '').toString();
        final display = (data['display_name'] ?? '').toString();

        final geo = FarmGeoLocation(
          latitude: lat,
          longitude: lng,
          village: village,
          taluka: taluka,
          district: district,
          state: state,
          pincode: pincode,
          formattedAddress: display,
        );

        if (mounted) {
          setState(() {
            _isGeocoding = false;
          });
          widget.onLocationChanged?.call(geo);
        }
        return;
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isGeocoding = false);
    }
  }

  void _zoomIn() {
    if (_zoom < 18.0) {
      setState(() => _zoom = (_zoom + 1.0).clamp(6.0, 18.0));
      _triggerDebouncedGeocode();
    }
  }

  void _zoomOut() {
    if (_zoom > 6.0) {
      setState(() => _zoom = (_zoom - 1.0).clamp(6.0, 18.0));
      _triggerDebouncedGeocode();
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final width = (constraints.maxWidth.isFinite && constraints.maxWidth > 0)
          ? constraints.maxWidth
          : 360.0;
      final height = (constraints.maxHeight.isFinite && constraints.maxHeight > 0)
          ? constraints.maxHeight
          : (widget.height.isFinite && widget.height > 0 ? widget.height : 250.0);
      final size = Size(width, height);

      final safeLat = _lat.isFinite ? _lat.clamp(-85.0, 85.0) : 18.5204;
      final safeLng = _lng.isFinite ? _lng.clamp(-180.0, 180.0) : 73.8567;
      final int z = _zoom.floor().clamp(3, 18);

      final currentPxX = OsmTileMath.lngToPixelX(safeLng, z.toDouble());
      final currentPxY = OsmTileMath.latToPixelY(safeLat, z.toDouble());

      if (!currentPxX.isFinite || !currentPxY.isFinite || !width.isFinite || !height.isFinite) {
        return Container(color: const Color(0xFFE2E8F0));
      }

      final startX = currentPxX - (width / 2.0);
      final startY = currentPxY - (height / 2.0);

      final maxTileCount = 1 << z;
      final rawMinTileX = (startX / OsmTileMath.tileSize).floor();
      final rawMaxTileX = ((startX + width) / OsmTileMath.tileSize).floor();
      final rawMinTileY = (startY / OsmTileMath.tileSize).floor();
      final rawMaxTileY = ((startY + height) / OsmTileMath.tileSize).floor();

      final minTileX = rawMinTileX.clamp(-maxTileCount * 2, maxTileCount * 2);
      final maxTileX = rawMaxTileX.clamp(minTileX, minTileX + 8);
      final minTileY = rawMinTileY.clamp(0, maxTileCount - 1);
      final maxTileY = rawMaxTileY.clamp(minTileY, math.min(minTileY + 8, maxTileCount - 1));

      final List<Widget> tileWidgets = [];
      for (int tx = minTileX; tx <= maxTileX; tx++) {
        for (int ty = minTileY; ty <= maxTileY; ty++) {
          final left = (tx * OsmTileMath.tileSize) - startX;
          final top = (ty * OsmTileMath.tileSize) - startY;
          final url = OsmTileMath.getTileUrl(tx, ty, z);

          tileWidgets.add(
            Positioned(
              left: left,
              top: top,
              width: OsmTileMath.tileSize,
              height: OsmTileMath.tileSize,
              child: Image.network(
                url,
                fit: BoxFit.cover,
                headers: const {
                  'User-Agent': 'GreenGrooFarmerApp/1.0',
                },
                errorBuilder: (_, _, _) => Container(
                  color: const Color(0xFFE2E8F0),
                  child: const Center(
                    child: Icon(Icons.map_outlined, size: 20, color: Color(0xFF94A3B8)),
                  ),
                ),
                loadingBuilder: (ctx, child, prog) {
                  if (prog == null) return child;
                  return Container(
                    color: const Color(0xFFF1F5F9),
                    child: const Center(
                      child: SizedBox(
                        width: 14,
                        height: 14,
                        child: CircularProgressIndicator(strokeWidth: 1.5, color: Color(0xFF94A3B8)),
                      ),
                    ),
                  );
                },
              ),
            ),
          );
        }
      }

      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: width,
          height: height,
          color: const Color(0xFFE2E8F0),
          child: Stack(
            clipBehavior: Clip.hardEdge,
            children: [
              // Tile Canvas with Pan Listener
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onPanUpdate: (d) => _onPanUpdate(d, size),
                onPanEnd: _onPanEnd,
                onDoubleTap: _zoomIn,
                child: Stack(
                  children: tileWidgets,
                ),
              ),

              // OSM Attribution
              Positioned(
                bottom: 2,
                left: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.8),
                    borderRadius: BorderRadius.circular(3),
                  ),
                  child: const Text(
                    '© OpenStreetMap',
                    style: TextStyle(fontSize: 8.5, color: Color(0xFF475569), fontWeight: FontWeight.w500),
                  ),
                ),
              ),

              // Center Marker Pin (With Lift/Bounce on Pan)
              Center(
                child: Transform.translate(
                  offset: Offset(0, _isDragging ? -24 : -16),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.25),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.location_on,
                          size: 32,
                          color: Color(0xFFDC2626), // Vivid Red Pin
                        ),
                      ),
                      // Pin Shadow
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: _isDragging ? 6 : 10,
                        height: 3,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: _isDragging ? 0.2 : 0.35),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Zoom Controls (+ / -)
              Positioned(
                right: 8,
                bottom: 8,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _mapControlButton(
                      icon: Icons.add,
                      tooltip: 'Zoom In',
                      onPressed: _zoomIn,
                    ),
                    const SizedBox(height: 4),
                    _mapControlButton(
                      icon: Icons.remove,
                      tooltip: 'Zoom Out',
                      onPressed: _zoomOut,
                    ),
                  ],
                ),
              ),

              // Top Geocoding status badge
              if (_isGeocoding)
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.95),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 10,
                          height: 10,
                          child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primary),
                        ),
                        SizedBox(width: 6),
                        Text(
                          'ठिकाण तपासत आहे...',
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
                        ),
                      ],
                    ),
                  ),
                ),

              // Fullscreen Expand Button
              if (widget.onExpandRequested != null)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Material(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    elevation: 2,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: widget.onExpandRequested,
                      child: const Padding(
                        padding: EdgeInsets.all(6),
                        child: Icon(Icons.fullscreen, size: 20, color: AppColors.primaryDark),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      );
    });
  }

  Widget _mapControlButton({required IconData icon, required String tooltip, required VoidCallback onPressed}) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(6),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(6),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.all(6),
          child: Icon(icon, size: 16, color: const Color(0xFF1E293B)),
        ),
      ),
    );
  }
}

/// Fullscreen Interactive Farm Location Picker Modal Sheet
class FarmLocationMapPickerSheet extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final String currentVillage;
  final String currentTaluka;
  final String currentDistrict;
  final String currentPincode;
  final String currentAddress;

  const FarmLocationMapPickerSheet({
    super.key,
    required this.initialLat,
    required this.initialLng,
    this.currentVillage = '',
    this.currentTaluka = '',
    this.currentDistrict = '',
    this.currentPincode = '',
    this.currentAddress = '',
  });

  static Future<FarmGeoLocation?> show(
    BuildContext context, {
    double initialLat = 0,
    double initialLng = 0,
    String currentVillage = '',
    String currentTaluka = '',
    String currentDistrict = '',
    String currentPincode = '',
    String currentAddress = '',
  }) {
    return showModalBottomSheet<FarmGeoLocation>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FarmLocationMapPickerSheet(
        initialLat: initialLat,
        initialLng: initialLng,
        currentVillage: currentVillage,
        currentTaluka: currentTaluka,
        currentDistrict: currentDistrict,
        currentPincode: currentPincode,
        currentAddress: currentAddress,
      ),
    );
  }

  @override
  State<FarmLocationMapPickerSheet> createState() => _FarmLocationMapPickerSheetState();
}

class _FarmLocationMapPickerSheetState extends State<FarmLocationMapPickerSheet> {
  late double _pickerLat;
  late double _pickerLng;
  FarmGeoLocation? _activeLocation;
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _searchResults = [];
  bool _isSearching = false;
  Timer? _searchDebounce;

  // Major Maharashtra Ag Hubs
  static const List<Map<String, dynamic>> _presetHubs = [
    {'name': 'पुणे (Pune)', 'lat': 18.5204, 'lng': 73.8567},
    {'name': 'बारामती (Baramati)', 'lat': 18.1517, 'lng': 74.5772},
    {'name': 'मंचर (Manchar)', 'lat': 19.0028, 'lng': 73.9431},
    {'name': 'नाशिक (Nashik)', 'lat': 19.9975, 'lng': 73.7898},
    {'name': 'संगमनेर (Sangamner)', 'lat': 19.5771, 'lng': 74.2081},
    {'name': 'कोल्हापूर (Kolhapur)', 'lat': 16.7050, 'lng': 74.2433},
    {'name': 'सोलापूर (Solapur)', 'lat': 17.6599, 'lng': 75.9064},
    {'name': 'सांगली (Sangli)', 'lat': 16.8524, 'lng': 74.5815},
    {'name': 'सातारा (Satara)', 'lat': 17.6805, 'lng': 74.0183},
    {'name': 'अहमदनगर (Ahmednagar)', 'lat': 19.0952, 'lng': 74.7496},
  ];

  @override
  void initState() {
    super.initState();
    _pickerLat = (widget.initialLat != 0) ? widget.initialLat : 18.5204;
    _pickerLng = (widget.initialLng != 0) ? widget.initialLng : 73.8567;

    _activeLocation = FarmGeoLocation(
      latitude: _pickerLat,
      longitude: _pickerLng,
      village: widget.currentVillage,
      taluka: widget.currentTaluka,
      district: widget.currentDistrict,
      pincode: widget.currentPincode,
      formattedAddress: widget.currentAddress,
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onSearchQueryChanged(String query) {
    _searchDebounce?.cancel();
    if (query.trim().length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    _searchDebounce = Timer(const Duration(milliseconds: 500), () async {
      setState(() => _isSearching = true);
      try {
        final uri = Uri.parse(
          'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}&addressdetails=1&countrycodes=in&limit=5',
        );
        final res = await http.get(uri, headers: {
          'User-Agent': 'GreenGrooFarmerApp/1.0',
        });
        if (res.statusCode == 200) {
          final list = (jsonDecode(res.body) as List).whereType<Map<String, dynamic>>().toList();
          if (mounted) {
            setState(() {
              _searchResults = list;
              _isSearching = false;
            });
          }
          return;
        }
      } catch (_) {}

      if (mounted) setState(() => _isSearching = false);
    });
  }

  void _selectSearchResult(Map<String, dynamic> item) {
    final lat = double.tryParse(item['lat']?.toString() ?? '') ?? _pickerLat;
    final lng = double.tryParse(item['lon']?.toString() ?? '') ?? _pickerLng;
    final addr = item['address'] as Map<String, dynamic>? ?? {};

    final village = (addr['village'] ?? addr['town'] ?? addr['suburb'] ?? addr['city'] ?? '').toString();
    final taluka = (addr['county'] ?? addr['subdistrict'] ?? addr['taluk'] ?? '').toString();
    final district = (addr['state_district'] ?? addr['district'] ?? '').toString();
    final state = (addr['state'] ?? 'Maharashtra').toString();
    final pincode = (addr['postcode'] ?? '').toString();
    final display = (item['display_name'] ?? '').toString();

    setState(() {
      _pickerLat = lat;
      _pickerLng = lng;
      _searchResults = [];
      _searchController.clear();
      _activeLocation = FarmGeoLocation(
        latitude: lat,
        longitude: lng,
        village: village,
        taluka: taluka,
        district: district,
        state: state,
        pincode: pincode,
        formattedAddress: display,
      );
    });
    FocusScope.of(context).unfocus();
  }

  void _jumpToHub(Map<String, dynamic> hub) {
    setState(() {
      _pickerLat = hub['lat'] as double;
      _pickerLng = hub['lng'] as double;
      _searchResults = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final bottomInset = mediaQuery.viewInsets.bottom;
    final bottomPadding = mediaQuery.padding.bottom;
    final sheetHeight = mediaQuery.size.height * 0.90;

    return Container(
      height: sheetHeight,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: Column(
          children: [
            // Drag Handle & Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Column(
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFFCBD5E1),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.pin_drop_rounded, color: Color(0xFF166534), size: 22),
                          SizedBox(width: 8),
                          Text(
                            'Select Farm Location (शेताचे स्थान निवडा)',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Color(0xFF64748B), size: 20),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Search Field & Quick Hubs
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search Input
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: TextField(
                      controller: _searchController,
                      onChanged: _onSearchQueryChanged,
                      style: const TextStyle(fontSize: 13),
                      decoration: InputDecoration(
                        hintText: 'गाव, तालुका, जिल्हा किंवा शहर शोधा (Search village, taluka)...',
                        hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                        suffixIcon: _isSearching
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: Center(
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                                ),
                              )
                            : (_searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 16, color: Color(0xFF64748B)),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchResults = []);
                                    },
                                  )
                                : null),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                  ),

                  // Search Results Dropdown List
                  if (_searchResults.isNotEmpty)
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      constraints: const BoxConstraints(maxHeight: 180),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 8,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: _searchResults.length,
                        separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFE2E8F0)),
                        itemBuilder: (context, idx) {
                          final item = _searchResults[idx];
                          return ListTile(
                            dense: true,
                            visualDensity: VisualDensity.compact,
                            leading: const Icon(Icons.location_on_outlined, size: 18, color: AppColors.primary),
                            title: Text(
                              item['display_name'] ?? '',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12, color: Color(0xFF0F172A)),
                            ),
                            onTap: () => _selectSearchResult(item),
                          );
                        },
                      ),
                    ),

                  const SizedBox(height: 6),

                  // Quick Ag Hubs Horizontal Scroll
                  SizedBox(
                    height: 30,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _presetHubs.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 6),
                      itemBuilder: (context, idx) {
                        final hub = _presetHubs[idx];
                        return ActionChip(
                          label: Text(
                            hub['name'],
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF1E293B)),
                          ),
                          backgroundColor: const Color(0xFFF1F5F9),
                          side: const BorderSide(color: Color(0xFFE2E8F0)),
                          padding: const EdgeInsets.symmetric(horizontal: 4),
                          onPressed: () => _jumpToHub(hub),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Main Map View (Flex 1)
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: InteractiveOsmMap(
                    initialLat: _pickerLat,
                    initialLng: _pickerLng,
                    initialZoom: 15.0,
                    height: 350.0,
                    isInteractive: true,
                    onLocationChanged: (geo) {
                      setState(() {
                        _activeLocation = geo;
                        _pickerLat = geo.latitude;
                        _pickerLng = geo.longitude;
                      });
                    },
                  ),
                ),
              ),
            ),

            // Bottom Location Summary & Confirm Bar (with safe bottom padding)
            Container(
              padding: EdgeInsets.fromLTRB(
                14,
                10,
                14,
                (bottomInset > 0)
                    ? 10
                    : (bottomPadding > 0 ? bottomPadding + 8 : 14),
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 6,
                    offset: Offset(0, -2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Live Detected Address Details
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.location_on, color: Color(0xFF166534), size: 20),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _activeLocation?.shortLabel.isNotEmpty == true
                                  ? _activeLocation!.shortLabel
                                  : 'स्थान निवडले जात आहे...',
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              _activeLocation?.formattedAddress.isNotEmpty == true
                                  ? _activeLocation!.formattedAddress
                                  : 'Lat: ${_pickerLat.toStringAsFixed(5)}°, Lng: ${_pickerLng.toStringAsFixed(5)}°',
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Confirm Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF15803D),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 13),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        elevation: 1,
                      ),
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text(
                        'Confirm This Location (हे स्थान निश्चित करा ✓)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      onPressed: () {
                        final confirmedGeo = _activeLocation ??
                            FarmGeoLocation(
                              latitude: _pickerLat,
                              longitude: _pickerLng,
                            );
                        Navigator.pop(context, confirmedGeo);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
