import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import 'bike_marker.dart';

const _routeGreen = Color(0xFF2E7D32);

/// Map with the rider's bike marker gliding between GPS fixes (≈1 s), rotated by
/// heading, plus the route polyline, dark store and delivery location.
class LiveTrackingMap extends StatefulWidget {
  const LiveTrackingMap({
    super.key,
    this.driver,
    this.heading,
    this.store,
    this.destination,
    this.route = const [],
    this.height = 300,
  });

  final LatLng? driver;
  final double? heading;
  final LatLng? store;
  final LatLng? destination;
  final List<LatLng> route;
  final double height;

  @override
  State<LiveTrackingMap> createState() => _LiveTrackingMapState();
}

class _LiveTrackingMapState extends State<LiveTrackingMap> with SingleTickerProviderStateMixin {
  late final AnimationController _move = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1000),
  )..addListener(_onTick);

  GoogleMapController? _map;
  BitmapDescriptor? _bikeIcon;
  bool _iconRequested = false;
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
    _shown = widget.driver;
    _shownHeading = widget.heading ?? 0;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_iconRequested) return;
    _iconRequested = true;
    BikeMarker.descriptor(MediaQuery.devicePixelRatioOf(context)).then((icon) {
      if (mounted) setState(() => _bikeIcon = icon);
    });
  }

  @override
  void didUpdateWidget(covariant LiveTrackingMap oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = widget.driver;
    if (next != null && next != oldWidget.driver) {
      _animateTo(next, widget.heading);
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
    _map?.dispose();
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
    _toHeading = heading ?? (_metersBetween(current, target) > 3 ? _bearing(current, target) : _shownHeading);
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
    final map = _map;
    if (map == null || _userMoved) return;
    final points = <LatLng>[
      if (include != null) include else if (_shown != null) _shown!,
      ?widget.destination,
      if (_shown == null && include == null && widget.store != null) widget.store!,
    ];
    if (points.isEmpty) return;
    if (points.length == 1) {
      map.animateCamera(CameraUpdate.newLatLngZoom(points.first, 15));
      return;
    }
    var south = points.first.latitude, north = south;
    var west = points.first.longitude, east = west;
    for (final p in points) {
      south = math.min(south, p.latitude);
      north = math.max(north, p.latitude);
      west = math.min(west, p.longitude);
      east = math.max(east, p.longitude);
    }
    if ((north - south).abs() < 0.0005 && (east - west).abs() < 0.0005) {
      map.animateCamera(CameraUpdate.newLatLngZoom(points.first, 16));
      return;
    }
    map.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(southwest: LatLng(south, west), northeast: LatLng(north, east)),
        64,
      ),
    );
  }

  void _recenter() {
    setState(() => _userMoved = false);
    _fitCamera();
  }

  Set<Marker> _markers() {
    return {
      if (widget.store != null && _shown == null)
        Marker(
          markerId: const MarkerId('store'),
          position: widget.store!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: const InfoWindow(title: 'Dark store'),
        ),
      if (widget.destination != null)
        Marker(
          markerId: const MarkerId('destination'),
          position: widget.destination!,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: const InfoWindow(title: 'Delivery location'),
        ),
      if (_shown != null)
        Marker(
          markerId: const MarkerId('driver'),
          position: _shown!,
          rotation: _shownHeading,
          flat: true,
          anchor: const Offset(0.5, 0.5),
          zIndexInt: 3,
          icon: _bikeIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        ),
    };
  }

  @override
  Widget build(BuildContext context) {
    final initialTarget = _shown ?? widget.store ?? widget.destination ?? const LatLng(20.5937, 78.9629);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: SizedBox(
        height: widget.height,
        child: Stack(
          children: [
            Listener(
              onPointerDown: (_) {
                if (!_userMoved) setState(() => _userMoved = true);
              },
              child: GoogleMap(
                initialCameraPosition: CameraPosition(target: initialTarget, zoom: 14),
                markers: _markers(),
                polylines: {
                  if (widget.route.length >= 2)
                    Polyline(
                      polylineId: const PolylineId('route'),
                      points: widget.route,
                      color: _routeGreen,
                      width: 5,
                      startCap: Cap.roundCap,
                      endCap: Cap.roundCap,
                      jointType: JointType.round,
                    ),
                },
                myLocationButtonEnabled: false,
                zoomControlsEnabled: false,
                mapToolbarEnabled: false,
                compassEnabled: false,
                tiltGesturesEnabled: false,
                gestureRecognizers: <Factory<OneSequenceGestureRecognizer>>{
                  Factory<OneSequenceGestureRecognizer>(() => EagerGestureRecognizer()),
                },
                onMapCreated: (controller) {
                  _map = controller;
                  WidgetsBinding.instance.addPostFrameCallback((_) => _fitCamera());
                },
              ),
            ),
            if (_userMoved)
              Positioned(
                right: 10,
                bottom: 10,
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

double _metersBetween(LatLng a, LatLng b) {
  const r = 6371000.0;
  final dLat = _rad(b.latitude - a.latitude);
  final dLng = _rad(b.longitude - a.longitude);
  final h = math.sin(dLat / 2) * math.sin(dLat / 2) +
      math.cos(_rad(a.latitude)) * math.cos(_rad(b.latitude)) * math.sin(dLng / 2) * math.sin(dLng / 2);
  return 2 * r * math.asin(math.min(1, math.sqrt(h)));
}

double _bearing(LatLng from, LatLng to) {
  final y = math.sin(_rad(to.longitude - from.longitude)) * math.cos(_rad(to.latitude));
  final x = math.cos(_rad(from.latitude)) * math.sin(_rad(to.latitude)) -
      math.sin(_rad(from.latitude)) * math.cos(_rad(to.latitude)) * math.cos(_rad(to.longitude - from.longitude));
  return (math.atan2(y, x) * 180 / math.pi + 360) % 360;
}

double _rad(double deg) => deg * math.pi / 180;
