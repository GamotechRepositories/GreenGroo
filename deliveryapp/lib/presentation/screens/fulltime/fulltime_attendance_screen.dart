import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/services/fulltime_service.dart';
import '../../../data/services/location_service.dart';
import 'fulltime_widgets.dart';

class FullTimeAttendanceScreen extends StatefulWidget {
  const FullTimeAttendanceScreen({super.key});

  @override
  State<FullTimeAttendanceScreen> createState() => _FullTimeAttendanceScreenState();
}

class _FullTimeAttendanceScreenState extends State<FullTimeAttendanceScreen> {
  bool _loading = true;
  bool _marking = false;
  String? _error;
  Map<String, dynamic> _data = const {};

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
      final data = await FullTimeService.instance.fetchAttendanceToday();
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is FullTimeApiException ? e.message : 'Could not load attendance. Please try again.';
        _loading = false;
      });
    }
  }

  Future<void> _mark() async {
    setState(() => _marking = true);
    try {
      final requirement = _data['requirement'] as Map?;
      final needsGps = requirement?['requireLocationValidation'] == true;
      final pos = await LocationService.instance.getCurrentLocation();
      if (pos == null && needsGps) {
        throw FullTimeApiException(
          'Location is required to mark attendance. Please enable GPS and allow location access.',
        );
      }
      final res = await FullTimeService.instance.markAttendance(
        lat: pos?.latitude,
        lng: pos?.longitude,
      );
      if (!mounted) return;
      final penalised = (((res['attendance'] as Map?)?['latePenalty'] as num?) ?? 0) > 0;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Attendance marked'),
          backgroundColor: penalised ? AppColors.warning : AppColors.success,
          duration: Duration(seconds: penalised ? 6 : 4),
        ),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e is FullTimeApiException ? e.message : 'Could not mark attendance'),
          backgroundColor: AppColors.error,
          duration: const Duration(seconds: 4),
        ),
      );
    } finally {
      if (mounted) setState(() => _marking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: fullTimeAppBar('Attendance', onRefresh: _load),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? FtErrorView(message: _error!, onRetry: _load)
              : RefreshIndicator(onRefresh: _load, child: _content()),
    );
  }

  Widget _content() {
    final attendance = (_data['attendance'] as Map?) ?? const {};
    final requirement = _data['requirement'] as Map?;
    final shift = _data['shift'] as Map?;
    final darkStore = _data['darkStore'] as Map?;
    final month = _data['month'] as Map?;
    final status = _data['todayStatus']?.toString() ?? attendance['status']?.toString() ?? 'pending';
    final canMark = _data['canMark'] == true;
    final phase = _data['windowPhase']?.toString() ?? '';
    final markedAt = DateTime.tryParse(attendance['markedAt']?.toString() ?? '')?.toLocal();
    final distance = attendance['distanceFromStoreMeters'] as num?;
    final lateMinutes = (attendance['lateMinutes'] as num?) ?? 0;
    final payroll = _data['payroll'] as Map?;
    final policy = _data['payPolicy'] as Map?;
    final lateOn = policy?['latePenaltyEnabled'] == true;
    final lateAfter = (policy?['lateAfterMinutes'] as num?) ?? 120;
    final latePenalised = lateOn && lateMinutes >= lateAfter;

    String hint = '';
    if (status == 'present' && markedAt != null) {
      final hh = markedAt.hour % 12 == 0 ? 12 : markedAt.hour % 12;
      final mm = markedAt.minute.toString().padLeft(2, '0');
      hint = 'Marked at $hh:$mm ${markedAt.hour >= 12 ? 'PM' : 'AM'}'
          '${distance != null ? ' · ${distance.round()}m from store' : ''}'
          '${lateMinutes > 0 ? ' · ${formatMinutes(lateMinutes)} late' : ''}'
          '${latePenalised ? ' (${formatRupees(policy?['latePenaltyAmount'] as num?)} late cut)' : ''}';
    } else if (status == 'off_day') {
      hint = 'Today is not a working day.';
    } else if (status == 'not_required') {
      hint = 'Attendance is not required for your shift.';
    } else if (status == 'absent') {
      hint = 'Attendance window has closed for today.';
    } else if (phase == 'before' && requirement != null) {
      hint = 'Attendance opens 30 minutes before ${requirement['startTime']}.';
    } else if (requirement?['requireLocationValidation'] == true) {
      hint = 'Be within ${requirement?['attendanceRadiusMeters'] ?? 200}m of the dark store to mark attendance.';
    }
    if (status == 'pending' && lateOn && requirement != null) {
      hint = '${hint.isEmpty ? '' : '$hint\n'}'
          'Marking ${formatMinutes(lateAfter)} or more after ${requirement['startTime']} '
          'cuts ${formatRupees(policy?['latePenaltyAmount'] as num?)}.';
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      children: [
        FtSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      "Today's Attendance",
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ),
                  AttendanceChip(status: status),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _data['today']?.toString() ?? '',
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
              ),
              if (hint.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(hint, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
              ],
              if (status != 'present') ...[
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    onPressed: canMark && !_marking ? _mark : null,
                    icon: _marking
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.my_location_rounded),
                    label: Text(_marking ? 'Checking location…' : 'Mark Attendance'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.35),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        FtSectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FtInfoRow(
                icon: Icons.storefront_outlined,
                label: 'Dark Store',
                value: darkStore?['name']?.toString() ?? '—',
              ),
              FtInfoRow(
                icon: Icons.schedule_outlined,
                label: 'Required Time',
                value: requirement == null
                    ? 'Not configured yet'
                    : '${requirement['startTime']} – ${requirement['endTime']}',
              ),
              if (shift != null)
                FtInfoRow(
                  icon: Icons.badge_outlined,
                  label: 'Shift',
                  value: shift['name']?.toString() ?? '—',
                ),
              FtInfoRow(
                icon: Icons.today_outlined,
                label: 'Working Days',
                value: formatWorkingDays(requirement?['workingDays'] as List?),
              ),
              if (requirement?['requireLocationValidation'] == true)
                FtInfoRow(
                  icon: Icons.location_on_outlined,
                  label: 'Location',
                  value: 'Within ${requirement?['attendanceRadiusMeters'] ?? 200}m of store',
                ),
              if (month != null)
                FtInfoRow(
                  icon: Icons.calendar_month_outlined,
                  label: 'This Month',
                  value: '${month['presentDays'] ?? 0} days present'
                      '${month['minimumAttendanceDays'] != null ? ' (minimum ${month['minimumAttendanceDays']})' : ''}',
                ),
            ],
          ),
        ),
        if (payroll != null && ((payroll['baseSalary'] as num?) ?? 0) > 0)
          PayrollCard(payroll: payroll),
      ],
    );
  }
}
