import 'dart:math' as math;

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart' as gm;
import 'package:latlong2/latlong.dart';

import 'bike_marker.dart';

const _routeGreen = Color(0xFF2E7D32);

/// Key-free live tracking map (OpenStreetMap data, CARTO Voyager tiles).
/// Same behaviour as the Google map: the bike glides between GPS fixes (≈1 s),
/// rotates with heading, and the camera follows rider + destination.
class OsmTrackingMap extends StatefulWidget {
  const OsmTrackingMap({
    super.key,
    this.driver,
    this.heading,
    this.store,
    this.destination,
    this.route = const [],
    this.height = 300,
  });

  final gm.LatLng? driver;
  final double? heading;
  final gm.LatLng? store;
  final gm.LatLng? destination;
  final List<gm.LatLng> route;
  final double height;

  @override
  State<OsmTrackingMap> createState() => _OsmTrackingMapState();
}

LatLng _ll(gm.LatLng p) => LatLng(p.latitude, p.longitude);

class _OsmTrackingMapState extends State<OsmTrackingMap> with SingleTickerProviderStateMixin {
  final MapController _map = MapController();
  late final AnimationController _move = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..addListener(_onTick);

  bool _mapReady = false;
  bool _userMoved = false;

  LatLng? _shown;
  LatLng? _from;
  LatLng? _to;
  double _shownHeading = 0;
  double _fromHeading = 0;
  double _toHeading = 0;

  @override
  void initState() {
    super.initState();
    _shown = widget.driver != null ? _ll(widget.driver!) : null;
    _shownHeading = widget.heading ?? 0;
  }

  @override
  void didUpdateWidget(covariant OsmTrackingMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = widget.driver;
    if (next != null && next != oldWidget.driver) {
      _animateTo(_ll(next), widget.heading);
    } else if (next == null && oldWidget.driver != null) {
      _move.stop();
      setState(() => _shown = null);
    } else if (widget.destination != oldWidget.destination || widget.store != oldWidget.store) {
      _fitCamera();
    }
  }

  @override
  void dispose() {
    _move.dispose();
    _map.dispose();
    super.dispose();
  }

  void _animateTo(LatLng target, double? heading) {
    final current = _shown;
    if (current == null) {
      setState(() {
        _shown = target;
        _shownHeading = heading ?? _shownHeading;
      });
      _fitCamera();
      return;
    }
    _from = current;
    _to = target;
    _fromHeading = _shownHeading;
    _toHeading = heading ??
        (const Distance().as(LengthUnit.Meter, current, target) > 3
            ? const Distance().bearing(current, target)
            : _shownHeading);
    _move.forward(from: 0);
    _fitCamera(include: target);
  }

  void _onTick() {
    final from = _from;
    final to = _to;
    if (from == null || to == null) return;
    final t = _move.value;
    final delta = ((_toHeading - _fromHeading + 540) % 360) - 180;
    setState(() {
      _shown = LatLng(
        from.latitude + (to.latitude - from.latitude) * t,
        from.longitude + (to.longitude - from.longitude) * t,
      );
      _shownHeading = (_fromHeading + delta * t + 360) % 360;
    });
  }

  void _fitCamera({LatLng? include}) {
    if (!_mapReady || _userMoved) return;
    final points = <LatLng>[
      if (include != null) include else ?_shown,
      if (widget.destination != null) _ll(widget.destination!),
      if (_shown == null && include == null && widget.store != null) _ll(widget.store!),
    ];
    if (points.isEmpty) return;
    final bounds = LatLngBounds.fromPoints(points);
    final tiny = (bounds.north - bounds.south).abs() < 0.0005 && (bounds.east - bounds.west).abs() < 0.0005;
    if (points.length == 1 || tiny) {
      _map.move(points.first, 16);
      return;
    }
    _map.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(56), maxZoom: 17));
  }

  void _recenter() {
    setState(() => _userMoved = false);
    _fitCamera();
  }

  @override
  Widget build(BuildContext context) {
    final initial = _shown ??
        (widget.store != null ? _ll(widget.store!) : null) ??
        (widget.destination != null ? _ll(widget.destination!) : null) ??
        const LatLng(20.5937, 78.9629);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: widget.height,
        child: Stack(
          children: [
            RawGestureDetector(
              gestures: {
                EagerGestureRecognizer: GestureRecognizerFactoryWithHandlers<EagerGestureRecognizer>(
                  EagerGestureRecognizer.new,
                  (_) {},
                ),
              },
              child: FlutterMap(
                mapController: _map,
                options: MapOptions(
                  initialCenter: initial,
                  initialZoom: 14,
                  interactionOptions: const InteractionOptions(
                    flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
                  ),
                  onMapReady: () {
                    _mapReady = true;
                    _fitCamera();
                  },
                  onPositionChanged: (_, hasGesture) {
                    if (hasGesture && !_userMoved) setState(() => _userMoved = true);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
                    subdomains: const ['a', 'b', 'c', 'd'],
                    userAgentPackageName: 'com.greengrocc.app',
                    maxZoom: 19,
                  ),
                  if (widget.route.length >= 2)
                    PolylineLayer(
                      polylines: [
                        Polyline(
                          points: widget.route.map(_ll).toList(),
                          color: _routeGreen,
                          strokeWidth: 5,
                          borderColor: Colors.white,
                          borderStrokeWidth: 1.5,
                        ),
                      ],
                    ),
                  MarkerLayer(
                    markers: [
                      if (widget.store != null && _shown == null)
                        Marker(
                          point: _ll(widget.store!),
                          width: 36,
                          height: 36,
                          child: const _PinIcon(icon: Icons.storefront, color: _routeGreen),
                        ),
                      if (widget.destination != null)
                        Marker(
                          point: _ll(widget.destination!),
                          width: 36,
                          height: 36,
                          child: const _PinIcon(icon: Icons.home_rounded, color: Color(0xFFD32F2F)),
                        ),
                      if (_shown != null)
                        Marker(
                          point: _shown!,
                          width: BikeMarker.logicalSize,
                          height: BikeMarker.logicalSize,
                          child: Transform.rotate(
                            angle: _shownHeading * math.pi / 180,
                            child: const BikeIcon(),
                          ),
                        ),
                    ],
                  ),
                  const SimpleAttributionWidget(
                    source: Text('© OpenStreetMap © CARTO', style: TextStyle(fontSize: 10)),
                  ),
                ],
              ),
            ),
            if (_userMoved)
              Positioned(
                right: 10,
                bottom: 28,
                child: Material(
                  color: Colors.white,
                  shape: const CircleBorder(),
                  elevation: 3,
                  child: IconButton(
                    tooltip: 'Re-center',
                    icon: const Icon(Icons.my_location, color: _routeGreen),
                    onPressed: _recenter,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _PinIcon extends StatelessWidget {
  const _PinIcon({required this.icon, required this.color});

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 2.5),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))],
      ),
      child: Icon(icon, size: 18, color: color),
    );
  }
}
