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

class PerformanceScreen extends StatefulWidget {
  const PerformanceScreen({super.key});

  @override
  State<PerformanceScreen> createState() => _PerformanceScreenState();
}

class _PerformanceScreenState extends State<PerformanceScreen> {
  bool _loading = true;
  String? _error;
  Map<String, dynamic>? _data;

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
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.performance}'),
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) throw Exception('Failed');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _loading = false;
        _data = body;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load performance. Pull to retry.';
      });
    }
  }

  String _rate(dynamic v) {
    if (v == null) return '—';
    return '${v}%';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final rating = _data?['customerRating'] as Map<String, dynamic>?;
    final avg = rating?['average'];
    final count = (rating?['count'] as num?)?.toInt() ?? 0;
    final counts = _data?['counts'] as Map<String, dynamic>?;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(
        title: l10n.performance,
        subtitle: l10n.deliveryMetrics,
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
                            TextButton(onPressed: _load, child: const Text('Retry')),
                          ],
                        ),
                      ),
                    ],
                  )
                : ListView(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    children: [
                      _HeroRatingCard(
                        average: avg,
                        count: count,
                        title: l10n.customerRating,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      Row(
                        children: [
                          Expanded(
                            child: _MetricTile(
                              title: l10n.acceptanceRate,
                              value: _rate(_data?['acceptanceRate']),
                              icon: Icons.check_circle_outline,
                              accent: AppColors.primary,
                              tint: AppColors.primaryLight,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: _MetricTile(
                              title: l10n.onTimeDelivery,
                              value: _rate(_data?['onTimeDeliveryRate']),
                              icon: Icons.schedule_outlined,
                              accent: AppColors.info,
                              tint: const Color(0xFFDBEAFE),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _MetricTile(
                        title: 'Decline rate',
                        value: _rate(_data?['declineRate']),
                        icon: Icons.thumb_down_alt_outlined,
                        accent: const Color(0xFFB45309),
                        tint: const Color(0xFFFEF3C7),
                        wide: true,
                      ),
                      if (counts != null) ...[
                        const SizedBox(height: AppSpacing.lg),
                        Text(
                          'Trip summary',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Row(
                          children: [
                            Expanded(
                              child: _CountChip(
                                label: 'Delivered',
                                value: '${counts['delivered'] ?? 0}',
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _CountChip(
                                label: 'Accepted',
                                value: '${counts['accepted'] ?? 0}',
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: _CountChip(
                                label: 'Declined',
                                value: '${counts['declined'] ?? 0}',
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: AppSpacing.xl),
                      Text(
                        count == 0
                            ? 'Customer ratings appear after customers rate your deliveries.'
                            : 'Based on your deliveries since verification.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
      ),
    );
  }
}

class _HeroRatingCard extends StatelessWidget {
  const _HeroRatingCard({
    required this.average,
    required this.count,
    required this.title,
  });

  final dynamic average;
  final int count;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.primary.withValues(alpha: 0.12),
            AppColors.primarySoft,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primaryLight),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 34),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  count == 0 ? '—' : '${average ?? '—'}',
                  style: GoogleFonts.inter(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  count == 0
                      ? 'No ratings yet'
                      : '$count rating${count == 1 ? '' : 's'}',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({
    required this.title,
    required this.value,
    required this.icon,
    required this.accent,
    required this.tint,
    this.wide = false,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color accent;
  final Color tint;
  final bool wide;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: wide ? double.infinity : null,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
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
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: tint,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: accent, size: 20),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _CountChip extends StatelessWidget {
  const _CountChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
