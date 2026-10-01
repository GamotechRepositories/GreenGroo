import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/config/api_config.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';

class FullTimeRulesScreen extends StatefulWidget {
  const FullTimeRulesScreen({super.key});

  @override
  State<FullTimeRulesScreen> createState() => _FullTimeRulesScreenState();
}

class _FullTimeRulesScreenState extends State<FullTimeRulesScreen> {
  bool _loading = true;
  String? _error;
  List<dynamic> _rules = [];
  double _monthlySalary = 0;
  String _darkStoreName = '';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await apiGet(
        ApiConfig.fullTimeRules,
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body) as Map<String, dynamic>;
        setState(() {
          _rules = (body['rules'] as List?) ?? [];
          _monthlySalary = (body['monthlySalary'] as num?)?.toDouble() ?? 0;
          _darkStoreName = body['darkStoreName']?.toString() ?? '';
          _loading = false;
        });
      } else {
        Map<String, dynamic> body = {};
        try {
          body = jsonDecode(res.body) as Map<String, dynamic>;
        } catch (_) {}
        setState(() {
          _error = body['message']?.toString() ?? 'Failed to load rules (${res.statusCode})';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Could not connect to server. Please try again.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        title: Text(
          'My Full-Time Rules',
          style: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            color: AppColors.textPrimary,
            onPressed: _fetch,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            color: AppColors.textPrimary,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 16),
                        FilledButton.icon(
                          onPressed: _fetch,
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry'),
                          style: FilledButton.styleFrom(
                            backgroundColor: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  children: [
                    // Monthly Salary Card
                    if (_monthlySalary > 0) ...[
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.2),
                          ),
                        ),
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.payments_outlined, color: AppColors.primary, size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Monthly Salary',
                                    style: GoogleFonts.inter(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textMuted,
                                    ),
                                  ),
                                  Text(
                                    '₹${_monthlySalary.toStringAsFixed(0).replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},')}/month',
                                    style: GoogleFonts.inter(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  if (_darkStoreName.isNotEmpty)
                                    Text(
                                      _darkStoreName,
                                      style: GoogleFonts.inter(
                                        fontSize: 12,
                                        color: AppColors.textMuted,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Rules list
                    if (_rules.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Text(
                            'No full-time rules configured yet',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                      )
                    else
                      ...(_rules.map((rule) {
                        final r = rule as Map<String, dynamic>;
                        final workingDays = (r['workingDays'] as List?)?.length ?? 0;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r['ruleName']?.toString() ?? 'Attendance Rule',
                                style: GoogleFonts.inter(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 10),
                              _RuleRow(
                                icon: Icons.schedule_outlined,
                                label: 'Attendance Hours',
                                value: '${r['attendanceStartTime'] ?? '09:00 AM'} – ${r['attendanceEndTime'] ?? '06:00 PM'}',
                              ),
                              _RuleRow(
                                icon: Icons.location_on_outlined,
                                label: 'Attendance Radius',
                                value: '${r['attendanceRadiusMeters'] ?? 200}m from dark store',
                              ),
                              _RuleRow(
                                icon: Icons.calendar_month_outlined,
                                label: 'Minimum Attendance',
                                value: '${r['minimumAttendanceDays'] ?? 26} days / month',
                              ),
                              _RuleRow(
                                icon: Icons.today_outlined,
                                label: 'Working Days',
                                value: '$workingDays days per week',
                              ),
                              if (r['requireLocationValidation'] == true)
                                _RuleRow(
                                  icon: Icons.verified_outlined,
                                  label: 'Location Check',
                                  value: 'Required at attendance',
                                ),
                              if (r['notes'] != null && r['notes'].toString().isNotEmpty)
                                _RuleRow(
                                  icon: Icons.notes_outlined,
                                  label: 'Notes',
                                  value: r['notes'].toString(),
                                ),
                            ],
                          ),
                        );
                      }).toList()),
                  ],
                ),
    );
  }
}

class _RuleRow extends StatelessWidget {
  const _RuleRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: AppColors.primary),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '$label: ',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                    ),
                  ),
                  TextSpan(
                    text: value,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
