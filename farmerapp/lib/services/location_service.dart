import 'dart:async';
import 'dart:convert';

import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

import './app_language.dart';
/// A chosen farm location with geocoded address details.
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

  bool get hasAddress => village.isNotEmpty || district.isNotEmpty || formattedAddress.isNotEmpty;

  String get shortLabel {
    final parts = [village, taluka, district].where((s) => s.isNotEmpty).toList();
    if (parts.isNotEmpty) return parts.join(', ');
    return '${latitude.toStringAsFixed(5)}°, ${longitude.toStringAsFixed(5)}°';
  }

  FarmGeoLocation withCoordinates(double lat, double lng) => FarmGeoLocation(
        latitude: lat,
        longitude: lng,
        village: village,
        taluka: taluka,
        district: district,
        state: state,
        pincode: pincode,
        formattedAddress: formattedAddress,
      );
}

enum LocationFailureKind { serviceDisabled, denied, deniedForever, timeout, unknown }

class LocationFailure implements Exception {
  final LocationFailureKind kind;
  final String message;
  const LocationFailure(this.kind, this.message);

  bool get canOpenSettings =>
      kind == LocationFailureKind.serviceDisabled || kind == LocationFailureKind.deniedForever;

  Future<void> openSettings() async {
    if (kind == LocationFailureKind.serviceDisabled) {
      await Geolocator.openLocationSettings();
    } else {
      await Geolocator.openAppSettings();
    }
  }

  @override
  String toString() => message;
}

class FarmLocationService {
  FarmLocationService._();

  /// Nominatim's usage policy requires an identifying User-Agent and at most ~1 request/second,
  /// so callers debounce reverse lookups while the map is moving.
  static const String _userAgent = 'GreenGrooFarmerApp/1.0 (com.greengroo.farmerapp; info@greengrocc.com)';
  static const String _nominatim = 'https://nominatim.openstreetmap.org';

  /// Current device position, asking for permission when needed.
  static Future<Position> currentPosition() async {
    if (!await Geolocator.isLocationServiceEnabled()) {
      throw LocationFailure(
        LocationFailureKind.serviceDisabled,
        AppLanguage().tr(mr: 'फोनचे लोकेशन (GPS) बंद आहे. कृपया चालू करा.', en: 'Location is turned off. Please turn on GPS.'),
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied) {
      throw LocationFailure(
        LocationFailureKind.denied,
        AppLanguage().tr(mr: 'लोकेशन परवानगी नाकारली. पुन्हा प्रयत्न करा.', en: 'Location permission denied. Please try again.'),
      );
    }
    if (permission == LocationPermission.deniedForever) {
      throw LocationFailure(
        LocationFailureKind.deniedForever,
        AppLanguage().tr(mr: 'लोकेशन परवानगी बंद आहे. सेटिंग्जमध्ये जाऊन परवानगी द्या.', en: 'Location permission is blocked. Allow it in Settings.'),
      );
    }

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 20),
        ),
      );
    } on TimeoutException {
      final last = await Geolocator.getLastKnownPosition();
      if (last != null) return last;
      throw LocationFailure(
        LocationFailureKind.timeout,
        AppLanguage().tr(mr: 'GPS सिग्नल मिळाला नाही. मोकळ्या जागेत जाऊन पुन्हा प्रयत्न करा.', en: 'Could not get a GPS fix. Try again in the open.'),
      );
    } catch (e) {
      if (e is LocationFailure) rethrow;
      throw LocationFailure(LocationFailureKind.unknown, AppLanguage().tr(mr: 'लोकेशन मिळाले नाही: $e', en: 'Could not get location: $e'));
    }
  }

  static Future<FarmGeoLocation?> reverseGeocode(double lat, double lng) async {
    try {
      final uri = Uri.parse(
        '$_nominatim/reverse?format=jsonv2&lat=$lat&lon=$lng&zoom=18&addressdetails=1&accept-language=en',
      );
      final res = await http.get(uri, headers: const {'User-Agent': _userAgent}).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return null;
      final data = jsonDecode(res.body);
      if (data is! Map<String, dynamic> || data['error'] != null) return null;
      return _fromNominatim(data, lat, lng);
    } catch (_) {
      return null;
    }
  }

  static Future<List<FarmGeoLocation>> search(String query) async {
    final q = query.trim();
    if (q.length < 2) return const [];
    try {
      final uri = Uri.parse(
        '$_nominatim/search?format=jsonv2&q=${Uri.encodeComponent(q)}&addressdetails=1&countrycodes=in&limit=6&accept-language=en',
      );
      final res = await http.get(uri, headers: const {'User-Agent': _userAgent}).timeout(const Duration(seconds: 8));
      if (res.statusCode != 200) return const [];
      final list = jsonDecode(res.body);
      if (list is! List) return const [];
      return list.whereType<Map<String, dynamic>>().map((item) {
        final lat = double.tryParse('${item['lat']}') ?? 0;
        final lng = double.tryParse('${item['lon']}') ?? 0;
        return _fromNominatim(item, lat, lng);
      }).where((g) => g.latitude != 0 || g.longitude != 0).toList();
    } catch (_) {
      return const [];
    }
  }

  static FarmGeoLocation _fromNominatim(Map<String, dynamic> data, double lat, double lng) {
    final addr = (data['address'] as Map?)?.cast<String, dynamic>() ?? const {};
    String pick(List<String> keys) {
      for (final k in keys) {
        final v = addr[k]?.toString().trim() ?? '';
        if (v.isNotEmpty) return v;
      }
      return '';
    }

    return FarmGeoLocation(
      latitude: lat,
      longitude: lng,
      village: pick(['village', 'hamlet', 'town', 'suburb', 'neighbourhood', 'city']),
      taluka: _stripSuffix(pick(['county', 'subdistrict', 'municipality', 'city_district'])),
      district: _stripSuffix(pick(['state_district', 'district', 'city'])),
      state: pick(['state']).isNotEmpty ? pick(['state']) : 'Maharashtra',
      pincode: pick(['postcode']).replaceAll(' ', ''),
      formattedAddress: (data['display_name'] ?? '').toString(),
    );
  }

  static String _stripSuffix(String value) => value
      .replaceAll(RegExp(r'\s+(Taluka|Tahsil|Tehsil|Subdistrict|District)$', caseSensitive: false), '')
      .trim();
}
