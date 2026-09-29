import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';

import '../../core/constants/app_colors.dart';
import '../../services/location_service.dart';

import '../../services/app_language.dart';
export '../../services/location_service.dart' show FarmGeoLocation;

const String _mapUserAgentPackage = 'com.greengroo.farmerapp';
const LatLng _maharashtraCenter = LatLng(19.2, 75.7);

enum FarmMapStyle { street, satellite }

List<Widget> _baseTileLayers(FarmMapStyle style) {
  if (style == FarmMapStyle.satellite) {
    return [
      TileLayer(
        urlTemplate: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        userAgentPackageName: _mapUserAgentPackage,
        maxNativeZoom: 18,
      ),
      TileLayer(
        urlTemplate:
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        userAgentPackageName: _mapUserAgentPackage,
        maxNativeZoom: 18,
      ),
    ];
  }
  return [
    TileLayer(
      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      userAgentPackageName: _mapUserAgentPackage,
      maxNativeZoom: 19,
    ),
  ];
}

class _MapAttribution extends StatelessWidget {
  const _MapAttribution(this.style);
  final FarmMapStyle style;

  @override
  Widget build(BuildContext context) {
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
            style == FarmMapStyle.satellite ? '© Esri, Maxar, Earthstar Geographics' : '© OpenStreetMap contributors',
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
    this.onTap,
  });

  final double latitude;
  final double longitude;
  final double height;
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
          key: ValueKey('${latitude.toStringAsFixed(6)},${longitude.toStringAsFixed(6)}'),
          options: MapOptions(
            initialCenter: point,
            initialZoom: 16,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
            onTap: onTap == null ? null : (_, _) => onTap!(),
          ),
          children: [
            ..._baseTileLayers(FarmMapStyle.street),
            MarkerLayer(
              markers: [
                Marker(point: point, width: 44, height: 44, alignment: Alignment.topCenter, child: const _FarmPin()),
              ],
            ),
          ],
        ),
        const _MapAttribution(FarmMapStyle.street),
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

  FarmMapStyle _style = FarmMapStyle.street;

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
    setState(() {
      _isGeocoding = false;
      _activeLocation = geo ?? FarmGeoLocation(latitude: target.latitude, longitude: target.longitude);
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
              right: 60,
              child: Align(alignment: Alignment.centerLeft, child: _buildStatusChip()),
            ),

            Positioned(
              right: 8,
              top: 8,
              child: Column(
                children: [
                  _mapButton(
                    icon: _style == FarmMapStyle.street ? Icons.satellite_alt_rounded : Icons.map_rounded,
                    tooltip: _style == FarmMapStyle.street ? AppLanguage().tr(mr: 'उपग्रह', en: 'Satellite') : AppLanguage().tr(mr: 'नकाशा', en: 'Map'),
                    onPressed: () => setState(() {
                      _style = _style == FarmMapStyle.street ? FarmMapStyle.satellite : FarmMapStyle.street;
                    }),
                  ),
                ],
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
          const SizedBox(height: 12),
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
}
