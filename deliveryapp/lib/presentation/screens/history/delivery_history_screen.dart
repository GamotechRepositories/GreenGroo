import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/config/api_config.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/layout/custom_app_bar.dart';

class DeliveryHistoryScreen extends StatefulWidget {
  const DeliveryHistoryScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<DeliveryHistoryScreen> createState() => _DeliveryHistoryScreenState();
}

class _DeliveryHistoryScreenState extends State<DeliveryHistoryScreen> {
  String _range = 'week';
  bool _loading = true;
  String? _error;
  List<_DayBox> _days = const [];
  _HistoryTotals _totals = _HistoryTotals.empty;

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
      final res = await apiGet(
        ApiConfig.activityHistory(range: _range),
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) {
        throw Exception('Failed (${res.statusCode})');
      }
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (body['success'] != true || body['data'] == null) {
        throw Exception('Invalid response');
      }
      final data = body['data'] as Map<String, dynamic>;
      final daysRaw = (data['days'] as List?) ?? const [];
      final totalsRaw = (data['totals'] as Map?)?.cast<String, dynamic>() ?? {};
      if (!mounted) return;
      setState(() {
        _days = daysRaw
            .whereType<Map>()
            .map((e) => _DayBox.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        _totals = _HistoryTotals.fromJson(totalsRaw);
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
        _days = const [];
        _totals = _HistoryTotals.empty;
      });
    }
  }

  void _setRange(String range) {
    if (_range == range) return;
    setState(() => _range = range);
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final body = Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.md,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: _RangeChips(
            range: _range,
            weekLabel: l10n.week,
            monthLabel: l10n.month,
            yearLabel: l10n.year,
            onChanged: _setRange,
          ),
        ),
        if (!_loading && _error == null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
            child: _TotalsBar(totals: _totals),
          ),
        const SizedBox(height: AppSpacing.sm),
        Expanded(child: _buildBody(l10n)),
      ],
    );

    if (widget.embedded) {
      return ColoredBox(color: AppColors.background, child: body);
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.deliveryHistory,
        showBackButton: true,
      ),
      body: body,
    );
  }

  Widget _buildBody(AppLocalizations l10n) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                l10n.couldNotLoadHistory,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextButton(onPressed: _load, child: Text(l10n.tryAgain)),
            ],
          ),
        ),
      );
    }
    if (_days.isEmpty) {
      return Center(
        child: Text(
          l10n.noActivityInPeriod,
          style: GoogleFonts.inter(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.sm,
          AppSpacing.lg,
          AppSpacing.xl,
        ),
        itemCount: _days.length,
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.md),
        itemBuilder: (context, index) => _DayHistoryCard(day: _days[index]),
      ),
    );
  }
}

class _RangeChips extends StatelessWidget {
  const _RangeChips({
    required this.range,
    required this.weekLabel,
    required this.monthLabel,
    required this.yearLabel,
    required this.onChanged,
  });

  final String range;
  final String weekLabel;
  final String monthLabel;
  final String yearLabel;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final options = [
      ('week', weekLabel),
      ('month', monthLabel),
      ('year', yearLabel),
    ];
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: options.map((opt) {
          final selected = range == opt.$1;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(opt.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? AppColors.surface : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                            color: AppColors.shadow,
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  opt.$2,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: selected
                        ? AppColors.primary
                        : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _TotalsBar extends StatelessWidget {
  const _TotalsBar({required this.totals});

  final _HistoryTotals totals;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryLight),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              '₹${totals.earnings}',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.primaryDark,
              ),
            ),
          ),
          Text(
            l10n.tripsAndOnlineSummary(totals.trips, totals.onlineTime),
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.primaryDark,
            ),
          ),
        ],
      ),
    );
  }
}

class _DayHistoryCard extends StatelessWidget {
  const _DayHistoryCard({required this.day});

  final _DayBox day;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final dateParts = day.date.split('-');
    final dateShort = dateParts.length == 3
        ? '${dateParts[2]}/${dateParts[1]}'
        : day.date;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: day.isToday ? AppColors.primary : AppColors.border,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                day.dayLabel,
                style: GoogleFonts.inter(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                dateShort,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              if (day.isToday) ...[
                const SizedBox(width: 8),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    l10n.today,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.primaryDark,
                    ),
                  ),
                ),
              ],
              const Spacer(),
              Text(
                '₹${day.total}',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _MetricChip(
                icon: Icons.payments_outlined,
                label: l10n.earnShort,
                value: '₹${day.earnings}',
              ),
              _MetricChip(
                icon: Icons.schedule_outlined,
                label: l10n.online,
                value: day.onlineTime,
              ),
              _MetricChip(
                icon: Icons.event_available_outlined,
                label: l10n.shifts,
                value: l10n.shiftsBookedValue(day.shiftsBooked),
              ),
              _MetricChip(
                icon: Icons.check_circle_outline,
                label: l10n.doneShort,
                value: l10n.shiftsDoneValue(day.shiftsCompleted),
              ),
              _MetricChip(
                icon: Icons.delivery_dining_outlined,
                label: l10n.trips,
                value: '${day.trips}',
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.cardSubBg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.cardSubBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 6),
          Text(
            AppLocalizations.of(context).labelWithColon(label),
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
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
    required this.isToday,
    required this.earnings,
    required this.onlineMinutes,
    required this.onlineTime,
    required this.shiftsBooked,
    required this.shiftsCompleted,
    required this.trips,
    required this.total,
  });

  final String date;
  final String dayLabel;
  final bool isToday;
  final int earnings;
  final int onlineMinutes;
  final String onlineTime;
  final int shiftsBooked;
  final int shiftsCompleted;
  final int trips;
  final int total;

  factory _DayBox.fromJson(Map<String, dynamic> json) {
    final mins = (json['onlineMinutes'] as num?)?.toInt() ?? 0;
    return _DayBox(
      date: json['date']?.toString() ?? '',
      dayLabel: json['dayLabel']?.toString() ?? '',
      isToday: json['isToday'] == true,
      earnings: (json['earnings'] as num?)?.toInt() ?? 0,
      onlineMinutes: mins,
      onlineTime: json['onlineTime']?.toString() ?? '${mins ~/ 60}h ${mins % 60}m',
      shiftsBooked: (json['shiftsBooked'] as num?)?.toInt() ?? 0,
      shiftsCompleted: (json['shiftsCompleted'] as num?)?.toInt() ?? 0,
      trips: (json['trips'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ??
          (json['earnings'] as num?)?.toInt() ??
          0,
    );
  }
}

class _HistoryTotals {
  const _HistoryTotals({
    required this.earnings,
    required this.onlineTime,
    required this.trips,
  });

  final int earnings;
  final String onlineTime;
  final int trips;

  static const empty = _HistoryTotals(earnings: 0, onlineTime: '0m', trips: 0);

  factory _HistoryTotals.fromJson(Map<String, dynamic> json) {
    return _HistoryTotals(
      earnings: (json['earnings'] as num?)?.toInt() ??
          (json['total'] as num?)?.toInt() ??
          0,
      onlineTime: json['onlineTime']?.toString() ?? '0m',
      trips: (json['trips'] as num?)?.toInt() ?? 0,
    );
  }
}
