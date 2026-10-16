import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../core/constants/app_colors.dart';
import '../../services/location_service.dart';

import '../../services/app_language.dart';
import '../../services/location_directory.dart';
export '../../services/location_service.dart' show FarmGeoLocation;
export '../../services/location_directory.dart' show LocVillage;

const String _mapUserAgentPackage = 'com.greengroo.farmerapp';
const LatLng _maharashtraCenter = LatLng(19.2, 75.7);

enum FarmMapStyle {
  agricultureSatellite,
  satelliteClean,
  terrain,
  street,
}

List<Widget> _baseTileLayers(FarmMapStyle style) {
  switch (style) {
    case FarmMapStyle.agricultureSatellite:
      // Google Hybrid: High-resolution agriculture field imagery with farm roads, village names, and boundaries
      return [
        TileLayer(
          urlTemplate: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          userAgentPackageName: _mapUserAgentPackage,
          maxNativeZoom: 20,
          maxZoom: 22,
        ),
      ];
    case FarmMapStyle.satelliteClean:
      // High-resolution Esri World Imagery + boundary reference
      return [
        TileLayer(
          urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: _mapUserAgentPackage,
          maxNativeZoom: 19,
          maxZoom: 21,
        ),
        TileLayer(
          urlTemplate:
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          userAgentPackageName: _mapUserAgentPackage,
          maxNativeZoom: 19,
          maxZoom: 21,
        ),
      ];
    case FarmMapStyle.terrain:
      // Topographic terrain & contours (Slopes, waterways, elevation)
      return [
        TileLayer(
          urlTemplate: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          userAgentPackageName: _mapUserAgentPackage,
          maxNativeZoom: 18,
          maxZoom: 20,
        ),
      ];
    case FarmMapStyle.street:
      return [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: _mapUserAgentPackage,
          maxNativeZoom: 19,
        ),
      ];
  }
}

class _MapAttribution extends StatelessWidget {
  const _MapAttribution(this.style);
  final FarmMapStyle style;

  @override
  Widget build(BuildContext context) {
    final String label;
    switch (style) {
      case FarmMapStyle.agricultureSatellite:
        label = '© Google Hybrid (Agri Satellite)';
        break;
      case FarmMapStyle.satelliteClean:
        label = '© Esri, Maxar Imagery';
        break;
      case FarmMapStyle.terrain:
        label = '© Google Terrain (Contours)';
        break;
      case FarmMapStyle.street:
        label = '© OpenStreetMap contributors';
        break;
    }
    return Positioned(
      left: 4,
      bottom: 2,
      child: IgnorePointer(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1.5),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.8),
            borderRadius: BorderRadius.circular(3),
          ),
          child: Text(
            label,
            style: const TextStyle(fontSize: 8.5, color: Color(0xFF475569), fontWeight: FontWeight.w500),
          ),
        ),
      ),
    );
  }
}

class _FarmPin extends StatelessWidget {
  const _FarmPin({this.size = 44});
  final double size;

  @override
  Widget build(BuildContext context) {
    return Icon(
      Icons.location_on,
      size: size,
      color: const Color(0xFFDC2626),
      shadows: const [Shadow(color: Color(0x66000000), blurRadius: 6, offset: Offset(0, 2))],
    );
  }
}

/// Read-only map showing the saved farm pin. Tapping it opens the full picker.
class FarmLocationPreviewMap extends StatelessWidget {
  const FarmLocationPreviewMap({
    super.key,
    required this.latitude,
    required this.longitude,
    this.height = 200,
    this.style = FarmMapStyle.agricultureSatellite,
    this.onTap,
  });

  final double latitude;
  final double longitude;
  final double height;
  final FarmMapStyle style;
  final VoidCallback? onTap;

