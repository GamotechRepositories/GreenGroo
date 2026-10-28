import 'package:geolocator/geolocator.dart';

import '../../services/api_service.dart';
import '../providers/location_provider.dart';

class PhoneLocationException implements Exception {
  PhoneLocationException(this.message);

  final String message;

  @override
  String toString() => message;
}

class PhoneLocation {
  const PhoneLocation({
    required this.latitude,
    required this.longitude,
    this.city = '',
    this.state = '',
    this.area = '',
    this.pincode = '',
    this.address = '',
    this.label = 'Current location',
    this.accuracy,
  });

  final double latitude;
  final double longitude;
  final String city;
  final String state;
  final String area;
  final String pincode;
  final String address;
  final String label;
  final double? accuracy;

  String get displayLine {
    final line = [area, city, state, pincode].where((part) => part.isNotEmpty).join(', ');
    if (line.isNotEmpty) return line;
    if (address.isNotEmpty) return address;
    return label;
  }

  DeliveryLocation toDeliveryLocation() {
    return DeliveryLocation(
      latitude: latitude,
      longitude: longitude,
      state: state,
      city: city,
      area: area,
      pincode: pincode,
      address: address.isNotEmpty ? address : displayLine,
      label: label,
    );
  }
}

/// Phone GPS + `/api/location/reverse`, with strict GPS accuracy validation and error handling.
Future<PhoneLocation> detectPhoneLocation(ApiService api) async {
  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    throw PhoneLocationException('Turn on location on your phone and try again.');
  }

  var permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
  }
  if (permission == LocationPermission.denied) {
    throw PhoneLocationException('Allow location access to detect your address.');
  }
  if (permission == LocationPermission.deniedForever) {
    throw PhoneLocationException(
      'Location permission is blocked. Enable it in your phone settings.',
    );
  }

  Position position;
  try {
    position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        timeLimit: Duration(seconds: 15),
      ),
    );
  } catch (_) {
    throw PhoneLocationException(
      'Could not determine your position. Try again outdoors or near a window.',
    );
  }

  // If the initial fix is coarse (e.g. cell tower accuracy > 100m) or stale (> 3 minutes old),
  // attempt to acquire a fresh, high-accuracy fix from the GPS stream.
  final isStale = DateTime.now().difference(position.timestamp) > const Duration(minutes: 3);
  if (position.accuracy > 100 || isStale) {
    try {
      final fresh = await Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          distanceFilter: 0,
        ),
      ).firstWhere(
        (pos) => pos.accuracy <= 100,
      ).timeout(const Duration(seconds: 6));
      position = fresh;
    } catch (_) {
      // Keep best position available
    }
  }

  // Reject fixes that have insufficient accuracy for urban delivery (e.g. > 250m)
  if (position.accuracy > 250) {
    throw PhoneLocationException(
      'GPS accuracy is insufficient (±${position.accuracy.round()}m) for precise delivery. Please move outdoors or select your address manually.',
    );
  }

  Map<String, dynamic>? geo;
  try {
    geo = await api.reverseGeocode(lat: position.latitude, lng: position.longitude);
  } catch (_) {
    throw PhoneLocationException(
      'Unable to reach server to resolve your address. Check your connection or select manually.',
    );
  }

  if (geo == null || geo.isEmpty) {
    throw PhoneLocationException(
      'Could not resolve an address for your current coordinates. Please select or enter your address manually.',
    );
  }

  String text(String key) => geo?[key]?.toString().trim() ?? '';
  final pincode = text('pincode').replaceAll(RegExp(r'\D'), '');

  // Ensure that reverse geocoding resolved a valid 6-digit PIN code for these coordinates
  final bool isValidPin = pincode.length == 6 && (geo['pincodeValid'] == true || geo['pincodeValid'] == null);
  if (!isValidPin) {
    throw PhoneLocationException(
      'Could not reliably determine the PIN code for this location. Please confirm your address manually.',
    );
  }

  final area = text('area');
  final city = text('city');
  final state = text('state');
  final address = text('address');
  final label = text('label').isNotEmpty ? text('label') : (area.isNotEmpty ? area : 'Current location');

  return PhoneLocation(
    latitude: position.latitude,
    longitude: position.longitude,
    city: city,
    state: state,
    area: area,
    pincode: pincode,
    address: address,
    label: label,
    accuracy: position.accuracy,
  );
}
