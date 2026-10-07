import 'package:flutter/material.dart';

import '../../core/routes/app_routes.dart';
import '../pickup_driver_service.dart';
import '../pickup_flow.dart';
import '../pickup_push_service.dart';
import '../widgets/pickup_ui.dart';

/// Driver profile, live policies and logout.
class PickupProfileScreen extends StatefulWidget {
  const PickupProfileScreen({super.key});

  @override
  State<PickupProfileScreen> createState() => _PickupProfileScreenState();
}

class _PickupProfileScreenState extends State<PickupProfileScreen> {
  final _svc = PickupDriverService.instance;
  List<Map<String, dynamic>> _policies = [];
  bool _loadingPolicies = true;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      await _svc.fetchMe();
      if (mounted) setState(() {});
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
    }
    try {
      final rows = await _svc.livePolicies();
      if (mounted) setState(() => _policies = rows);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loadingPolicies = false);
    }
  }

  Future<void> _logout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You will need your mobile and password to log in again.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: PickupColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await PickupPushService.instance.stop();
    await _svc.logout();
    if (!mounted) return;
    Navigator.of(context)
        .pushNamedAndRemoveUntil(AppRoutes.login, (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final d = _svc.driver ?? const <String, dynamic>{};
    final name = _svc.driverName;
    final vehicle = [str(d['vehicleNumber']), str(d['vehicleType'])]
        .where((s) => s.isNotEmpty)
        .join(' · ');

    return Scaffold(
      backgroundColor: PickupColors.page,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text('Profile', style: pickupText(17, weight: FontWeight.w800)),
      ),
      body: RefreshIndicator(
        color: PickupColors.brand,
        onRefresh: _refresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
          children: [
            PickupCard(
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: PickupColors.brandSoft,
                    child: Text(
                      name.isEmpty ? '?' : name[0].toUpperCase(),
                      style: pickupText(22,
                          weight: FontWeight.w800, color: PickupColors.brand),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name,
                            style: pickupText(17, weight: FontWeight.w800)),
                        const SizedBox(height: 2),
                        Text('Pickup Driver · Farm → Collection centre',
                            style:
                                pickupText(12.5, color: PickupColors.muted)),
                        if (str(d['status']).isNotEmpty) ...[
                          const SizedBox(height: 6),
                          StatusChip(str(d['status'])),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            PickupCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Details'),
                  InfoGrid([
                    InfoItem('Mobile', str(d['mobile'])),
                    InfoItem('Driver ID',
                        str(d['driverId']).isNotEmpty ? str(d['driverId']) : str(d['id']),
                        copy: true),
                    InfoItem('Vehicle', vehicle),
                    InfoItem(
                        'Vehicle ID',
                        formatVehicleId(d['vehicleId'], d['vehicleNumber']),
                        copy: true),
                    if (str(d['licenseNumber']).isNotEmpty)
                      InfoItem('License', str(d['licenseNumber'])),
                    if (str(d['assignedArea']).isNotEmpty)
                      InfoItem('Area', str(d['assignedArea'])),
                  ]),
                ],
              ),
            ),
            const SizedBox(height: 14),
            PickupCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionTitle('Policies'),
                  if (_loadingPolicies)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                            color: PickupColors.brand),
                      ),
                    )
                  else if (_policies.isEmpty)
                    Text('No policies published yet.',
                        style: pickupText(13, color: PickupColors.faint))
                  else
                    for (final p in _policies)
                      Theme(
                        data: Theme.of(context)
                            .copyWith(dividerColor: Colors.transparent),
                        child: ExpansionTile(
                          tilePadding: EdgeInsets.zero,
                          childrenPadding:
                              const EdgeInsets.only(bottom: 12),
                          title: Text(
                            str(p['title']).isEmpty ? 'Policy' : str(p['title']),
                            style: pickupText(14, weight: FontWeight.w700),
                          ),
                          expandedCrossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            Text(str(p['body']),
                                style: pickupText(13,
                                    color: PickupColors.muted, height: 1.45)),
                          ],
                        ),
                      ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton.icon(
              onPressed: _logout,
              icon: const Icon(Icons.logout_rounded),
              label: const Text('Log out'),
              style: OutlinedButton.styleFrom(
                foregroundColor: PickupColors.error,
                side: const BorderSide(color: PickupColors.error),
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
