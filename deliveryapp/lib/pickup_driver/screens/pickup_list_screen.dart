import 'dart:async';

import 'package:flutter/material.dart';

import '../pickup_driver_service.dart';
import '../pickup_flow.dart';
import '../pickup_push_service.dart';
import '../widgets/pickup_ui.dart';
import 'pickup_batch_screen.dart';
import 'pickup_detail_screen.dart';

class PickupListMode {
  const PickupListMode(this.filter, this.title, this.subtitle, this.empty);

  final String filter;
  final String title;
  final String subtitle;
  final String empty;

  static const assigned = PickupListMode('assigned', 'Assigned',
      'Update status when you leave for the farm.', 'No assigned pickups.');
  static const progress = PickupListMode(
      'progress',
      'In Progress',
      'On the way, at farm, confirming, or returning to the centre.',
      'No pickups in progress.');
  static const completed = PickupListMode('completed', 'Completed',
      'Received at the collection centre.', 'No completed pickups.');
  static const history = PickupListMode('history', 'History',
      'Finished pickups at the collection centre.', 'No pickup history yet.');

  static const all = [assigned, progress, completed, history];
}

/// Pickup orders with tabs — mirrors vendor `DriverDashboardPage`.
class PickupListScreen extends StatefulWidget {
  const PickupListScreen({super.key, this.initialFilter = 'assigned'});

  final String initialFilter;

  @override
  State<PickupListScreen> createState() => PickupListScreenState();
}

class PickupListScreenState extends State<PickupListScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    final idx = PickupListMode.all
        .indexWhere((m) => m.filter == widget.initialFilter);
    _tabs = TabController(
      length: PickupListMode.all.length,
      vsync: this,
      initialIndex: idx < 0 ? 0 : idx,
    );
  }

  void showFilter(String filter) {
    final idx = PickupListMode.all.indexWhere((m) => m.filter == filter);
    if (idx >= 0) _tabs.animateTo(idx);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PickupColors.page,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text('Pickup Orders',
            style: pickupText(17, weight: FontWeight.w800)),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: PickupColors.brand,
          unselectedLabelColor: PickupColors.muted,
          indicatorColor: PickupColors.brand,
          labelStyle: pickupText(13.5, weight: FontWeight.w700),
          tabs: [for (final m in PickupListMode.all) Tab(text: m.title)],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          for (final m in PickupListMode.all) _PickupTab(mode: m),
        ],
      ),
    );
  }
}

class _PickupTab extends StatefulWidget {
  const _PickupTab({required this.mode});
  final PickupListMode mode;

  @override
  State<_PickupTab> createState() => _PickupTabState();
}

