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
  });

  final double latitude;
  final double longitude;
  final String city;
  final String state;
  final String area;
  final String pincode;
  final String address;
  final String label;

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

/// Phone GPS + `/api/location/reverse`, same path as the website.
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

  final Position position;
  try {
    position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 18),
      ),
    );
  } catch (_) {
    throw PhoneLocationException(
      'Could not determine your position. Try again outdoors or near a window.',
    );
  }

  Map<String, dynamic>? geo;
  try {
    geo = await api.reverseGeocode(lat: position.latitude, lng: position.longitude);
  } catch (_) {
    geo = null;
  }

  String text(String key) => geo?[key]?.toString().trim() ?? '';

  return PhoneLocation(
    latitude: position.latitude,
    longitude: position.longitude,
    city: text('city'),
    state: text('state'),
    area: text('area'),
    pincode: text('pincode').replaceAll(RegExp(r'\D'), ''),
    address: text('address'),
    label: text('label').isNotEmpty ? text('label') : 'Current location',
  );
}
