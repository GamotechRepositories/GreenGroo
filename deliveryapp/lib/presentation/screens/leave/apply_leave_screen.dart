import 'package:flutter/material.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/auth_service.dart';
import '../../../data/services/leave_service.dart';
import '../../widgets/layout/custom_app_bar.dart';

class ApplyLeaveScreen extends StatefulWidget {
  const ApplyLeaveScreen({super.key});

  @override
  State<ApplyLeaveScreen> createState() => _ApplyLeaveScreenState();
}

class _ApplyLeaveScreenState extends State<ApplyLeaveScreen> {
  final _reasonCtrl = TextEditingController();
  String _leaveType = 'casual';
  final List<String> _dates = [];
  List<LeaveRequestItem> _rows = [];
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _success;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final rows = await LeaveService.instance.fetchMine();
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    final day =
        '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    if (_dates.contains(day)) return;
    setState(() {
      _dates.add(day);
      _dates.sort();
    });
  }

  Future<void> _submit() async {
    if (_dates.isEmpty) {
      setState(() => _error = 'Add at least one leave date');
      return;
    }
    if (_reasonCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Reason is required');
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
      _success = null;
    });
    try {
      await LeaveService.instance.apply(
        leaveType: _leaveType,
        reason: _reasonCtrl.text.trim(),
        dates: List<String>.from(_dates),
        name: AuthService.instance.deliveryBoy?.name,
      );
      if (!mounted) return;
      setState(() {
        _saving = false;
        _success = 'Leave request submitted';
        _reasonCtrl.clear();
        _dates.clear();
        _leaveType = 'casual';
      });
      await _load();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(
        title: 'Apply Leave',
        subtitle: 'Request time off with one or more dates',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          if (_error != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: Text(_error!, style: const TextStyle(color: Color(0xFFBE123C))),
            ),
          if (_success != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFA7F3D0)),
              ),
              child: Text(_success!, style: const TextStyle(color: Color(0xFF047857))),
            ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Type of leave', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _leaveType,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  items: const [
                    DropdownMenuItem(value: 'casual', child: Text('Casual')),
                    DropdownMenuItem(value: 'sick', child: Text('Sick')),
                    DropdownMenuItem(value: 'earned', child: Text('Earned')),
                    DropdownMenuItem(value: 'unpaid', child: Text('Unpaid')),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _leaveType = value);
                  },
                ),
                const SizedBox(height: 16),
                const Text('Reason', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
                TextField(
                  controller: _reasonCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    border: OutlineInputBorder(),
                    hintText: 'Why do you need leave?',
                  ),
                ),
                const SizedBox(height: 16),
                const Text('Leave dates', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 4),
                const Text(
                  'Add one or more dates. Non-continuous days are supported.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: _pickDate,
                  icon: const Icon(Icons.add),
                  label: const Text('Add date'),
                ),
                if (_dates.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _dates
                        .map(
                          (day) => Chip(
                            label: Text(day),
                            onDeleted: () => setState(() => _dates.remove(day)),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text(_saving ? 'Submitting…' : 'Submit leave request'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Text('My leave requests', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 10),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_rows.isEmpty)
            const Text('No leave requests yet.', style: TextStyle(color: Color(0xFF94A3B8)))
          else
            ..._rows.map(
              (row) => Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          '${row.leaveType[0].toUpperCase()}${row.leaveType.substring(1)} leave',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: row.status == 'approved'
                                ? const Color(0xFFECFDF5)
                                : row.status == 'rejected'
                                    ? const Color(0xFFFFF1F2)
                                    : const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            row.status,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: row.status == 'approved'
                                  ? const Color(0xFF047857)
                                  : row.status == 'rejected'
                                      ? const Color(0xFFBE123C)
                                      : const Color(0xFFB45309),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(row.dates.join(', '), style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    if (row.reason.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(row.reason),
                    ],
                    if ((row.adminNotes ?? '').isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text('Admin note: ${row.adminNotes}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    ],
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
