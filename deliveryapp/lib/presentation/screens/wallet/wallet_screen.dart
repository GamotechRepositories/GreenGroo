import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/layout/custom_app_bar.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  bool _loading = true;
  int _weekTotal = 0;
  int _weekOrders = 0;
  int _todayEarnings = 0;
  List<Map<String, dynamic>> _days = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await OrderService.instance.fetchWeeklyEarnings();
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (data != null) {
        _weekTotal = (data['weekTotalEarnings'] as num?)?.toInt() ?? 0;
        _weekOrders = (data['weekOrderCount'] as num?)?.toInt() ?? 0;
        _todayEarnings = (data['todayEarnings'] as num?)?.toInt() ?? 0;
        _days = (data['days'] as List<dynamic>? ?? [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
    });
  }

  String _rupee(int n) => '₹$n';

  /// Withdrawals only on Saturday (IST). Dart weekday: Mon=1 … Sat=6.
  bool get _isWithdrawDay {
    final istNow = DateTime.now().toUtc().add(const Duration(hours: 5, minutes: 30));
    return istNow.weekday == DateTime.saturday;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final canWithdraw = _isWithdrawDay && _weekTotal > 0;
    final maxDay = _days.fold<int>(
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
                        l10n.thisWeekEarningsTitle,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.white.withValues(alpha: 0.85),
                            ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        _rupee(_weekTotal),
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                              color: Colors.white,
                              fontSize: 36,
                            ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        l10n.deliveriesAndToday(_weekOrders, _rupee(_todayEarnings)),
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
                  onPressed: canWithdraw
                      ? () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                l10n.withdrawRequestSubmitted(_rupee(_weekTotal)),
                              ),
                              backgroundColor: AppColors.primary,
                            ),
                          );
                        }
                      : null,
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  _isWithdrawDay
                      ? (_weekTotal > 0
                          ? l10n.withdrawAvailableSaturday
                          : l10n.noEarningsToWithdraw)
                      : l10n.withdrawOpensSaturday,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: _isWithdrawDay
                            ? AppColors.primary
                            : AppColors.warning,
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(height: AppSpacing.xl),
                SectionHeader(title: l10n.weeklyChart),
                const SizedBox(height: AppSpacing.md),
                DashboardCard(
                  child: SizedBox(
                    height: 180,
                    child: _days.isEmpty
                        ? Center(
                            child: Text(
                              l10n.noEarningsThisWeekYet,
                              style: Theme.of(context).textTheme.bodyMedium,
                            ),
                          )
                        : Row(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: _days.map((day) {
                              final amount =
                                  (day['totalEarnings'] as num?)?.toInt() ?? 0;
                              final label = day['dayLabel']?.toString() ?? '';
                              final isToday = day['isToday'] == true;
                              final factor =
                                  maxDay <= 0 ? 0.05 : (amount / maxDay).clamp(0.05, 1.0);
                              return Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 4),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.end,
                                    children: [
                                      Text(
                                        amount > 0 ? '₹$amount' : '',
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(fontSize: 9),
                                      ),
                                      const SizedBox(height: 4),
                                      Expanded(
                                        child: FractionallySizedBox(
                                          heightFactor: factor,
                                          child: Container(
                                            decoration: BoxDecoration(
                                              color: isToday
                                                  ? AppColors.primary
                                                  : AppColors.primary
                                                      .withValues(alpha: 0.25),
                                              borderRadius: BorderRadius.circular(8),
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: AppSpacing.sm),
                                      Text(
                                        label,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodySmall
                                            ?.copyWith(
                                              fontWeight: isToday
                                                  ? FontWeight.w800
                                                  : FontWeight.w500,
                                            ),
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),
                SectionHeader(title: l10n.dayWiseEarnings),
                const SizedBox(height: AppSpacing.md),
                if (_days.isEmpty)
                  DashboardCard(
                    child: Text(
                      l10n.completeDeliveriesForWeekly,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  )
                else
                  ..._days.reversed.map((day) {
                    final amount = (day['totalEarnings'] as num?)?.toInt() ?? 0;
                    final count = (day['orderCount'] as num?)?.toInt() ?? 0;
                    final date = day['date']?.toString() ?? '';
                    final label = day['dayLabel']?.toString() ?? '';
                    final isToday = day['isToday'] == true;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.md),
                      child: DashboardCard(
                        child: Row(
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              color: isToday ? AppColors.primary : AppColors.textSecondary,
                            ),
                            const SizedBox(width: AppSpacing.md),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isToday
                                        ? l10n.todayWithLabel(label)
                                        : l10n.dayWithDate(label, date),
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(fontSize: 15),
                                  ),
                                  Text(
                                    l10n.deliveriesCount(count),
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              _rupee(amount),
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: AppSpacing.xl),
                SectionHeader(title: l10n.bankDetails),
                const SizedBox(height: AppSpacing.md),
                DashboardCard(
                  child: Column(
                    children: [
                      _BankRow(label: l10n.accountHolder, value: l10n.placeholderDash),
                      const Divider(height: AppSpacing.xl),
                      _BankRow(label: l10n.bankName, value: l10n.placeholderDash),
                      const Divider(height: AppSpacing.xl),
                      _BankRow(label: l10n.accountNumber, value: l10n.accountNumberMasked),
                      const Divider(height: AppSpacing.xl),
                      _BankRow(label: l10n.ifscCode, value: l10n.placeholderDash),
                    ],
                  ),
                ),
              ],
            ),
    );

    if (widget.embedded) return body;

    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.wallet,
        subtitle: l10n.fullWeekEarnings,
        showBackButton: true,
      ),
      body: body,
    );
  }
}

class _BankRow extends StatelessWidget {
  const _BankRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Text(
          value,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
        ),
      ],
    );
  }
}
