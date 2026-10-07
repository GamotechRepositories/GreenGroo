import 'package:flutter/material.dart';

import '../pickup_driver_service.dart';
import '../pickup_flow.dart';
import '../widgets/pickup_ui.dart';

const _leaveTypes = [
  ('casual', 'Casual'),
  ('sick', 'Sick'),
  ('earned', 'Earned'),
  ('unpaid', 'Unpaid'),
];

/// Leave requests for pickup drivers — mirrors vendor `DriverLeavePage`.
class PickupLeaveScreen extends StatefulWidget {
  const PickupLeaveScreen({super.key});

  @override
  State<PickupLeaveScreen> createState() => _PickupLeaveScreenState();
}

class _PickupLeaveScreenState extends State<PickupLeaveScreen> {
  final _svc = PickupDriverService.instance;
  final _reason = TextEditingController();
  String _leaveType = 'casual';
  final List<String> _dates = [];
  List<Map<String, dynamic>> _rows = [];
  bool _loading = true;
  bool _saving = false;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reason.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final rows = await _svc.myLeaves();
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
        _error = '';
      });
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      setState(() {
        _loading = false;
        _error = pickupErrorText(e);
      });
    }
  }

  String _ymd(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _addDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now.subtract(const Duration(days: 30)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    final day = _ymd(picked);
    setState(() {
      if (!_dates.contains(day)) _dates.add(day);
      _dates.sort();
    });
  }

  Future<void> _submit() async {
    if (_dates.isEmpty) {
      setState(() => _error = 'Add at least one leave date');
      return;
    }
    if (_reason.text.trim().isEmpty) {
      setState(() => _error = 'Please enter a reason');
      return;
    }
    setState(() {
      _saving = true;
      _error = '';
    });
    try {
      await _svc.applyLeave(
        leaveType: _leaveType,
        reason: _reason.text.trim(),
        dates: List.of(_dates),
      );
      if (!mounted) return;
      _reason.clear();
      setState(() {
        _dates.clear();
        _leaveType = 'casual';
      });
      showPickupSnack(context, 'Leave request submitted');
      await _load();
    } catch (e) {
      if (!mounted) return;
      if (await handlePickupAuthError(context, e)) return;
      setState(() => _error = pickupErrorText(e));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _formatDates(Map<String, dynamic> row) {
    final dates = row['dates'];
    if (dates is List && dates.isNotEmpty) return dates.map(str).join(', ');
    final from = str(row['fromDate']);
    final to = str(row['toDate']);
    if (from.isNotEmpty && to.isNotEmpty && from != to) return '$from → $to';
    return from.isEmpty ? '—' : from;
  }

  (Color, Color) _tone(String status) {
    if (status == 'approved') {
      return (const Color(0xFFECFDF5), const Color(0xFF047857));
    }
    if (status == 'rejected') {
      return (const Color(0xFFFFF1F2), const Color(0xFFBE123C));
    }
    return (const Color(0xFFFFFBEB), const Color(0xFFB45309));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PickupColors.page,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: Text('Apply for leave',
            style: pickupText(17, weight: FontWeight.w800)),
      ),
      body: RefreshIndicator(
        color: PickupColors.brand,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 32),
          children: [
            Text('Pickup drivers can request leave with one or more dates.',
                style: pickupText(13, color: PickupColors.muted)),
            if (_error.isNotEmpty) ...[
              const SizedBox(height: 12),
              ErrorBanner(_error),
            ],
            const SizedBox(height: 14),
            PickupCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Type of leave',
                      style: pickupText(12.5, weight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final t in _leaveTypes)
                        ChoiceChip(
                          label: Text(t.$2),
                          selected: _leaveType == t.$1,
                          selectedColor: PickupColors.brandSoft,
                          labelStyle: pickupText(13,
                              weight: FontWeight.w600,
                              color: _leaveType == t.$1
                                  ? PickupColors.brand
                                  : PickupColors.text),
                          onSelected: (_) =>
                              setState(() => _leaveType = t.$1),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text('Reason',
                      style: pickupText(12.5, weight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _reason,
                    minLines: 3,
                    maxLines: 5,
                    decoration: InputDecoration(
                      hintText: 'Why do you need leave?',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text('Leave dates',
                      style: pickupText(12.5, weight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text('Add one or more dates. Non-continuous days are supported.',
                      style: pickupText(11.5, color: PickupColors.faint)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      for (final d in _dates)
                        InputChip(
                          label: Text(d),
                          backgroundColor: PickupColors.brandSoft,
                          labelStyle: pickupText(12.5,
                              weight: FontWeight.w700,
                              color: PickupColors.brand),
                          onDeleted: () => setState(() => _dates.remove(d)),
                        ),
                      ActionChip(
                        avatar: const Icon(Icons.add, size: 18),
                        label: const Text('Add date'),
                        onPressed: _addDate,
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  PickupButton(
                    label: 'Submit leave request',
                    busy: _saving,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            PickupCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('My leave requests',
                      style: pickupText(14, weight: FontWeight.w800)),
                  const SizedBox(height: 10),
                  if (_loading)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(
                            color: PickupColors.brand),
                      ),
                    )
                  else if (_rows.isEmpty)
                    Text('No leave requests yet.',
                        style: pickupText(13, color: PickupColors.faint))
                  else
                    for (final row in _rows) ...[
                      _leaveRow(row),
                      const SizedBox(height: 10),
                    ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _leaveRow(Map<String, dynamic> row) {
    final status = str(row['status']).isEmpty ? 'pending' : str(row['status']);
    final tone = _tone(status);
    final type = str(row['leaveType']);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${type.isEmpty ? '' : type[0].toUpperCase() + type.substring(1)} leave',
                  style: pickupText(13.5, weight: FontWeight.w700),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: tone.$1,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(status,
                    style: pickupText(11,
                        weight: FontWeight.w700, color: tone.$2)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(_formatDates(row),
              style: pickupText(12, color: PickupColors.muted)),
          if (str(row['reason']).isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(str(row['reason']), style: pickupText(13)),
          ],
          if (str(row['adminNotes']).isNotEmpty) ...[
            const SizedBox(height: 4),
            Text('Admin note: ${str(row['adminNotes'])}',
                style: pickupText(12, color: PickupColors.muted)),
          ],
        ],
      ),
    );
  }
}