  bool get _hasLocation => latitude != 0 || longitude != 0;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: _hasLocation ? _buildMap() : _buildPlaceholder(),
      ),
    );
  }

  Widget _buildMap() {
    final point = LatLng(latitude, longitude);
    return Stack(
      children: [
        FlutterMap(
          key: ValueKey('${latitude.toStringAsFixed(6)},${longitude.toStringAsFixed(6)}_${style.name}'),
          options: MapOptions(
            initialCenter: point,
            initialZoom: 16.5,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
            onTap: onTap == null ? null : (_, _) => onTap!(),
          ),
          children: [
            ..._baseTileLayers(style),
            MarkerLayer(
              markers: [
                Marker(point: point, width: 44, height: 44, alignment: Alignment.topCenter, child: const _FarmPin()),
              ],
            ),
          ],
        ),
        _MapAttribution(style),
        Positioned(
          top: 8,
          left: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.65),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.agriculture_rounded, size: 13, color: Color(0xFF4ADE80)),
                const SizedBox(width: 4),
                Text(
                  AppLanguage().tr(mr: '🌾 कृषी उपग्रह नकाशा', en: '🌾 Agri Satellite Map'),
                  style: const TextStyle(fontSize: 10.5, color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        if (onTap != null)
          Positioned(
            top: 8,
            right: 8,
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              elevation: 2,
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: onTap,
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.fullscreen, size: 18, color: AppColors.primaryDark),
                      SizedBox(width: 4),
                      Text(AppLanguage().tr(mr: 'नकाशा उघडा', en: 'Open map'),
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPlaceholder() {
    return Material(
      color: const Color(0xFFF1F5F9),
      child: InkWell(
        onTap: onTap,
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_location_alt_outlined, size: 40, color: Color(0xFF94A3B8)),
                SizedBox(height: 8),
                Text(
                  AppLanguage().tr(mr: 'शेताचे स्थान अजून निवडलेले नाही', en: 'Farm location not selected yet'),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF475569)),
                ),
                SizedBox(height: 2),
                Text(
                  AppLanguage().tr(mr: 'नकाशावर शेत निवडण्यासाठी टॅप करा', en: 'Tap to pick your farm on the map'),
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Full-screen farm location picker: move the map so the centre pin sits on the farm.
class FarmLocationMapPickerSheet extends StatefulWidget {
  final double initialLat;
  final double initialLng;
  final String currentVillage;
  final String currentTaluka;
  final String currentDistrict;
  final String currentPincode;
  final String currentAddress;
  final bool startWithCurrentLocation;

  const FarmLocationMapPickerSheet({
    super.key,
    required this.initialLat,
    required this.initialLng,
    this.currentVillage = '',
    this.currentTaluka = '',
    this.currentDistrict = '',
    this.currentPincode = '',
    this.currentAddress = '',
    this.startWithCurrentLocation = false,
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
    bool startWithCurrentLocation = false,
  }) {
    return showModalBottomSheet<FarmGeoLocation>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      // Vertical drags must pan the map, not dismiss the sheet.
      enableDrag: false,
      backgroundColor: Colors.transparent,
      builder: (_) => FarmLocationMapPickerSheet(
        initialLat: initialLat,
        initialLng: initialLng,
        currentVillage: currentVillage,
        currentTaluka: currentTaluka,
        currentDistrict: currentDistrict,
        currentPincode: currentPincode,
        currentAddress: currentAddress,
        startWithCurrentLocation: startWithCurrentLocation,
      ),
    );
  }

  @override
  State<FarmLocationMapPickerSheet> createState() => _FarmLocationMapPickerSheetState();
}

class _FarmLocationMapPickerSheetState extends State<FarmLocationMapPickerSheet> {
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  late final ValueNotifier<LatLng> _center;

  bool _mapReady = false;
  LatLng? _pendingTarget;
  double? _pendingZoom;

  FarmGeoLocation? _activeLocation;
  bool _isGeocoding = false;
  int _geocodeSeq = 0;
  Timer? _geocodeDebounce;

  List<FarmGeoLocation> _searchResults = [];
  bool _isSearching = false;
  int _searchSeq = 0;
  Timer? _searchDebounce;

  Position? _gpsPosition;
  bool _centerIsGps = false;
  bool _isLocating = false;
  LocationFailure? _gpsError;

  FarmMapStyle _style = FarmMapStyle.agricultureSatellite;

  /// False until the farmer has a real point (saved, GPS, search or moved map),
  /// so the default Maharashtra view can never be saved as the farm.
  late bool _hasPicked;

  bool get _hasInitial => widget.initialLat != 0 || widget.initialLng != 0;

  @override
  void initState() {
    super.initState();
    _hasPicked = _hasInitial;
    _center = ValueNotifier(_hasInitial ? LatLng(widget.initialLat, widget.initialLng) : _maharashtraCenter);
    if (_hasInitial) {
      _activeLocation = FarmGeoLocation(
        latitude: widget.initialLat,
        longitude: widget.initialLng,
        village: widget.currentVillage,
        taluka: widget.currentTaluka,
        district: widget.currentDistrict,
        pincode: widget.currentPincode,
        formattedAddress: widget.currentAddress,
      );
    }
    if (widget.startWithCurrentLocation || !_hasInitial) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _goToCurrentLocation());
    }
  }

  @override
  void dispose() {
    _geocodeDebounce?.cancel();
    _searchDebounce?.cancel();
    _searchController.dispose();
    _searchFocus.dispose();
    _center.dispose();
    _mapController.dispose();
    super.dispose();
  }

  void _moveMap(LatLng target, double zoom) {
    _center.value = target;
    if (_mapReady) {
      _mapController.move(target, zoom);
    } else {
      _pendingTarget = target;
      _pendingZoom = zoom;
    }
  }

  void _onMapReady() {
    _mapReady = true;
    final target = _pendingTarget;
    if (target != null) {
      _mapController.move(target, _pendingZoom ?? 17);
      _pendingTarget = null;
    }
  }

  void _onPositionChanged(MapCamera camera, bool hasGesture) {
    // Non-gesture updates can arrive during layout, where setState is not allowed.
    if (!hasGesture) return;
    _center.value = camera.center;
    if (_centerIsGps || _searchResults.isNotEmpty || !_hasPicked) {
      setState(() {
        _centerIsGps = false;
        _searchResults = [];
        _hasPicked = true;
      });
    }
    _scheduleGeocode();
  }

  void _scheduleGeocode({Duration delay = const Duration(milliseconds: 800)}) {
    _geocodeDebounce?.cancel();
    _geocodeSeq++;
    if (!_isGeocoding) setState(() => _isGeocoding = true);
    _geocodeDebounce = Timer(delay, _reverseGeocodeCenter);
  }

  Future<void> _reverseGeocodeCenter() async {
    final seq = _geocodeSeq;
    final target = _center.value;
    final geo = await FarmLocationService.reverseGeocode(target.latitude, target.longitude);
    if (!mounted || seq != _geocodeSeq) return;

    // Preserve already verified village if the newly reverse-geocoded village is empty
    String village = geo?.village ?? '';
    String pincode = geo?.pincode ?? '';
    if (village.isEmpty && (_activeLocation?.village.isNotEmpty ?? false)) {
      village = _activeLocation!.village;
      if (pincode.isEmpty) pincode = _activeLocation!.pincode;
    }

    setState(() {
      _isGeocoding = false;
      _activeLocation = (geo ?? FarmGeoLocation(latitude: target.latitude, longitude: target.longitude)).copyWith(
        village: village,
        pincode: pincode,
      );
    });
  }

  Future<void> _goToCurrentLocation() async {
    if (_isLocating) return;
    setState(() {
      _isLocating = true;
      _gpsError = null;
    });
    try {
      final pos = await FarmLocationService.currentPosition();
      if (!mounted) return;
      setState(() {
        _gpsPosition = pos;
        _centerIsGps = true;
        _hasPicked = true;
        _isLocating = false;
        _searchResults = [];
      });
      _moveMap(LatLng(pos.latitude, pos.longitude), 17.5);
      _scheduleGeocode(delay: Duration.zero);
    } on LocationFailure catch (e) {
      if (!mounted) return;
      setState(() {
        _isLocating = false;
        _gpsError = e;
      });
    }
  }

  void _onSearchChanged(String query) {
    _searchDebounce?.cancel();
    final seq = ++_searchSeq;
    if (query.trim().length < 2) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }
    setState(() => _isSearching = true);
    _searchDebounce = Timer(const Duration(milliseconds: 600), () async {
      final results = await FarmLocationService.search(query);
      if (!mounted || seq != _searchSeq) return;
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    });
  }

  void _selectSearchResult(FarmGeoLocation geo) {
    _searchDebounce?.cancel();
    _geocodeDebounce?.cancel();
    _geocodeSeq++;
    _searchSeq++;
    setState(() {
      _searchResults = [];
      _isSearching = false;
      _isGeocoding = false;
      _centerIsGps = false;
      _hasPicked = true;
      _activeLocation = geo;
    });
    _searchController.clear();
    _searchFocus.unfocus();
    _moveMap(LatLng(geo.latitude, geo.longitude), 16);
  }

  void _zoomBy(double delta) {
    if (!_mapReady) return;
    final camera = _mapController.camera;
    _mapController.move(camera.center, (camera.zoom + delta).clamp(4.0, 19.0));
  }

  void _confirm() {
    final c = _center.value;
    final base = _activeLocation ?? FarmGeoLocation(latitude: c.latitude, longitude: c.longitude);
    if (base.village.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLanguage().tr(
              mr: 'शेताचे गाव निवडणे आवश्यक आहे. कृपया आपले गाव निवडा.',
              en: 'Please select your farm village.',
            ),
          ),
          backgroundColor: const Color(0xFFD97706),
          duration: const Duration(seconds: 3),
        ),
      );
      _openVillagePickerSheet();
      return;
    }
    Navigator.pop(context, base.withCoordinates(c.latitude, c.longitude));
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);

    return Container(
      height: media.size.height * 0.92,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          _buildSearchField(),
          Expanded(child: _buildMapArea()),
          _buildBottomBar(media.padding.bottom),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 10, 8, 6),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.pin_drop_rounded, color: Color(0xFF166534), size: 22),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  AppLanguage().tr(mr: 'शेताचे स्थान निवडा', en: 'Select Farm Location'),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Color(0xFF64748B), size: 22),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocus,
        onChanged: _onSearchChanged,
        textInputAction: TextInputAction.search,
        style: const TextStyle(fontSize: 13),
        decoration: InputDecoration(
          isDense: true,
          filled: true,
          fillColor: const Color(0xFFF1F5F9),
          hintText: AppLanguage().tr(mr: 'गाव, तालुका किंवा जिल्हा शोधा...', en: 'Search village, taluka or district...'),
          hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
          prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF64748B)),
          suffixIcon: _isSearching
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  ),
                )
              : (_searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18, color: Color(0xFF64748B)),
                      onPressed: () {
                        _searchController.clear();
                        _onSearchChanged('');
                      },
                    )
                  : null),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildMapArea() {
    final gps = _gpsPosition;
    final gpsPoint = gps == null ? null : LatLng(gps.latitude, gps.longitude);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Stack(
          children: [
            FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _center.value,
                initialZoom: _hasInitial ? 17 : 6,
                minZoom: 4,
                maxZoom: 19,
                interactionOptions: const InteractionOptions(
                  flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                ),
                onMapReady: _onMapReady,
                onPositionChanged: _onPositionChanged,
              ),
              children: [
                ..._baseTileLayers(_style),
                if (gps != null && gpsPoint != null) ...[
                  CircleLayer(
                    circles: [
                      CircleMarker(
                        point: gpsPoint,
                        radius: gps.accuracy.clamp(5, 500).toDouble(),
                        useRadiusInMeter: true,
                        color: const Color(0x332563EB),
                        borderColor: const Color(0x802563EB),
                        borderStrokeWidth: 1,
                      ),
                    ],
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: gpsPoint,
                        width: 20,
                        height: 20,
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF2563EB),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: const [BoxShadow(color: Color(0x55000000), blurRadius: 4)],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),

            // Fixed centre pin; its tip marks the selected point.
            const IgnorePointer(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.only(bottom: 44),
                  child: _FarmPin(size: 44),
                ),
              ),
            ),

            _MapAttribution(_style),

            Positioned(
              top: 8,
              left: 8,
              right: 140,
              child: Align(alignment: Alignment.centerLeft, child: _buildStatusChip()),
            ),

            Positioned(
              right: 8,
              top: 8,
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                elevation: 3,
                child: InkWell(
                  borderRadius: BorderRadius.circular(10),
                  onTap: _openMapStyleSelector,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          _styleIcon(_style),
                          size: 16,
                          color: const Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          _styleLabel(_style),
                          style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            Positioned(
              right: 8,
              bottom: 16,
              child: Column(
                children: [
                  _mapButton(icon: Icons.add, tooltip: AppLanguage().tr(mr: 'झूम इन', en: 'Zoom in'), onPressed: () => _zoomBy(1)),
                  const SizedBox(height: 6),
                  _mapButton(icon: Icons.remove, tooltip: AppLanguage().tr(mr: 'झूम आउट', en: 'Zoom out'), onPressed: () => _zoomBy(-1)),
                  const SizedBox(height: 12),
                  Material(
                    color: Colors.white,
                    shape: const CircleBorder(),
                    elevation: 3,
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: _isLocating ? null : _goToCurrentLocation,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: _isLocating
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(strokeWidth: 2.2, color: Color(0xFF2563EB)),
                              )
                            : Icon(
                                Icons.my_location,
                                size: 22,
                                color: _centerIsGps ? const Color(0xFF2563EB) : const Color(0xFF334155),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            if (_gpsError != null)
              Positioned(
                left: 8,
                right: 8,
                top: 48,
                child: _buildGpsErrorBanner(_gpsError!),
              ),

            if (_searchResults.isNotEmpty)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                child: _buildSearchResults(),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip() {
    final String text;
    final Widget leading;
    if (_isLocating) {
      text = AppLanguage().tr(mr: 'तुमचे लोकेशन शोधत आहे...', en: 'Finding your location...');
      leading = const SizedBox(
        width: 12,
        height: 12,
        child: CircularProgressIndicator(strokeWidth: 1.6, color: Color(0xFF2563EB)),
      );
    } else if (_isGeocoding) {
      text = AppLanguage().tr(mr: 'पत्ता शोधत आहे...', en: 'Finding address...');
      leading = const SizedBox(
        width: 12,
        height: 12,
        child: CircularProgressIndicator(strokeWidth: 1.6, color: AppColors.primary),
      );
    } else {
      text = AppLanguage().tr(mr: 'नकाशा हलवून लाल पिन शेतावर ठेवा', en: 'Move the map to place the red pin on your farm');
      leading = const Icon(Icons.pan_tool_alt_outlined, size: 14, color: AppColors.primaryDark);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 4)],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          leading,
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGpsErrorBanner(LocationFailure error) {
    return Material(
      color: const Color(0xFFFEF2F2),
      borderRadius: BorderRadius.circular(10),
      elevation: 3,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
        child: Row(
          children: [
            const Icon(Icons.location_off_rounded, color: AppColors.error, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                error.message,
                style: const TextStyle(fontSize: 11.5, color: Color(0xFF7F1D1D), fontWeight: FontWeight.w600),
              ),
            ),
            TextButton(
              onPressed: () async {
                if (error.canOpenSettings) {
                  await error.openSettings();
                } else {
                  await _goToCurrentLocation();
                }
              },
              child: Text(error.canOpenSettings ? AppLanguage().tr(mr: 'सेटिंग्ज', en: 'Settings') : AppLanguage().tr(mr: 'पुन्हा', en: 'Retry')),
            ),
            IconButton(
              icon: const Icon(Icons.close, size: 16),
              visualDensity: VisualDensity.compact,
              onPressed: () => setState(() => _gpsError = null),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return Material(
      color: Colors.white,
      elevation: 4,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxHeight: 240),
        child: ListView.separated(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          itemCount: _searchResults.length,
          separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFE2E8F0)),
          itemBuilder: (context, idx) {
            final item = _searchResults[idx];
            return ListTile(
              dense: true,
              leading: const Icon(Icons.location_on_outlined, size: 20, color: AppColors.primary),
              title: Text(
                item.shortLabel,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0F172A)),
              ),
              subtitle: Text(
                item.formattedAddress,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
              ),
              onTap: () => _selectSearchResult(item),
            );
          },
        ),
      ),
    );
  }

  Widget _buildBottomBar(double safeBottom) {
    final loc = _activeLocation;
    final accuracy = _centerIsGps ? _gpsPosition?.accuracy : null;

    return Container(
      padding: EdgeInsets.fromLTRB(14, 12, 14, 12 + safeBottom),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.location_on, color: Color(0xFF166534), size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      !_hasPicked
                          ? AppLanguage().tr(mr: 'GPS बटण दाबा, गाव शोधा किंवा नकाशा हलवा', en: 'Tap GPS, search a village or move the map')
                          : _isGeocoding
                              ? AppLanguage().tr(mr: 'पत्ता शोधत आहे...', en: 'Finding address...')
                              : (loc != null && loc.hasAddress ? loc.shortLabel : AppLanguage().tr(mr: 'पत्ता मिळाला नाही — फक्त GPS स्थान', en: 'Address not found — GPS location only')),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    if (!_isGeocoding && loc != null && loc.formattedAddress.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        loc.formattedAddress,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                      ),
                    ],
                    const SizedBox(height: 3),
                    ValueListenableBuilder<LatLng>(
                      valueListenable: _center,
                      builder: (_, c, _) => Text(
                        'GPS: ${c.latitude.toStringAsFixed(6)}, ${c.longitude.toStringAsFixed(6)}'
                        '${accuracy != null ? '  (±${accuracy.round()} m)' : ''}',
                        style: const TextStyle(
                          fontSize: 10.5,
                          color: Color(0xFF0369A1),
                          fontWeight: FontWeight.w600,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                    if (accuracy != null && accuracy > 50)
                      Padding(
                        padding: EdgeInsets.only(top: 3),
                        child: Text(
                          AppLanguage().tr(mr: 'GPS अचूकता कमी आहे — गरज असल्यास पिन शेतावर हलवा.', en: 'GPS accuracy is low — move the pin onto your farm if needed.'),
                          style: TextStyle(fontSize: 10.5, color: Color(0xFFB45309), fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          // Village status & selection card
          _buildVillageSelectionCard(loc),

          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
                disabledBackgroundColor: const Color(0xFF86EFAC),
                disabledForegroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 13),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 1,
              ),
              icon: const Icon(Icons.check_circle_outline, size: 18),
              label: Text(
                AppLanguage().tr(mr: 'हे स्थान निश्चित करा ✓', en: 'Confirm this location ✓'),
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
              ),
              onPressed: (!_hasPicked || _isGeocoding || _isLocating) ? null : _confirm,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVillageSelectionCard(FarmGeoLocation? loc) {
    final hasVillage = loc != null && loc.village.trim().isNotEmpty;
    final villageName = hasVillage ? loc.village.trim() : '';

    return Container(
      margin: const EdgeInsets.only(top: 10, bottom: 2),
      decoration: BoxDecoration(
        color: hasVillage ? const Color(0xFFF0FDF4) : const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: hasVillage ? const Color(0xFF86EFAC) : const Color(0xFFFCD34D),
          width: 1.2,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: _openVillagePickerSheet,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Icon(
                  hasVillage ? Icons.check_circle_rounded : Icons.add_location_alt_rounded,
                  color: hasVillage ? const Color(0xFF16A34A) : const Color(0xFFD97706),
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Row(
                        children: [
                          Text(
                            AppLanguage().tr(mr: 'शेताचे गाव (Village)', en: 'Farm Village'),
                            style: TextStyle(
                              fontSize: 10.5,
                              fontWeight: FontWeight.w600,
                              color: hasVillage ? const Color(0xFF166534) : const Color(0xFF92400E),
                            ),
                          ),
                          if (hasVillage) ...[
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                AppLanguage().tr(mr: 'निश्चित', en: 'Verified'),
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 1),
                      Text(
                        hasVillage
                            ? villageName
                            : AppLanguage().tr(mr: 'गाव निवडलेले नाही — कृपया गाव निवडा ▾', en: 'No village selected — Tap to select ▾'),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: hasVillage ? const Color(0xFF0F172A) : const Color(0xFFB45309),
                        ),
                      ),
                      if (hasVillage && (loc.taluka.isNotEmpty || loc.pincode.isNotEmpty))
                        Text(
                          [
                            if (loc.taluka.isNotEmpty) 'तालुका: ${loc.taluka}',
                            if (loc.pincode.isNotEmpty) 'पिनकोड: ${loc.pincode}',
                          ].join(' • '),
                          style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                  decoration: BoxDecoration(
                    color: hasVillage ? Colors.white : const Color(0xFFD97706),
                    borderRadius: BorderRadius.circular(6),
                    border: hasVillage ? Border.all(color: const Color(0xFF86EFAC)) : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        hasVillage
                            ? AppLanguage().tr(mr: 'बदला ▾', en: 'Change ▾')
                            : AppLanguage().tr(mr: 'गाव निवडा ▾', en: 'Select ▾'),
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.bold,
                          color: hasVillage ? const Color(0xFF15803D) : Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openVillagePickerSheet() async {
    final currentTaluka = _activeLocation?.taluka.trim() ?? widget.currentTaluka.trim();
    final currentDistrict = _activeLocation?.district.trim() ?? widget.currentDistrict.trim();

    final result = await FarmVillagePickerModal.show(
      context,
      taluka: currentTaluka,
      district: currentDistrict,
      currentVillage: _activeLocation?.village ?? widget.currentVillage,
    );

    if (result != null && mounted) {
      final c = _center.value;
      setState(() {
        _activeLocation = (_activeLocation ?? FarmGeoLocation(latitude: c.latitude, longitude: c.longitude)).copyWith(
          village: result.name,
          pincode: result.pincode,
        );
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLanguage().tr(
              mr: 'गाव निश्चित केले: ${result.name} (${result.pincode}) ✓',
              en: 'Village confirmed: ${result.name} (${result.pincode}) ✓',
            ),
          ),
          duration: const Duration(seconds: 2),
          backgroundColor: const Color(0xFF15803D),
        ),
      );
    }
  }

  Widget _mapButton({required IconData icon, required String tooltip, required VoidCallback onPressed}) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        elevation: 2,
        child: InkWell(
          borderRadius: BorderRadius.circular(8),
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Icon(icon, size: 20, color: const Color(0xFF1E293B)),
          ),
        ),
      ),
    );
  }

  String _styleLabel(FarmMapStyle s) {
    switch (s) {
      case FarmMapStyle.agricultureSatellite:
        return AppLanguage().tr(mr: '🌾 कृषी उपग्रह', en: '🌾 Agri Satellite');
      case FarmMapStyle.satelliteClean:
        return AppLanguage().tr(mr: '🛰️ उपग्रह', en: '🛰️ Satellite');
      case FarmMapStyle.terrain:
        return AppLanguage().tr(mr: '⛰️ भूभाग', en: '⛰️ Terrain');
      case FarmMapStyle.street:
        return AppLanguage().tr(mr: '🗺️ रस्ते', en: '🗺️ Street');
    }
  }

  IconData _styleIcon(FarmMapStyle s) {
    switch (s) {
      case FarmMapStyle.agricultureSatellite:
        return Icons.agriculture_rounded;
      case FarmMapStyle.satelliteClean:
        return Icons.satellite_alt_rounded;
      case FarmMapStyle.terrain:
        return Icons.terrain_rounded;
      case FarmMapStyle.street:
        return Icons.map_rounded;
    }
  }

  void _openMapStyleSelector() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: Colors.white,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.layers_outlined, color: AppColors.primary, size: 22),
                        const SizedBox(width: 8),
                        Text(
                          AppLanguage().tr(mr: 'शेती नकाशा प्रकार निवडा', en: 'Select Agriculture Map'),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _buildStyleOption(
                  ctx: ctx,
                  style: FarmMapStyle.agricultureSatellite,
                  title: AppLanguage().tr(mr: '🌾 कृषी उपग्रह (हायब्रीड - शिफारस केलेले)', en: '🌾 Agri Satellite (Recommended)'),
                  subtitle: AppLanguage().tr(mr: 'शेताचे बांध, पिके, विहीर, पांढण रस्ते व गावे स्पष्ट दिसतात', en: 'High-res farm plots, crops, village paths & roads'),
                  icon: Icons.agriculture_rounded,
                  activeColor: const Color(0xFF16A34A),
                ),
                const SizedBox(height: 8),
                _buildStyleOption(
                  ctx: ctx,
                  style: FarmMapStyle.satelliteClean,
                  title: AppLanguage().tr(mr: '🛰️ उपग्रह (सॅटेलाइट छायाचित्र)', en: '🛰️ Pure Satellite (Esri Imagery)'),
                  subtitle: AppLanguage().tr(mr: 'हाय-रिझोल्यूशन नैसर्गिक सॅटेलाइट प्रतिमा', en: 'High-resolution natural aerial imagery'),
                  icon: Icons.satellite_alt_rounded,
                  activeColor: const Color(0xFF0284C7),
                ),
                const SizedBox(height: 8),
                _buildStyleOption(
                  ctx: ctx,
                  style: FarmMapStyle.terrain,
                  title: AppLanguage().tr(mr: '⛰️ भूभाग व पाणलोट (Topography)', en: '⛰️ Agri Terrain & Watershed'),
                  subtitle: AppLanguage().tr(mr: 'जमिनीचा उतार, ओढे, नद्या व पाणी वाहण्याची दिशा', en: 'Contour lines, elevation slopes & waterways'),
                  icon: Icons.terrain_rounded,
                  activeColor: const Color(0xFFD97706),
                ),
                const SizedBox(height: 8),
                _buildStyleOption(
                  ctx: ctx,
                  style: FarmMapStyle.street,
                  title: AppLanguage().tr(mr: '🗺️ रस्ते नकाशा (Street Map)', en: '🗺️ Standard Street Map'),
                  subtitle: AppLanguage().tr(mr: 'गावे, शहरे व प्रमुख रस्त्यांचा साधा नकाशा', en: 'Standard street and highway network'),
                  icon: Icons.map_rounded,
                  activeColor: const Color(0xFF475569),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStyleOption({
    required BuildContext ctx,
    required FarmMapStyle style,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color activeColor,
  }) {
    final isSelected = _style == style;
    return InkWell(
      onTap: () {
        setState(() => _style = style);
        Navigator.pop(ctx);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? activeColor.withValues(alpha: 0.08) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? activeColor : const Color(0xFFE2E8F0),
            width: isSelected ? 1.8 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? activeColor.withValues(alpha: 0.15) : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: isSelected ? activeColor : const Color(0xFF64748B), size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? activeColor : const Color(0xFF1E293B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle_rounded, color: activeColor, size: 20),
          ],
        ),
      ),
    );
  }
}

/// Searchable modal bottom sheet to pick or verify a farm's official revenue village.
class FarmVillagePickerModal extends StatefulWidget {
  final String initialTaluka;
  final String initialDistrict;
  final String currentVillageName;

  const FarmVillagePickerModal({
    super.key,
    required this.initialTaluka,
    required this.initialDistrict,
    this.currentVillageName = '',
  });

  static Future<LocVillage?> show(
    BuildContext context, {
    required String taluka,
    required String district,
    String currentVillage = '',
  }) {
    return showModalBottomSheet<LocVillage>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FarmVillagePickerModal(
        initialTaluka: taluka,
        initialDistrict: district,
        currentVillageName: currentVillage,
      ),
    );
  }

  @override
  State<FarmVillagePickerModal> createState() => _FarmVillagePickerModalState();
}

class _FarmVillagePickerModalState extends State<FarmVillagePickerModal> {
  final TextEditingController _searchCtrl = TextEditingController();
  final TextEditingController _customVillageCtrl = TextEditingController();

  List<LocVillage> _villages = [];
  List<LocDistrict> _allDistricts = [];
  String _selectedDistrict = '';
  String _selectedTaluka = '';
  bool _isLoading = true;
  bool _isManualEntry = false;
  bool _searchAcrossAll = false;
  List<Map<String, String>> _globalResults = [];
  bool _isSearchingGlobal = false;

  @override
  void initState() {
    super.initState();
    _selectedDistrict = widget.initialDistrict;
    _selectedTaluka = widget.initialTaluka;
    _loadVillages();
  }

  Future<void> _loadVillages() async {
    setState(() => _isLoading = true);
    final dists = await LocationDirectory.getMaharashtraDistricts();
    List<LocVillage> list = [];
    if (_selectedTaluka.isNotEmpty) {
      list = await LocationDirectory.getVillagesForTaluka(_selectedTaluka, districtName: _selectedDistrict);
      list = List.of(list)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    } else if (dists.isNotEmpty) {
      final defaultDist = dists.where((d) => d.en.toLowerCase().contains('ahilya') || d.en.toLowerCase().contains('ahmed')).firstOrNull ?? dists.first;
      _selectedDistrict = defaultDist.en;
      if (defaultDist.talukas.isNotEmpty) {
        _selectedTaluka = defaultDist.talukas.first.en;
        list = List.of(defaultDist.talukas.first.villages)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
      }
    }

    if (!mounted) return;
    setState(() {
      _allDistricts = dists;
      _villages = list;
      _isLoading = false;
    });
  }

  Future<void> _switchTaluka(String taluka, String district) async {
    setState(() {
      _selectedTaluka = taluka;
      _selectedDistrict = district;
      _isLoading = true;
      _searchAcrossAll = false;
    });
    var list = await LocationDirectory.getVillagesForTaluka(taluka, districtName: district);
    list = List.of(list)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    if (!mounted) return;
    setState(() {
      _villages = list;
      _isLoading = false;
    });
  }

  Future<void> _performGlobalSearch(String q) async {
    if (q.trim().length < 2) {
      setState(() => _globalResults = []);
      return;
    }
    setState(() => _isSearchingGlobal = true);
    final res = await LocationDirectory.searchVillages(q, limit: 50);
    if (!mounted) return;
    setState(() {
      _globalResults = res;
      _isSearchingGlobal = false;
    });
  }

  void _onSearchChanged(String val) {
    if (_searchAcrossAll) {
      _performGlobalSearch(val);
    } else {
      setState(() {});
    }
  }

  void _showTalukaSelectorDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          height: MediaQuery.of(ctx).size.height * 0.75,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.symmetric(vertical: 10),
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    const Icon(Icons.map_rounded, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      AppLanguage().tr(mr: 'तालुका निवडा', en: 'Select Taluka'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView.builder(
                  itemCount: _allDistricts.length,
                  itemBuilder: (ctx, dIdx) {
                    final d = _allDistricts[dIdx];
                    return ExpansionTile(
                      initiallyExpanded: d.en.toLowerCase() == _selectedDistrict.toLowerCase(),
                      leading: const Icon(Icons.landscape, size: 20, color: AppColors.primary),
                      title: Text(
                        d.label,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                      ),
                      children: d.talukas.map((t) {
                        final isSel = t.en.toLowerCase() == _selectedTaluka.toLowerCase();
                        return ListTile(
                          dense: true,
                          contentPadding: const EdgeInsets.only(left: 36, right: 16),
                          title: Text(
                            t.label,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                              color: isSel ? AppColors.primary : const Color(0xFF1E293B),
                            ),
                          ),
                          trailing: isSel ? const Icon(Icons.check, color: AppColors.primary, size: 18) : null,
                          onTap: () {
                            Navigator.pop(ctx);
                            _switchTaluka(t.en, d.en);
                          },
                        );
                      }).toList(),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _customVillageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final query = _searchCtrl.text.trim().toLowerCase();
    final filteredVillages = query.isEmpty
        ? _villages
        : _villages.where((v) => v.name.toLowerCase().contains(query) || v.pincode.contains(query)).toList();

    return Container(
      height: media.size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 8, 8),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: const Color(0xFFCBD5E1), borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDCFCE7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.holiday_village_rounded, color: Color(0xFF166534), size: 22),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppLanguage().tr(mr: 'शेताचे गाव निवडा', en: 'Select Farm Village'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                          ),
                          Text(
                            AppLanguage().tr(
                              mr: 'नकाशावरील शेतासाठी अधिकृत महसूल गाव निवडा',
                              en: 'Choose official revenue village for your farm',
                            ),
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Taluka switcher bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            color: const Color(0xFFF8FAFC),
            child: Row(
              children: [
                const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF166534)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _selectedTaluka.isNotEmpty
                        ? 'तालुका: $_selectedTaluka${_selectedDistrict.isNotEmpty ? ' ($_selectedDistrict)' : ''}'
                        : 'तालुका निवडलेला नाही',
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
                  ),
                ),
                InkWell(
                  onTap: _showTalukaSelectorDialog,
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          AppLanguage().tr(mr: 'तालुका बदला ▾', en: 'Change Taluka ▾'),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Search Field
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 10, 14, 8),
            child: TextField(
              controller: _searchCtrl,
              onChanged: _onSearchChanged,
              textInputAction: TextInputAction.search,
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                isDense: true,
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                hintText: _searchAcrossAll
                    ? AppLanguage().tr(mr: 'महाराष्ट्रातील कोणतेही गाव किंवा पिन शोधा...', en: 'Search any village in Maharashtra...')
                    : AppLanguage().tr(
                        mr: '$_selectedTaluka मधील गाव किंवा पिनकोड शोधा...',
                        en: 'Search village in $_selectedTaluka...',
                      ),
                hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFF64748B)),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16, color: Color(0xFF64748B)),
                        onPressed: () {
                          _searchCtrl.clear();
                          _onSearchChanged('');
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFCBD5E1))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
              ),
            ),
          ),

          // Mode buttons: Manual entry / Toggle all Maharashtra
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
            child: Row(
              children: [
                Expanded(
                  child: InkWell(
                    onTap: () => setState(() => _isManualEntry = !_isManualEntry),
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      decoration: BoxDecoration(
                        color: _isManualEntry ? const Color(0xFFEFF6FF) : Colors.transparent,
                        border: Border.all(color: _isManualEntry ? const Color(0xFF3B82F6) : const Color(0xFFE2E8F0)),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isManualEntry ? Icons.check_circle : Icons.edit_note_rounded,
                            size: 15,
                            color: _isManualEntry ? const Color(0xFF1D4ED8) : const Color(0xFF64748B),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            AppLanguage().tr(mr: 'स्वतः गावाचे नाव लिहा ✍️', en: 'Type Village Manually ✍️'),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: _isManualEntry ? const Color(0xFF1D4ED8) : const Color(0xFF475569),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkWell(
                  onTap: () {
                    setState(() {
                      _searchAcrossAll = !_searchAcrossAll;
                      if (_searchAcrossAll && _searchCtrl.text.isNotEmpty) {
                        _performGlobalSearch(_searchCtrl.text);
                      }
                    });
                  },
                  borderRadius: BorderRadius.circular(6),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
                    decoration: BoxDecoration(
                      color: _searchAcrossAll ? const Color(0xFFDCFCE7) : const Color(0xFFF8FAFC),
                      border: Border.all(color: _searchAcrossAll ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.travel_explore_rounded,
                          size: 15,
                          color: _searchAcrossAll ? const Color(0xFF15803D) : const Color(0xFF64748B),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _searchAcrossAll ? AppLanguage().tr(mr: 'सर्व महाराष्ट्र ✓', en: 'All MH ✓') : AppLanguage().tr(mr: 'सर्व महाराष्ट्र', en: 'All MH'),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _searchAcrossAll ? const Color(0xFF15803D) : const Color(0xFF475569),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Manual Input Form (collapsible)
          if (_isManualEntry)
            Container(
              margin: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppLanguage().tr(mr: 'शेताचे गाव / वाडी / वस्तीचे नाव टाका:', en: 'Enter Farm Village / Wadi Name:'),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF166534)),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _customVillageCtrl,
                          autofocus: true,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                          decoration: InputDecoration(
                            isDense: true,
                            hintText: AppLanguage().tr(mr: 'उदा. शिंदे वस्ती / काळे मळा', en: 'e.g. Shinde Wasti'),
                            filled: true,
                            fillColor: Colors.white,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF86EFAC))),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF15803D),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        onPressed: () {
                          final name = _customVillageCtrl.text.trim();
                          if (name.isNotEmpty) {
                            final pin = _villages.isNotEmpty ? _villages.first.pincode : '';
                            Navigator.pop(context, LocVillage(name, pin));
                          }
                        },
                        child: Text(
                          AppLanguage().tr(mr: 'निश्चित करा', en: 'Confirm'),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          const SizedBox(height: 6),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),

          // Village list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _searchAcrossAll
                    ? _buildGlobalSearchResults()
                    : _buildTalukaVillageList(filteredVillages),
          ),
        ],
      ),
    );
  }

  Widget _buildTalukaVillageList(List<LocVillage> list) {
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.search_off_rounded, size: 40, color: Color(0xFF94A3B8)),
              const SizedBox(height: 10),
              Text(
                _searchCtrl.text.isNotEmpty
                    ? AppLanguage().tr(
                        mr: "'${_searchCtrl.text}' हे गाव '$_selectedTaluka' तालुक्यात सापडले नाही.",
                        en: "Village '${_searchCtrl.text}' not found in $_selectedTaluka.",
                      )
                    : AppLanguage().tr(mr: 'या तालुक्यात गावे आढळली नाहीत.', en: 'No villages found in this taluka.'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.travel_explore, size: 16),
                    label: Text(AppLanguage().tr(mr: 'सर्व महाराष्ट्रात शोधा', en: 'Search All Maharashtra')),
                    onPressed: () {
                      setState(() {
                        _searchAcrossAll = true;
                        _performGlobalSearch(_searchCtrl.text);
                      });
                    },
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    icon: const Icon(Icons.edit, size: 16),
                    label: Text(AppLanguage().tr(mr: 'नाव लिहा', en: 'Type Name')),
                    onPressed: () {
                      setState(() {
                        _isManualEntry = true;
                        _customVillageCtrl.text = _searchCtrl.text.trim();
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: list.length,
      separatorBuilder: (_, _) => const Divider(height: 1, indent: 56, color: Color(0xFFF1F5F9)),
      itemBuilder: (ctx, idx) {
        final v = list[idx];
        final isSelected = widget.currentVillageName.trim().isNotEmpty &&
            widget.currentVillageName.trim().toLowerCase() == v.name.toLowerCase();

        return ListTile(
          dense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          leading: Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: isSelected ? const Color(0xFFDCFCE7) : const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.holiday_village_rounded,
              size: 18,
              color: isSelected ? const Color(0xFF15803D) : const Color(0xFF64748B),
            ),
          ),
          title: Text(
            v.name,
            style: TextStyle(
              fontSize: 13.5,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
              color: isSelected ? const Color(0xFF15803D) : const Color(0xFF0F172A),
            ),
          ),
          subtitle: Text(
            'पिनकोड: ${v.pincode} • तालुका: $_selectedTaluka',
            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
          ),
          trailing: isSelected
              ? const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 20)
              : const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFCBD5E1), size: 14),
          onTap: () => Navigator.pop(context, v),
        );
      },
    );
  }

  Widget _buildGlobalSearchResults() {
    if (_isSearchingGlobal) {
      return const Center(child: CircularProgressIndicator(color: AppColors.primary));
    }
    if (_globalResults.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            AppLanguage().tr(
              mr: 'गावाचे नाव किंवा पिनकोड टाका (उदा. धारंग किंवा 423601)',
              en: 'Enter village name or pincode (e.g. Dharang or 423601)',
            ),
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 4),
      itemCount: _globalResults.length,
      separatorBuilder: (_, _) => const Divider(height: 1, indent: 56, color: Color(0xFFF1F5F9)),
      itemBuilder: (ctx, idx) {
        final item = _globalResults[idx];
        final vName = item['village'] ?? '';
        final pin = item['pincode'] ?? '';
        final t = item['taluka'] ?? '';
        final d = item['district'] ?? '';

        return ListTile(
          dense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          leading: Container(
            padding: const EdgeInsets.all(7),
            decoration: const BoxDecoration(
              color: Color(0xFFEFF6FF),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.place_rounded, size: 18, color: Color(0xFF2563EB)),
          ),
          title: Text(
            vName,
            style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
          subtitle: Text(
            'पिनकोड: $pin • $t, $d',
            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
          ),
          trailing: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFCBD5E1), size: 14),
          onTap: () => Navigator.pop(context, LocVillage(vName, pin)),
        );
      },
    );
  }
}
