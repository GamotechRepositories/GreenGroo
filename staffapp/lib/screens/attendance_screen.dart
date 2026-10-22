import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import 'shift_roster_screen.dart';

class AttendanceScreen extends StatefulWidget {
  final bool showBackButton;
  const AttendanceScreen({super.key, this.showBackButton = true});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  bool _isOnDuty = false;
  bool _isPunching = false;
  bool _isLoading = true;

  Map<String, dynamic>? _todayShift;
  List<Map<String, dynamic>> _history = [];

  @override
  void initState() {
    super.initState();
    _loadAttendanceData();
  }

  Future<void> _loadAttendanceData() async {
    try {
      final res = await ApiClient.get('/api/staff/my/attendance');
      if (res != null && mounted) {
        final records = res['records'] as List?;
        final isClockedIn = res['isClockedIn'] == true;

        final mapped = <Map<String, dynamic>>[];
        if (records != null) {
          for (var r in records) {
            final dateStr = r['date'] != null ? r['date'].toString() : 'Today';
            if (r['clockOut'] != null) {
              final outTime = DateFormat('hh:mm a').format(DateTime.parse(r['clockOut']));
              mapped.add({
                'title': 'Punch Out',
                'time': '$outTime  •  $dateStr',
                'tag': 'Completed',
                'isIn': false,
                'tagBg': const Color(0xFFDBEAFE),
                'tagColor': const Color(0xFF1D4ED8),
              });
            }
            if (r['clockIn'] != null) {
              final inTime = DateFormat('hh:mm a').format(DateTime.parse(r['clockIn']));
              mapped.add({
                'title': 'Punch In',
                'time': '$inTime  •  $dateStr',
                'tag': 'Recorded',
                'isIn': true,
                'tagBg': const Color(0xFFDCFCE7),
                'tagColor': const Color(0xFF15803D),
              });
            }
          }
        }

        // Also fetch today's shift info
        final overview = await ApiClient.get('/api/staff/my/overview');
        Map<String, dynamic>? shift;
        if (overview != null && overview['shift'] != null) {
          shift = overview['shift'] as Map<String, dynamic>;
        }

        setState(() {
          _isOnDuty = isClockedIn;
          _history = mapped;
          _todayShift = shift;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleFingerprintPunch() async {
    setState(() => _isPunching = true);
    final action = _isOnDuty ? 'out' : 'in';

    try {
      await ApiClient.post('/api/staff/my/attendance/punch', {'action': action});
      if (mounted) {
        setState(() {
          _isOnDuty = !_isOnDuty;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: _isOnDuty ? const Color(0xFF15803D) : const Color(0xFF1A56DB),
            content: Text(_isOnDuty ? 'Shift Started! Punched In.' : 'Shift Ended! Punched Out.'),
          ),
        );
        _loadAttendanceData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Punch failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isPunching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shiftName = _todayShift?['name'] ?? 'Regular Shift';
    final shiftStart = _todayShift?['startTime'] ?? '09:00 AM';
    final shiftEnd = _todayShift?['endTime'] ?? '06:00 PM';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        automaticallyImplyLeading: widget.showBackButton,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Attendance',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAttendanceData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // 1. Biometric / Fingerprint Punch Card
              Container(
                padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    GestureDetector(
                      onTap: _isPunching ? null : _handleFingerprintPunch,
                      child: Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          shape: BoxShape.circle,
                          border: Border.all(color: const Color(0xFFBFDBFE), width: 2),
                        ),
                        child: Center(
                          child: _isPunching
                              ? const CircularProgressIndicator(color: Color(0xFF1A56DB))
                              : const Icon(
                                  Icons.fingerprint_rounded,
                                  size: 54,
                                  color: Color(0xFF1A56DB),
                                ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _isOnDuty ? 'Tap to Punch Out' : 'Tap to Punch In',
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _isOnDuty ? 'Current shift in progress' : 'Start your shift for today',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 2. Today's Shift Card (Dynamically bound)
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          shiftName,
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                        ),
                        GestureDetector(
                          onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const ShiftRosterScreen()));
                          },
                          child: Text(
                            'View Details',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: const Color(0xFF1A56DB)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text(
                          '$shiftStart - $shiftEnd',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                        const SizedBox(width: 6),
                        Text(
                          'Operations & Dispatch Station',
                          style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 3. Punch History Card (Dynamically loaded from backend)
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
                    Text(
                      'Punch History',
                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 14),

                    if (_isLoading)
                      const Center(
                        child: Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    else if (_history.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 20),
                          child: Text(
                            'No punch records yet',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _history.length,
                        separatorBuilder: (context, index) => const Divider(height: 20, color: Color(0xFFF1F5F9)),
                        itemBuilder: (context, index) {
                          final p = _history[index];
                          final isIn = p['isIn'] == true;

                          return Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: isIn ? const Color(0xFFDCFCE7) : const Color(0xFFEFF6FF),
                                ),
                                child: Icon(
                                  isIn ? Icons.login_rounded : Icons.logout_rounded,
                                  size: 16,
                                  color: isIn ? const Color(0xFF15803D) : const Color(0xFF1D4ED8),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p['title'],
                                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      p['time'],
                                      style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: p['tagBg'],
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  p['tag'],
                                  style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: p['tagColor']),
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
