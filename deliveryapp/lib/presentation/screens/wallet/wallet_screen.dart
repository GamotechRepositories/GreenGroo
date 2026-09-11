import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import '../../../core/config/api_config.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/layout/custom_app_bar.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _loading = true;
  String? _error;
  int _total = 0;
  int _today = 0;
  List<Map<String, dynamic>> _weekDays = const [];
  List<Map<String, dynamic>> _history = const [];
  String _withdrawNote = '';
  bool _canWithdraw = false;
  bool _withdrawEnabled = false;

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
        Uri.parse('${ApiConfig.baseUrl}${ApiConfig.walletSummary}'),
        headers: AuthService.instance.authHeaders,
      );
      if (res.statusCode != 200) throw Exception('Failed');
      final body = jsonDecode(res.body) as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        _loading = false;
        _total = (body['totalEarnings'] as num?)?.toInt() ?? 0;
        _today = (body['todayEarnings'] as num?)?.toInt() ?? 0;
        _weekDays = (body['weekDays'] as List<dynamic>? ?? [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _history = (body['dailyHistory'] as List<dynamic>? ?? [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        _withdrawNote = body['withdrawNote']?.toString() ??
            'Withdraw stays inactive until Admin activates it for your account.';
        _canWithdraw = body['canWithdraw'] == true;
        _withdrawEnabled = body['withdrawEnabled'] == true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Could not load wallet. Pull to retry.';
      });
    }
  }

  String _rupee(int n) => '₹$n';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final maxDay = _weekDays.fold<int>(
      1,
      (m, d) =>
          ((d['totalEarnings'] as num?)?.toInt() ?? 0) > m
              ? ((d['totalEarnings'] as num?)?.toInt() ?? 0)
              : m,
    );

    final body = RefreshIndicator(
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
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(AppSpacing.xxl),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppColors.primary, AppColors.primaryDark],
                        ),
                        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Earnings',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.85),
                                ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            _rupee(_total),
                            style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                                  color: Colors.white,
                                  fontSize: 36,
                                ),
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Text(
                            'From verification date to today',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    PrimaryButton(
                      label: l10n.withdraw,
                      icon: Icons.account_balance_outlined,
                      // Stays inactive until Admin sets withdrawEnabled on the rider.
                      onPressed: _canWithdraw
                          ? () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                    'Withdraw request will be handled by Admin payout policy.',
                                  ),
                                ),
                              );
                            }
                          : null,
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      _withdrawNote,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: _withdrawEnabled
                                ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                    if (!_withdrawEnabled) ...[
                      const SizedBox(height: AppSpacing.xs),
                      Text(
                        'Total earnings still show above — only Withdraw is locked.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textMuted,
                              fontSize: 11,
                            ),
                      ),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                    DashboardCard(
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Today's Earnings",
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          Text(
                            _rupee(_today),
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.lg),
                    Text(
                      'This week',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    DashboardCard(
                      child: _weekDays.isEmpty
                          ? const Text('No earnings yet.')
                          : Column(
                              children: _weekDays.map((d) {
                                final amt = (d['totalEarnings'] as num?)?.toInt() ?? 0;
                                final before = d['beforeVerification'] == true;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: Row(
                                    children: [
                                      SizedBox(
                                        width: 40,
                                        child: Text(
                                          d['dayLabel']?.toString() ?? '',
                                          style: Theme.of(context).textTheme.bodySmall,
                                        ),
                                      ),
                                      Expanded(
                                        child: ClipRRect(
                                          borderRadius: BorderRadius.circular(6),
                                          child: LinearProgressIndicator(
                                            value: before ? 0 : (amt / maxDay).clamp(0.0, 1.0),
                                            minHeight: 10,
                                            backgroundColor: AppColors.surfaceVariant,
                                            color: AppColors.primary,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      SizedBox(
                                        width: 56,
                                        child: Text(
                                          before ? '—' : _rupee(amt),
                                          textAlign: TextAlign.right,
                                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                                fontWeight: FontWeight.w700,
                                              ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                    ),
                    const SizedBox(height: AppSpacing.xl),
                    Text(
                      'Daily earning history',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 18),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    if (_history.isEmpty)
                      const DashboardCard(child: Text('No earnings yet.'))
                    else
                      ..._history.map((h) {
                        final amt = (h['totalEarnings'] as num?)?.toInt() ?? 0;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppSpacing.md),
                          child: DashboardCard(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        h['displayDate']?.toString() ?? h['date']?.toString() ?? '',
                                        style: Theme.of(context).textTheme.titleMedium,
                                      ),
                                      Text(
                                        h['dayLabel']?.toString() ?? '',
                                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                              color: AppColors.textSecondary,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  _rupee(amt),
                                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                        fontWeight: FontWeight.w800,
                                        color: AppColors.primary,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                  ],
                ),
    );

    if (widget.embedded) return body;
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: CustomAppBar(title: l10n.wallet, showBackButton: true),
      body: body,
    );
  }
}
