import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/order_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/statistic_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/layout/custom_app_bar.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  bool _loading = true;
  int _todayEarnings = 0;
  int _orderCount = 0;
  int _lifetime = 0;
  List<Map<String, dynamic>> _deliveries = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await OrderService.instance.fetchEarningsDetail();
    if (!mounted) return;
    setState(() {
      _loading = false;
      if (data != null) {
        _todayEarnings = (data['totalEarnings'] as num?)?.toInt() ??
            (data['todayEarnings'] as num?)?.toInt() ??
            0;
        _orderCount = (data['orderCount'] as num?)?.toInt() ?? 0;
        _lifetime = (data['totalLifetimeEarnings'] as num?)?.toInt() ?? 0;
        _deliveries = (data['deliveries'] as List<dynamic>? ?? [])
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      }
    });
  }

  String _rupee(int n) => '₹$n';

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.earnings,
        subtitle: l10n.trackYourIncome,
        showBackButton: true,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(AppSpacing.lg),
                children: [
                  EarningsCard(
                    title: l10n.todaysEarnings,
                    amount: _rupee(_todayEarnings),
                    subtitle: l10n.deliveriesUpdatedLive(
                      _orderCount,
                      l10n.updatedLive,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Row(
                    children: [
                      Expanded(
                        child: StatisticCard(
                          title: l10n.todayTrips,
                          value: '$_orderCount',
                          icon: Icons.local_shipping_outlined,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: StatisticCard(
                          title: l10n.lifetimeEarnings,
                          value: _rupee(_lifetime),
                          icon: Icons.savings_outlined,
                          iconColor: AppColors.info,
                          iconBackground: AppColors.primaryLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  SectionHeader(title: l10n.todaysDeliveries),
                  const SizedBox(height: AppSpacing.md),
                  if (_deliveries.isEmpty)
                    DashboardCard(
                      child: Text(
                        l10n.noDeliveriesTodayYet,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    )
                  else
                    ..._deliveries.map((d) {
                      final amount =
                          (d['riderDeliveryEarning'] as num?)?.toInt() ?? 0;
                      final km =
                          (d['deliveryDistanceKm'] as num?)?.toDouble() ?? 0;
                      final orderNo = d['orderNumber']?.toString() ?? '—';
                      final at = d['deliveredAt'] != null
                          ? DateTime.tryParse(d['deliveredAt'].toString())
                          : null;
                      final time = at == null
                          ? '—'
                          : '${at.hour.toString().padLeft(2, '0')}:${at.minute.toString().padLeft(2, '0')}';
                      return Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.md),
                        child: DashboardCard(
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusSm,
                                  ),
                                ),
                                child: Icon(
                                  Icons.payments_outlined,
                                  color: AppColors.primary,
                                ),
                              ),
                              const SizedBox(width: AppSpacing.md),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      l10n.orderNumberHash(orderNo),
                                      style: Theme.of(context)
                                          .textTheme
                                          .titleMedium
                                          ?.copyWith(fontSize: 15),
                                    ),
                                    Text(
                                      '$time · ${l10n.distanceKmValue(km.toStringAsFixed(1))}',
                                      style: Theme.of(context).textTheme.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                              Text(
                                _rupee(amount),
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(color: AppColors.primary),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
      ),
    );
  }
}
