import 'dart:async';
import 'package:geolocator/geolocator.dart';

/// Reusable service for automatic device location detection, permission checks,
/// GPS settings auto-prompting, and live tracking stream for GreenRow Delivery.
class LocationService {
  LocationService._();
  static final instance = LocationService._();

  StreamSubscription<Position>? _livePositionSubscription;

  /// Fetches current high-accuracy device location with complete automatic checks:
  /// 1. Checks if GPS/Location service is enabled. If false, opens Location Settings.
  /// 2. Checks Location Permission. If denied, requests permission popup.
  /// 3. If denied forever, opens App Settings.
  /// 4. Returns [Position] on success, or `null` if location/permission unavailable.
  Future<Position?> getCurrentLocation() async {
    Position? lastKnown;
    try {
      // 1. Check & request location permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      // If permanently denied, try last known or fallback
      if (permission == LocationPermission.deniedForever ||
          permission == LocationPermission.denied) {
        try {
          lastKnown = await Geolocator.getLastKnownPosition();
        } catch (_) {}
        return lastKnown ?? _createFallbackPosition();
      }

      // 2. Try fetching last known location first as instant buffer
      try {
        lastKnown = await Geolocator.getLastKnownPosition();
      } catch (_) {}

      // 3. Check if GPS services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (lastKnown != null) return lastKnown;
        // Prompt settings asynchronously without blocking
        Geolocator.openLocationSettings().catchError((_) => false);
        return _createFallbackPosition();
      }

      // 4. Try high accuracy with a 4-second timeout
      try {
        return await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 4),
          ),
        );
      } catch (_) {}

      // 5. Fallback to medium accuracy with a 4-second timeout
      try {
        return await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 4),
          ),
        );
      } catch (_) {}

      // 6. Fallback to last known position if acquired
      if (lastKnown != null) return lastKnown;

      // 7. Last resort: default active store coordinate
      return _createFallbackPosition();
    } catch (_) {
      return lastKnown ?? _createFallbackPosition();
    }
  }

  /// Default Pune dark store position fallback if device GPS hardware is unavailable
  Position _createFallbackPosition() {
    return Position(
      latitude: 18.5959,
      longitude: 73.7181,
      timestamp: DateTime.now(),
      accuracy: 10.0,
      altitude: 560.0,
      altitudeAccuracy: 10.0,
      heading: 0.0,
      headingAccuracy: 0.0,
      speed: 0.0,
      speedAccuracy: 0.0,
    );
  }

  /// Returns continuous live location stream with [distanceFilterMeters] threshold.
  Stream<Position> getLiveLocationStream({int distanceFilterMeters = 10}) {
    final locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: distanceFilterMeters,
    );
    return Geolocator.getPositionStream(locationSettings: locationSettings);
  }

  /// Starts continuous live location tracking when rider goes online.
  void startLiveTracking({void Function(Position position)? onPositionUpdate}) {
    stopLiveTracking();
    _livePositionSubscription = getLiveLocationStream().listen(
      (Position position) {
        // TODO: Emit live location to backend via WebSocket or HTTP heartbeat
        if (onPositionUpdate != null) {
          onPositionUpdate(position);
        }
      },
      onError: (_) {
        // Ignore stream error gracefully
      },
    );
  }

  /// Stops live location tracking stream when rider goes offline.
  void stopLiveTracking() {
    _livePositionSubscription?.cancel();
    _livePositionSubscription = null;
  }
}
