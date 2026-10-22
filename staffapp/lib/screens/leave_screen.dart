import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';

class LeaveScreen extends StatefulWidget {
  final bool showBackButton;
  const LeaveScreen({super.key, this.showBackButton = true});

  @override
  State<LeaveScreen> createState() => _LeaveScreenState();
}

class _LeaveScreenState extends State<LeaveScreen> {
  int _selectedTabIndex = 0; // 0: Apply Leave, 1: My Leaves
  int _clCount = 0;
  int _slCount = 0;
  int _elCount = 0;

  bool _isLoading = true;
  List<Map<String, dynamic>> _leaveRequests = [];

  @override
  void initState() {
    super.initState();
    _loadLeaves();
  }

  Future<void> _loadLeaves() async {
    try {
      final res = await ApiClient.get('/api/staff/my/leaves');
      if (res != null && mounted) {
        final balances = res['balances'] as Map<String, dynamic>?;
        final requests = res['requests'] as List?;

        int cl = 0, sl = 0, el = 0;
        if (balances != null) {
          cl = balances['casual']?['remaining'] ?? 0;
          sl = balances['sick']?['remaining'] ?? 0;
          el = balances['earned']?['remaining'] ?? 0;
        }

        final mapped = <Map<String, dynamic>>[];
        if (requests != null) {
          for (var r in requests) {
            final type = (r['leaveType'] ?? 'casual').toString().toUpperCase();
            final status = (r['status'] ?? 'pending').toString();
            final isAppr = status == 'approved';
            final isRej = status == 'rejected';

            mapped.add({
              'id': r['id']?.toString() ?? '',
              'type': '$type Leave',
              'dates': '${r['fromDate'] ?? ""} - ${r['toDate'] ?? ""}',
              'days': '${r['days'] ?? 1} day(s)',
              'status': status[0].toUpperCase() + status.substring(1),
              'statusBg': isAppr
                  ? const Color(0xFFDCFCE7)
                  : (isRej ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
              'statusColor': isAppr
                  ? const Color(0xFF15803D)
                  : (isRej ? const Color(0xFFB91C1C) : const Color(0xFFB45309)),
              'reason': r['reason'] ?? '',
              'adminNotes': r['adminNotes'] ?? '',
            });
          }
        }

        setState(() {
          _clCount = cl;
          _slCount = sl;
          _elCount = el;
          _leaveRequests = mapped;
          _isLoading = false;
        });
        return;
      }
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  void _showApplyLeaveSheet() {
    String leaveType = 'casual';
    final reasonController = TextEditingController();
    DateTime fromDate = DateTime.now().add(const Duration(days: 1));
    DateTime toDate = DateTime.now().add(const Duration(days: 1));
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final durationDays = toDate.difference(fromDate).inDays + 1;
          final available = leaveType == 'casual'
              ? _clCount
              : (leaveType == 'sick' ? _slCount : _elCount);

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Apply for Leave', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  initialValue: leaveType,
                  decoration: InputDecoration(
                    labelText: 'Leave Category',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: [
                    DropdownMenuItem(value: 'casual', child: Text('Casual Leave (CL) - $_clCount left')),
                    DropdownMenuItem(value: 'sick', child: Text('Sick Leave (SL) - $_slCount left')),
                    DropdownMenuItem(value: 'earned', child: Text('Earned Leave (EL) - $_elCount left')),
                  ],
                  onChanged: (val) {
                    if (val != null) setSheetState(() => leaveType = val);
                  },
                ),
                const SizedBox(height: 14),

                // Date Range Picker row
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: ctx,
                            initialDate: fromDate,
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setSheetState(() {
                              fromDate = picked;
                              if (toDate.isBefore(fromDate)) toDate = fromDate;
                            });
                          }
                        },
                        child: Text('From: ${DateFormat('dd MMM').format(fromDate)}', style: GoogleFonts.inter(fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: ctx,
                            initialDate: toDate.isBefore(fromDate) ? fromDate : toDate,
                            firstDate: fromDate,
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setSheetState(() => toDate = picked);
                          }
                        },
                        child: Text('To: ${DateFormat('dd MMM').format(toDate)}', style: GoogleFonts.inter(fontSize: 12)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                // Duration Indicator
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFBFDBFE)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Duration to deduct:', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569))),
                      Text(
                        '$durationDays day${durationDays > 1 ? "s" : ""}',
                        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1A56DB)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                TextField(
                  controller: reasonController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Reason for leave',
                    hintText: 'Describe reason for leave request...',
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isSubmitting ? const Color(0xFF94A3B8) : const Color(0xFF1A56DB),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final reason = reasonController.text.trim();
                          if (reason.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter a reason for leave')),
                            );
                            return;
                          }

                          if (durationDays > available) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                backgroundColor: const Color(0xFFDC2626),
                                content: Text('Insufficient balance. You only have $available day(s) for ${leaveType.toUpperCase()} leave.'),
                              ),
                            );
                            return;
                          }

                          // Immediately disable button
                          setSheetState(() => isSubmitting = true);

                        try {
                          try {
                            await ApiClient.post('/api/staff/my/leaves', {
                              'fromDate': DateFormat('yyyy-MM-dd').format(fromDate),
                              'toDate': DateFormat('yyyy-MM-dd').format(toDate),
                              'leaveType': leaveType,
                              'reason': reason,
                            });
                          } catch (_) {
                            await ApiClient.post('/api/staff/my/leaves/apply', {
                              'fromDate': DateFormat('yyyy-MM-dd').format(fromDate),
                              'toDate': DateFormat('yyyy-MM-dd').format(toDate),
                              'leaveType': leaveType,
                              'reason': reason,
                            });
                          }

                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: Color(0xFF15803D),
                              content: Text('Leave application submitted to HR!'),
                            ),
                          );
                          _loadLeaves();
                        } catch (e) {
                          if (ctx.mounted) {
                            setSheetState(() => isSubmitting = false);
                            Navigator.pop(ctx);
                          }
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: const Color(0xFFDC2626),
                              content: Text('Submission failed: ${e.toString().replaceAll("Exception:", "").trim()}'),
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          ),
                          SizedBox(width: 10),
                          Text('Submitting...', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        ],
                      )
                    : const Text('Submit Application', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        );
      },
    ),
  );
}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        automaticallyImplyLeading: widget.showBackButton,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Leave',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadLeaves,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Segmented Top Switcher
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTabIndex = 0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedTabIndex == 0 ? const Color(0xFF1A56DB) : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Apply Leave',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _selectedTabIndex == 0 ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedTabIndex = 1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          decoration: BoxDecoration(
                            color: _selectedTabIndex == 1 ? const Color(0xFF1A56DB) : Colors.transparent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'My Leaves',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _selectedTabIndex == 1 ? Colors.white : const Color(0xFF64748B),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Section: Leave Balance
              Text(
                'Leave Balance',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 10),

              // 3 Dynamic Balance Cards
              Row(
                children: [
                  Expanded(child: _buildBalanceCard('$_clCount', 'CL', 'Casual Leave')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildBalanceCard('$_slCount', 'SL', 'Sick Leave')),
                  const SizedBox(width: 10),
                  Expanded(child: _buildBalanceCard('$_elCount', 'EL', 'Earned Leave')),
                ],
              ),

              const SizedBox(height: 16),

              // Big Blue Button: "Apply for Leave"
              ElevatedButton(
                onPressed: _showApplyLeaveSheet,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1A56DB),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 13),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  'Apply for Leave',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              const SizedBox(height: 22),

              // My Leave Requests Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'My Leave Requests',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1E293B),
                    ),
                  ),
                  Text(
                    '${_leaveRequests.length} Total',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A56DB),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Leave Request Cards List (Loaded from backend)
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_leaveRequests.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Center(
                    child: Text(
                      'No leave applications submitted yet',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _leaveRequests.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final req = _leaveRequests[index];

                    return Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.event_note_rounded, color: Color(0xFF1A56DB), size: 18),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  req['type'],
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF0F172A),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${req['dates']} (${req['days']})',
                                  style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: req['statusBg'],
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              req['status'],
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: req['statusColor'],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceCard(String count, String code, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                count,
                style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              ),
              Text(
                code,
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }
}
