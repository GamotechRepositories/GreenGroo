import 'dart:convert';

import '../../core/config/api_config.dart';
import '../services/auth_service.dart';

class ShiftSlot {
  const ShiftSlot({
    required this.slot,
    required this.label,
    required this.start,
    required this.end,
  });

  final String slot;
  final String label;
  final String start;
  final String end;

  factory ShiftSlot.fromJson(Map<String, dynamic> json) => ShiftSlot(
        slot: json['slot'] as String? ?? '',
        label: json['label'] as String? ?? '',
        start: json['start'] as String? ?? '',
        end: json['end'] as String? ?? '',
      );
}

class ShiftBooking {
  const ShiftBooking({
    required this.slot,
    required this.label,
    required this.start,
    required this.end,
    required this.date,
  });

  final String slot;
  final String label;
  final String start;
  final String end;
  final DateTime? date;

  factory ShiftBooking.fromJson(Map<String, dynamic>? json) {
    if (json == null || (json['slot'] as String?)?.isEmpty != false) {
      return const ShiftBooking(
        slot: '',
        label: '',
        start: '',
        end: '',
        date: null,
      );
    }
    return ShiftBooking(
      slot: json['slot'] as String? ?? '',
      label: json['label'] as String? ?? json['slot'] as String? ?? '',
      start: json['start'] as String? ?? '',
      end: json['end'] as String? ?? '',
      date: json['date'] != null ? DateTime.tryParse(json['date'].toString()) : null,
    );
  }

  bool get hasBooking => slot.isNotEmpty;
}

/// Fetches shift slots and bookings from the backend.
class RiderLiveService {
  RiderLiveService._();
  static final instance = RiderLiveService._();

  List<ShiftSlot> _cachedSlots = const [];
  ShiftBooking? _cachedBooking;
  int _todayOnlineMinutes = 0;
  bool _isPeak = false;

  List<ShiftSlot> get slots => _cachedSlots;
  ShiftBooking? get booking => _cachedBooking;
  int get todayOnlineMinutes => _todayOnlineMinutes;
  bool get isPeak => _isPeak;

  String get formattedOnlineToday {
    final h = _todayOnlineMinutes ~/ 60;
    final m = _todayOnlineMinutes % 60;
    if (h == 0) return '${m}m';
    if (m == 0) return '${h}h';
    return '${h}h ${m}m';
  }

  String get loginHoursToday {
    final h = _todayOnlineMinutes ~/ 60;
    final m = _todayOnlineMinutes % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }

  Future<List<ShiftSlot>> fetchShiftSlots() async {
    try {
      final res = await apiGet(ApiConfig.shifts);
      if (res.statusCode != 200) return _cachedSlots;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final list = body['shifts'] as List<dynamic>? ?? [];
      _cachedSlots = list
          .map((e) => ShiftSlot.fromJson(e as Map<String, dynamic>))
          .toList();
      return _cachedSlots;
    } catch (_) {
      return _cachedSlots;
    }
  }

  Future<ShiftBooking?> fetchMyBooking() async {
    if (!AuthService.instance.isLoggedIn) return null;
    final id = AuthService.instance.deliveryBoy?.id;
    if (id == null) return null;
    try {
      final res = await apiGet(
        '${ApiConfig.shiftBooking}/$id',
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) return _cachedBooking;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      _cachedBooking = ShiftBooking.fromJson(
        body['shiftBooking'] as Map<String, dynamic>?,
      );
      return _cachedBooking;
    } catch (_) {
      return _cachedBooking;
    }
  }

  Future<bool> bookShift(String slot, DateTime date) async {
    try {
      final res = await apiPost(
        ApiConfig.shiftBooking,
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({
          'slot': slot,
          'date': date.toIso8601String().split('T').first,
        }),
      );
      if (res.statusCode != 200) return false;
      await fetchMyBooking();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> cancelShiftBooking() async {
    try {
      final res = await apiPost(
        ApiConfig.shiftBooking,
        headers: AuthService.instance.authHeaders,
        body: jsonEncode({'cancel': true}),
      );
      if (res.statusCode != 200) return false;
      _cachedBooking = null;
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> refreshLoginHours() async {
    if (!AuthService.instance.isLoggedIn) return;
    final id = AuthService.instance.deliveryBoy?.id;
    if (id == null) return;
    try {
      final res = await apiGet(
        '${ApiConfig.loginHours}?riderId=$id',
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) return;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      _todayOnlineMinutes = body['totalMinutes'] as int? ?? 0;
    } catch (_) {}
  }

  void applyStatusResponse(Map<String, dynamic> body) {
    _todayOnlineMinutes = body['todayOnlineMinutes'] as int? ?? _todayOnlineMinutes;
    _isPeak = body['isPeak'] as bool? ?? _isPeak;
  }

  Future<void> refreshPeakHours(String storeId) async {
    if (storeId.isEmpty) return;
    try {
      final res = await apiGet('${ApiConfig.peakHours}?storeId=$storeId');
      if (res.statusCode != 200) return;
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      _isPeak = body['isPeak'] as bool? ?? false;
    } catch (_) {}
  }

  Future<TodayProgressData> fetchTodayProgress() async {
    if (!AuthService.instance.isLoggedIn) return TodayProgressData.fallback;
    try {
      final res = await apiGet(
        ApiConfig.homeProgress,
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        if (body['success'] == true && body['data'] != null) {
          return TodayProgressData.fromJson(body['data'] as Map<String, dynamic>);
        }
      }
    } catch (_) {}
    return TodayProgressData.fallback;
  }
}

class TodayProgressData {
  const TodayProgressData({
    this.todayEarnings = 0,
    this.completedTrips = 0,
    this.onlineMinutes = 0,
    this.onlineTime = '0h 0m',
    this.bookedShifts = 0,
    this.completedShifts = 0,
  });

  final int todayEarnings;
  final int completedTrips;
  final int onlineMinutes;
  final String onlineTime;
  final int bookedShifts;
  final int completedShifts;

  factory TodayProgressData.fromJson(Map<String, dynamic> json) {
    final mins = (json['onlineMinutes'] as num?)?.toInt() ?? 0;
    final h = mins ~/ 60;
    final m = mins % 60;
    final timeStr = json['onlineTime']?.toString() ?? '${h}h ${m}m';

    final booked = (json['bookedShifts'] as num?)?.toInt() ??
        (json['shiftsBooked'] as num?)?.toInt() ??
        (json['bookedShiftsCount'] as num?)?.toInt() ??
        0;
    final completed = (json['completedShifts'] as num?)?.toInt() ??
        (json['completedShiftsCount'] as num?)?.toInt() ??
        0;

    return TodayProgressData(
      todayEarnings: (json['todayEarnings'] as num?)?.toInt() ?? 0,
      completedTrips: (json['completedTrips'] as num?)?.toInt() ?? 0,
      onlineMinutes: mins,
      onlineTime: timeStr,
      bookedShifts: booked,
      completedShifts: completed,
    );
  }

  static const fallback = TodayProgressData();
}
