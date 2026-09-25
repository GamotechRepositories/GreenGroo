import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/dark_store.dart';
import 'app_providers.dart';

class DeliveryLocation {
  const DeliveryLocation({
    this.latitude,
    this.longitude,
    this.state,
    this.city,
    this.area,
    this.pincode,
    this.address,
    this.label,
  });

  final double? latitude;
  final double? longitude;
  final String? state;
  final String? city;
  final String? area;
  final String? pincode;
  final String? address;
  final String? label;

  bool get hasLocation =>
      (latitude != null && longitude != null) ||
      (pincode != null && pincode!.isNotEmpty) ||
      (city != null && city!.isNotEmpty);

  String get displayAddress {
    if (address != null && address!.isNotEmpty) return address!;
    final parts = <String>[];
    if (area != null && area!.isNotEmpty) parts.add(area!);
    if (city != null && city!.isNotEmpty) parts.add(city!);
    if (pincode != null && pincode!.isNotEmpty) parts.add(pincode!);
    if (parts.isNotEmpty) return parts.join(', ');
    return label ?? 'Select location to see nearby stock';
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    if (latitude != null) params['lat'] = latitude;
    if (longitude != null) params['lng'] = longitude;
    if (city != null && city!.isNotEmpty) params['city'] = city;
    if (area != null && area!.isNotEmpty) params['area'] = area;
    if (pincode != null && pincode!.isNotEmpty) params['pincode'] = pincode;
    if (address != null && address!.isNotEmpty) params['address'] = address;
    return params;
  }

  String get locationKey {
    return [
      latitude?.toString() ?? '',
      longitude?.toString() ?? '',
      city ?? '',
      area ?? '',
      pincode ?? '',
    ].where((e) => e.isNotEmpty).join('|');
  }

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'city': city,
        'state': state,
        'area': area,
        'pincode': pincode,
        'address': address,
        'label': label,
      };

  factory DeliveryLocation.fromJson(Map<String, dynamic> json) {
    return DeliveryLocation(
      latitude: (json['latitude'] ?? json['lat']) != null
          ? double.tryParse((json['latitude'] ?? json['lat']).toString())
          : null,
      longitude: (json['longitude'] ?? json['lng']) != null
          ? double.tryParse((json['longitude'] ?? json['lng']).toString())
          : null,
      city: json['city']?.toString(),
      state: json['state']?.toString(),
      area: json['area']?.toString(),
      pincode: json['pincode']?.toString(),
      address: json['address']?.toString(),
      label: json['label']?.toString(),
    );
  }
}

const _storageKey = 'greengrocc_delivery_location';

class LocationNotifier extends Notifier<DeliveryLocation?> {
  @override
  DeliveryLocation? build() {
    _loadFromStorage();
    return null;
  }

  Future<void> _loadFromStorage() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        state = DeliveryLocation.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      }
    } catch (_) {}
  }

  Future<void> setLocation(DeliveryLocation location) async {
    state = location;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_storageKey, jsonEncode(location.toJson()));
    } catch (_) {}
  }

  Future<void> clearLocation() async {
    state = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKey);
    } catch (_) {}
  }
}

final deliveryLocationProvider =
    NotifierProvider<LocationNotifier, DeliveryLocation?>(LocationNotifier.new);

final nearestStoreProvider = FutureProvider<NearestStoreResult>((ref) async {
  final location = ref.watch(deliveryLocationProvider);
  final api = ref.watch(apiServiceProvider);
  return api.fetchNearestStore(location?.toQueryParams());
});
