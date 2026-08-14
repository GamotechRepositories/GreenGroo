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
    try {
      // 1. Check if GPS/Location services are enabled on device
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        // Open location settings for user to enable GPS
        await Geolocator.openLocationSettings();
        // Re-check after user returns from settings
        serviceEnabled = await Geolocator.isLocationServiceEnabled();
        if (!serviceEnabled) {
          return null;
        }
      }

      // 2. Check location permission status
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      // 3. Handle permanently denied permission
      if (permission == LocationPermission.deniedForever) {
        await Geolocator.openAppSettings();
        return null;
      }

      // 4. Fetch position with high accuracy
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 15),
        ),
      );
    } catch (_) {
      return null;
    }
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
