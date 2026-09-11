import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;

import '../../../core/config/api_config.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _loading = true;
  String? _error;
  String _todayDate = '';
  String _online = '0h 0m';
  int _trips = 0;
  int _shiftsBooked = 0;
  int _shiftsCompleted = 0;
  List<_DayBox> _days = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await http.get(
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.attendanceToday}'),
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) {
        throw Exception('Failed to load attendance');
      }
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      final daysRaw = (body['calendarDays'] as List?) ?? const [];
      if (!mounted) return;
      setState(() {
        _loading = false;
        _todayDate = body['date']?.toString() ?? '';
        _online = body['totalOnlineFormatted']?.toString() ?? '0h 0m';
        _trips = (body['totalTrips'] as num?)?.toInt() ?? 0;
        _shiftsBooked = (body['shiftsBooked'] as num?)?.toInt() ?? 0;
        _shiftsCompleted = (body['shiftsCompleted'] as num?)?.toInt() ?? 0;
        _days = daysRaw
            .whereType<Map>()
            .map((e) => _DayBox.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load attendance. Pull to retry.';
      });
    }
  }

  void _showDayDetails(_DayBox day) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.border,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '${day.dayLabel} · ${day.date}',
                style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _DetailTile(
                      icon: Icons.schedule_outlined,
                      label: 'Online time',
                      value: day.onlineTime,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DetailTile(
                      icon: Icons.delivery_dining_outlined,
                      label: 'Total trips',
                      value: '${day.trips}',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _DetailTile(
                      icon: Icons.event_available_outlined,
                      label: 'Shifts booked',
                      value: '${day.shiftsBooked}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _DetailTile(
                      icon: Icons.check_circle_outline,
                      label: 'Completed',
                      value: '${day.shiftsCompleted}',
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.attendance,
        subtitle: _todayDate.isEmpty
            ? l10n.trackWorkingHours
            : 'Today · $_todayDate',
        showBackButton: true,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? ListView(
                children: const [
                  SizedBox(height: 160),
                  Center(child: CircularProgressIndicator()),
                ],
              )
            : _error != null
                ? ListView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    children: [
                      DashboardCard(
                        child: Column(
                          children: [
                            Text(_error!, textAlign: TextAlign.center),
                            const SizedBox(height: 12),
                            TextButton(onPressed: _load, child: const Text('Retry')),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    children: [
                      Text(
                        'Today’s progress',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Shifts booked',
                              value: '$_shiftsBooked',
                              icon: Icons.event_available_outlined,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: _StatCard(
                              title: 'Completed',
                              value: '$_shiftsCompleted',
                              icon: Icons.check_circle_outline,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      Row(
                        children: [
                          Expanded(
                            child: _StatCard(
                              title: 'Online time',
                              value: _online,
                              icon: Icons.schedule_outlined,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: _StatCard(
                              title: 'Total trips',
                              value: '$_trips',
                              icon: Icons.delivery_dining_outlined,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        'This week',
                        style: GoogleFonts.inter(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Tap a day box to see online time and trips',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _days.length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 0.92,
                        ),
                        itemBuilder: (context, index) {
                          final day = _days[index];
                          return InkWell(
                            onTap: () => _showDayDetails(day),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: day.isToday
                                    ? AppColors.primarySoft
                                    : AppColors.surface,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: day.isToday
                                      ? AppColors.primary
                                      : AppColors.border,
                                  width: day.isToday ? 1.6 : 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.shadow,
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    day.dayLabel,
                                    style: GoogleFonts.inter(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    day.dayNum,
                                    style: GoogleFonts.inter(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w800,
                                      color: day.isToday
                                          ? AppColors.primaryDark
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${day.trips} trip${day.trips == 1 ? '' : 's'}',
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      color: AppColors.textMuted,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
      ),
    );
  }
}

class _DetailTile extends StatelessWidget {
  const _DetailTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.cardSubBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardSubBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
  });

  final String title;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return DashboardCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.primary),
          const SizedBox(height: AppSpacing.sm),
          Text(title, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 4),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
        ],
      ),
    );
  }
}

class _DayBox {
  const _DayBox({
    required this.date,
    required this.dayLabel,
    required this.dayNum,
    required this.isToday,
    required this.onlineTime,
    required this.trips,
    required this.shiftsBooked,
    required this.shiftsCompleted,
  });

  final String date;
  final String dayLabel;
  final String dayNum;
  final bool isToday;
  final String onlineTime;
  final int trips;
  final int shiftsBooked;
  final int shiftsCompleted;

  factory _DayBox.fromJson(Map<String, dynamic> json) {
    final date = json['date']?.toString() ?? '';
    return _DayBox(
      date: date,
      dayLabel: json['dayLabel']?.toString() ?? '',
      dayNum: json['dayNum']?.toString() ??
          (date.contains('-') ? date.split('-').last : date),
      isToday: json['isToday'] == true,
      onlineTime: json['totalOnlineFormatted']?.toString() ?? '0m',
      trips: (json['totalTrips'] as num?)?.toInt() ?? 0,
      shiftsBooked: (json['shiftsBooked'] as num?)?.toInt() ?? 0,
      shiftsCompleted: (json['shiftsCompleted'] as num?)?.toInt() ?? 0,
    );
  }
}