class _PickupTabState extends State<_PickupTab>
    with AutomaticKeepAliveClientMixin {
  PickupListResult _data = PickupListResult.empty;
  bool _loading = true;
  String _busyId = '';
  String _error = '';
  Timer? _timer;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
    _timer = Timer.periodic(const Duration(seconds: 20), (_) => _load());
    PickupPushService.instance.refreshTick.addListener(_load);
  }

  @override
  void dispose() {
    _timer?.cancel();
    PickupPushService.instance.refreshTick.removeListener(_load);
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data =
          await PickupDriverService.instance.listPickups(widget.mode.filter);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _openPickup(Map<String, dynamic> p) async {
    await Navigator.of(context)
        .push(pickupRoute<void>(PickupDetailScreen(pickupId: str(p['id']))));
    if (mounted) _load();
  }

  Future<void> _openBatch(String batchId, List<Map<String, dynamic>> orders) async {
    await Navigator.of(context).push(pickupRoute<void>(
        PickupBatchScreen(batchId: batchId, seedPickups: orders)));
    if (mounted) _load();
  }

  Future<void> _handleStep(Map<String, dynamic> p, PickupStep step) async {
    if (!step.runsFromList) {
      await _openPickup(p);
      return;
    }
    final id = str(p['id']);
    setState(() {
      _busyId = id;
      _error = '';
    });
    final svc = PickupDriverService.instance;
    try {
      switch (step.key) {
        case 'start':
          await svc.start(id);
        case 'arrive':
          await svc.arrive(id);
        case 'transit':
          await svc.transit(id);
        case 'arriveCentre':
          await svc.arriveCentre(id);
      }
      await _load();
      if (!mounted) return;
      if (step.key == 'start' || step.key == 'arrive') {
        await _openPickup(p);
      }
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      setState(() => _error = pickupErrorText(e));
    } finally {
      if (mounted) setState(() => _busyId = '');
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final rows = _data.pickups;
    final cards = groupPickupCards(rows,
        byBatch: widget.mode.filter != PickupListMode.assigned.filter);

    return RefreshIndicator(
      color: PickupColors.brand,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        children: [
          Text(widget.mode.subtitle,
              style: pickupText(13, color: PickupColors.muted)),
          const SizedBox(height: 12),
          PickupStatsGrid(stats: _data.stats),
          const SizedBox(height: 12),
          if (_error.isNotEmpty) ...[
            ErrorBanner(_error),
            const SizedBox(height: 12),
          ],
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(top: 40),
              child: Center(
                  child: CircularProgressIndicator(color: PickupColors.brand)),
            )
          else if (rows.isEmpty)
            EmptyState(widget.mode.empty)
          else
            for (final card in cards) ...[
              if (card.batchId != null)
                BatchPickupCard(
                  batchId: card.batchId!,
                  orders: card.pickups,
                  busyId: _busyId,
                  onOpen: () => _openBatch(card.batchId!, card.pickups),
                  onStep: _handleStep,
                )
              else
                OrderPickupCard(
                  pickup: card.pickups.first,
                  batchOrders: rows
                      .where((p) =>
                          str(p['collectionBatchId']).isNotEmpty &&
                          str(p['collectionBatchId']) ==
                              str(card.pickups.first['collectionBatchId']))
                      .toList(),
                  busy: _busyId == str(card.pickups.first['id']),
                  onOpen: () => _openPickup(card.pickups.first),
                  onStep: (step) => _handleStep(card.pickups.first, step),
                ),
              const SizedBox(height: 12),
            ],
        ],
      ),
    );
  }
}

class PickupCardGroup {
  PickupCardGroup.order(Map<String, dynamic> p)
      : batchId = null,
        pickups = [p];
  PickupCardGroup.batch(this.batchId) : pickups = [];

  final String? batchId;
  final List<Map<String, dynamic>> pickups;
}

List<PickupCardGroup> groupPickupCards(
  List<Map<String, dynamic>> pickups, {
  required bool byBatch,
}) {
  if (!byBatch) return pickups.map(PickupCardGroup.order).toList();
  final seen = <String, PickupCardGroup>{};
  final cards = <PickupCardGroup>[];
  for (final p in pickups) {
    final bid = str(p['collectionBatchId']);
    if (bid.isEmpty) {
      cards.add(PickupCardGroup.order(p));
      continue;
    }
    final group = seen.putIfAbsent(bid, () {
      final g = PickupCardGroup.batch(bid);
      cards.add(g);
      return g;
    });
    group.pickups.add(p);
  }
  return cards;
}

class OrderPickupCard extends StatelessWidget {
  const OrderPickupCard({
    super.key,
    required this.pickup,
    required this.busy,
    required this.onOpen,
    required this.onStep,
    this.batchOrders = const [],
  });

  final Map<String, dynamic> pickup;
  final List<Map<String, dynamic>> batchOrders;
  final bool busy;
  final VoidCallback onOpen;
  final ValueChanged<PickupStep> onStep;

