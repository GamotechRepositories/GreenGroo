import 'package:flutter/material.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(
        title: 'Apply Leave',
        subtitle: 'Request time off with one or more dates',
        showBackButton: true,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
        children: [
          if (_error != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF451A1A) : const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? const Color(0xFF7F1D1D) : const Color(0xFFFECDD3)),
              ),
              child: Text(
                _error!,
                style: TextStyle(color: isDark ? const Color(0xFFFCA5A5) : const Color(0xFFBE123C), fontSize: 13),
              ),
            ),
          if (_success != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? const Color(0xFF047857) : const Color(0xFFA7F3D0)),
              ),
              child: Text(
                _success!,
                style: TextStyle(color: isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857), fontSize: 13),
              ),
            ),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.cardBackground,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Type of leave',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<String>(
                  initialValue: _leaveType,
                  dropdownColor: AppColors.cardBackground,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.cardBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.primary),
                    ),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'casual', child: Text('🏖️ Casual')),
                    DropdownMenuItem(value: 'sick', child: Text('🤒 Sick')),
                    DropdownMenuItem(value: 'earned', child: Text('🏆 Earned')),
                    DropdownMenuItem(value: 'unpaid', child: Text('📝 Unpaid')),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _leaveType = value);
                  },
                ),
                const SizedBox(height: 12),
                Text(
                  'Reason',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _reasonCtrl,
                  maxLines: 2,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    hintText: 'Why do you need leave?',
                    hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 12),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.cardBorder),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide(color: AppColors.primary),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Leave dates',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 3),
                Text(
                  'Add one or more dates. Non-continuous days supported.',
                  style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 34,
                  child: OutlinedButton.icon(
                    onPressed: _pickDate,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Add date', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                if (_dates.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _dates
                        .map(
                          (day) => Chip(
                            label: Text(day, style: TextStyle(fontSize: 12, color: AppColors.textPrimary)),
                            backgroundColor: AppColors.cardSubBg,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            deleteIconColor: AppColors.textMuted,
                            onDeleted: () => setState(() => _dates.remove(day)),
                          ),
                        )
                        .toList(),
                  ),
                ],
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: Text(
                      _saving ? 'Submitting…' : 'Submit leave request',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          Text(
            'My leave requests',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_rows.isEmpty)
            Text('No leave requests yet.', style: TextStyle(color: AppColors.textMuted, fontSize: 12))
          else
            ..._rows.map(
              (row) {
                final typeEmoji = row.leaveType == 'sick'
                    ? '🤒'
                    : row.leaveType == 'earned'
                        ? '🏆'
                        : row.leaveType == 'unpaid'
                            ? '📝'
                            : '🏖️';

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.cardBackground,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.cardBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(typeEmoji, style: const TextStyle(fontSize: 14)),
                          const SizedBox(width: 6),
                          Text(
                            '${row.leaveType[0].toUpperCase()}${row.leaveType.substring(1)} leave',
                            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textPrimary),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: row.status == 'approved'
                                  ? (isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5))
                                  : row.status == 'rejected'
                                      ? (isDark ? const Color(0xFF451A1A) : const Color(0xFFFFF1F2))
                                      : (isDark ? const Color(0xFF451A03) : const Color(0xFFFFFBEB)),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              row.status,
                              style: TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w800,
                                color: row.status == 'approved'
                                    ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF047857))
                                    : row.status == 'rejected'
                                        ? (isDark ? const Color(0xFFFCA5A5) : const Color(0xFFBE123C))
                                        : (isDark ? const Color(0xFFFDE68A) : const Color(0xFFB45309)),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(row.dates.join(', '), style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                      if (row.reason.isNotEmpty) ...[
                        const SizedBox(height: 3),
                        Text(row.reason, style: TextStyle(fontSize: 12, color: AppColors.textPrimary)),
                      ],
                      if ((row.adminNotes ?? '').isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text('Admin note: ${row.adminNotes}', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
