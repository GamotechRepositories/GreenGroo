import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/rider_live_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/cards/dashboard_card.dart';
import '../../widgets/cards/shift_card.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/layout/custom_app_bar.dart';
import '../../../data/services/shift_service.dart';
import '../../../domain/models/shift.dart';

class MyShiftsScreen extends StatefulWidget {
  const MyShiftsScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<MyShiftsScreen> createState() => _MyShiftsScreenState();
}

class _MyShiftsScreenState extends State<MyShiftsScreen> {
  bool _loading = true;
  List<ShiftSlot> _slots = const [];
  ShiftBooking? _booking;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    _slots = await RiderLiveService.instance.fetchShiftSlots();
    _booking = await RiderLiveService.instance.fetchMyBooking();
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _bookSlot(ShiftSlot slot) async {
    final l10n = AppLocalizations.of(context);
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.bookTomorrowShift),
        content: Text('${slot.label} (${slot.start}–${slot.end})'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.bookShift)),
        ],
      ),
    );
    if (ok != true) return;

    final success = await RiderLiveService.instance.bookShift(slot.slot, tomorrow);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(success ? l10n.shiftBookedSuccess : l10n.authError)),
    );
    if (success) await _load();
  }

  Future<void> _cancelBooking() async {
    final ok = await RiderLiveService.instance.cancelShiftBooking();
    if (!mounted) return;
    if (ok) await _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final mockMyShifts = ShiftService.instance.myShifts;
    final mockAvailable = ShiftService.instance.availableShifts;

    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final body = ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        Text(
          l10n.shiftBookingHint,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppColors.textSecondary,
              ),
        ),
        const SizedBox(height: AppSpacing.lg),
        SectionHeader(title: l10n.bookTomorrowShift),
        const SizedBox(height: AppSpacing.md),
        if (_slots.isEmpty)
          Text(l10n.noAvailableShifts, style: Theme.of(context).textTheme.bodyMedium)
        else
          ..._slots.map(
            (slot) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: DashboardCard(
                child: ListTile(
                  leading: Icon(Icons.schedule, color: AppColors.primary),
                  title: Text(slot.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                  subtitle: Text('${slot.start} – ${slot.end}'),
                  trailing: _booking?.slot == slot.slot
                      ? TextButton(onPressed: _cancelBooking, child: const Text('Cancel'))
                      : FilledButton(onPressed: () => _bookSlot(slot), child: Text(l10n.bookShift)),
                ),
              ),
            ),
          ),
        if (_booking?.hasBooking == true) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            l10n.shiftBookedBanner(
              _booking!.label,
              '${_booking!.start}–${_booking!.end}',
            ),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
          ),
        ],
        const SizedBox(height: AppSpacing.xl),
        SectionHeader(title: l10n.myShifts),
        const SizedBox(height: AppSpacing.md),
        ...mockMyShifts.map(
          (shift) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: ShiftCard(shift: shift),
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        SectionHeader(title: l10n.availableShifts),
        const SizedBox(height: AppSpacing.md),
        ...mockAvailable.map(
          (shift) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: ShiftCard(
              shift: shift,
              onBook: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n.shiftBookedSuccess)),
                );
              },
            ),
          ),
        ),
      ],
    );

    if (widget.embedded) return body;

    return Scaffold(
      appBar: CustomAppBar(
        title: l10n.myShifts,
        subtitle: l10n.myShiftsSubtitle,
        showBackButton: true,
      ),
      body: body,
    );
  }
}