  @override
  Widget build(BuildContext context) {
    final p = pickup;
    final step = driverNextStep(p);
    final batchId = str(p['collectionBatchId']);
    final location = str(p['farmerLocation']);
    final pkgs = str(p['packageCount']).isEmpty ? '0' : str(p['packageCount']);

    return PickupCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: onOpen,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(14)),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  StatusChip(pickupLiveLabel(p)),
                  const SizedBox(height: 8),
                  Text(pickupOrderId(p),
                      style: pickupText(15, weight: FontWeight.w800)),
                  const SizedBox(height: 6),
                  Text(
                    '${str(p['farmerName'])} · ${location.isEmpty ? '—' : location}',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: pickupText(12.5, color: PickupColors.muted),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${str(p['productName'])} · ${pickupQuantity(p)} · $pkgs pkgs',
                    style: pickupText(12.5, color: PickupColors.muted),
                  ),
                  if (batchId.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    CopyText(batchId, size: 11),
                  ],
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAF8),
              border: Border(top: BorderSide(color: PickupColors.border)),
              borderRadius:
                  BorderRadius.vertical(bottom: Radius.circular(14)),
            ),
            child: Row(
              children: [
                if (batchId.isNotEmpty) ...[
                  Expanded(
                    child: PickupButton(
                      label: 'Show QR',
                      icon: Icons.qr_code_2_rounded,
                      onPressed: () => showBatchQr(context,
                          batchId: batchId,
                          record: {
                            'batchId': batchId,
                            'pickups': batchOrders.isEmpty ? [p] : batchOrders,
                          }),
                    ),
                  ),
                  const SizedBox(width: 10),
                ],
                Expanded(
                  child: step != null
                      ? PickupButton(
                          label: step.label,
                          busy: busy,
                          outlined: batchId.isNotEmpty,
                          onPressed: () => onStep(step),
                        )
                      : PickupButton(
                          label: 'Open',
                          outlined: true,
                          onPressed: onOpen,
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

class BatchPickupCard extends StatelessWidget {
  const BatchPickupCard({
    super.key,
    required this.batchId,
    required this.orders,
    required this.busyId,
    required this.onOpen,
    required this.onStep,
  });

  final String batchId;
  final List<Map<String, dynamic>> orders;
  final String busyId;
  final VoidCallback onOpen;
  final Future<void> Function(Map<String, dynamic>, PickupStep) onStep;

  @override
  Widget build(BuildContext context) {
    final first = orders.first;
    final arrivePickup = orders.firstWhere(
      (p) => str(p['status']) == 'IN_TRANSIT',
      orElse: () => first,
    );
    final step = driverNextStep(arrivePickup);
    final driver = first['driver'] is Map
        ? Map<String, dynamic>.from(first['driver'] as Map)
        : <String, dynamic>{};
    final driverId = [first['driverId'], driver['id'], driver['driverId']]
        .map(str)
        .firstWhere((s) => s.isNotEmpty, orElse: () => '');
    final vehicleId = formatVehicleId(
      str(first['vehicleId']).isNotEmpty ? first['vehicleId'] : driver['vehicleId'],
      str(first['vehicleNumber']).isNotEmpty
          ? first['vehicleNumber']
          : driver['vehicleNumber'],
    );

    return PickupCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          InkWell(
            onTap: onOpen,
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(14)),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(child: StatusChip(pickupLiveLabel(first))),
                      const Spacer(),
                      Text(
                        '${orders.length} order${orders.length == 1 ? '' : 's'} in this batch',
                        style: pickupText(12, color: PickupColors.muted),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text('LOT / BATCH ID',
                      style: pickupText(10,
                          weight: FontWeight.w700,
                          color: PickupColors.faint)),
                  const SizedBox(height: 3),
                  CopyText(batchId, size: 14.5),
                  const SizedBox(height: 10),
                  InfoGrid([
                    InfoItem('Driver ID', driverId, copy: true),
                    InfoItem('Vehicle ID', vehicleId, copy: true),
                  ]),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAF8),
              border: Border(top: BorderSide(color: PickupColors.border)),
              borderRadius:
                  BorderRadius.vertical(bottom: Radius.circular(14)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: PickupButton(
                        label: 'Show QR',
                        icon: Icons.qr_code_2_rounded,
                        onPressed: () => showBatchQr(context,
                            batchId: batchId,
                            record: {'batchId': batchId, 'pickups': orders}),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: PickupButton(
                        label: 'View details',
                        outlined: true,
                        onPressed: onOpen,
                      ),
                    ),
                  ],
                ),
                if (step != null && step.runsFromList) ...[
                  const SizedBox(height: 10),
                  PickupButton(
                    label: step.label,
                    busy: busyId == str(arrivePickup['id']),
                    onPressed: () => onStep(arrivePickup, step),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
