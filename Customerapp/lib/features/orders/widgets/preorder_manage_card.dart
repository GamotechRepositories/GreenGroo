import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/theme.dart';
import '../../../core/exceptions/api_exception.dart';
import '../../../core/providers/app_providers.dart';
import '../../../models/order.dart';
import '../../../models/store_settings.dart';
import '../../settings/store_settings_provider.dart';

/// Must match PREORDER_CHANGE_WINDOW_MS in the backend order controller.
const preOrderChangeWindow = Duration(hours: 4);

const _notStartedStoreStatuses = {'preorder_hold', 'incoming', 'order_received', 'stock_issue'};
const _green = Color(0xFF2E7D32);

bool _isOpenPreOrder(Order order) =>
    order.preOrderSlot.trim().isNotEmpty &&
    const {'confirm', 'processing', 'shipping'}.contains(order.status) &&
    order.createdAt != null;

/// Lets the customer reschedule or cancel a pre-order for 4 hours after placing it.
class PreOrderManageCard extends ConsumerStatefulWidget {
  const PreOrderManageCard({super.key, required this.order, required this.onChanged});

  final Order order;
  final VoidCallback onChanged;

  static bool appliesTo(Order order) => _isOpenPreOrder(order);

  @override
  ConsumerState<PreOrderManageCard> createState() => _PreOrderManageCardState();
}

class _PreOrderManageCardState extends ConsumerState<PreOrderManageCard> {
  Timer? _ticker;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _ticker = Timer.periodic(const Duration(minutes: 1), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  DateTime get _deadline => widget.order.createdAt!.add(preOrderChangeWindow);

  bool get _preOrderStarted => widget.order.storeParts
      .where((p) => p.isPreOrder && p.status != 'cancelled')
      .any((p) => !_notStartedStoreStatuses.contains(p.status));

  bool get _anyPartStarted => widget.order.storeParts
      .where((p) => p.status != 'cancelled')
      .any((p) => !_notStartedStoreStatuses.contains(p.status));

  String _time(DateTime value) {
    final local = value.toLocal();
    return TimeOfDay.fromDateTime(local).format(context);
  }

  void _toast(String message, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: error ? Colors.red.shade700 : null),
    );
  }

  Future<void> _reschedule() async {
    final settings = ref.read(storeSettingsProvider).value;
    final slots = settings?.activePreOrderSlots ?? const <PreOrderSlot>[];
    if (slots.isEmpty) {
      _toast('No other delivery slots are available right now.', error: true);
      return;
    }
    final picked = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => _SlotPicker(slots: slots, current: widget.order.preOrderSlot),
    );
    if (picked == null || picked == widget.order.preOrderSlot || !mounted) return;

    setState(() => _busy = true);
    try {
      await ref.read(apiServiceProvider).reschedulePreOrder(widget.order.id, picked);
      if (!mounted) return;
      _toast('Pre-order moved to $picked');
      widget.onChanged();
    } catch (e) {
      if (mounted) _toast(apiErrorMessage(e, fallback: 'Could not reschedule. Please try again.'), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel pre-order?'),
        content: Text(
          widget.order.paymentMethod == 'cod'
              ? 'Your pre-order will be cancelled.'
              : 'Your pre-order will be cancelled and the amount refunded to your original payment method.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep order')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Cancel order', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;

    setState(() => _busy = true);
    try {
      await ref.read(apiServiceProvider).cancelOrderById(widget.order.id);
      if (!mounted) return;
      _toast('Pre-order cancelled');
      widget.onChanged();
    } catch (e) {
      if (mounted) _toast(apiErrorMessage(e, fallback: 'Could not cancel. Please try again.'), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final open = DateTime.now().isBefore(_deadline);
    final canReschedule = open && !_preOrderStarted;
    final canCancel = open && !_anyPartStarted;

    final String note;
    if (!open) {
      note = 'Rescheduling and cancellation were available for 4 hours after placing the order '
          '(until ${_time(_deadline)}).';
    } else if (!canReschedule && !canCancel) {
      note = 'Your pre-order is already being packed, so it can no longer be changed.';
    } else {
      note = 'You can reschedule or cancel until ${_time(_deadline)}.';
    }

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.event_available_rounded, color: _green, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pre-order · ${order.preOrderDate} ${order.preOrderSlot}'.trim(),
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(note, style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary, height: 1.35)),
          if (canReschedule || canCancel) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                if (canReschedule)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _busy ? null : _reschedule,
                      icon: const Icon(Icons.schedule_rounded, size: 18),
                      label: const Text('Reschedule'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _green,
                        side: const BorderSide(color: _green),
                      ),
                    ),
                  ),
                if (canReschedule && canCancel) const SizedBox(width: 10),
                if (canCancel)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _busy ? null : _cancel,
                      icon: const Icon(Icons.close_rounded, size: 18),
                      label: const Text('Cancel'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade700,
                        side: BorderSide(color: Colors.red.shade300),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _SlotPicker extends StatelessWidget {
  const _SlotPicker({required this.slots, required this.current});

  final List<PreOrderSlot> slots;
  final String current;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text(
              'Choose a new delivery slot',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
          ),
          for (final slot in slots)
            ListTile(
              leading: Icon(
                slot.label == current ? Icons.radio_button_checked : Icons.radio_button_off,
                color: slot.label == current ? _green : AppColors.textSecondary,
              ),
              title: Text(slot.label),
              subtitle: slot.label == current ? const Text('Current slot') : null,
              enabled: slot.label != current,
              onTap: () => Navigator.pop(context, slot.label),
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
