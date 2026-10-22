import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';

class ShiftRosterScreen extends StatefulWidget {
  final bool showBackButton;
  const ShiftRosterScreen({super.key, this.showBackButton = true});

  @override
  State<ShiftRosterScreen> createState() => _ShiftRosterScreenState();
}

class _ShiftRosterScreenState extends State<ShiftRosterScreen> {
  int _selectedDayIndex = 0;
  bool _isLoading = true;

  late List<Map<String, dynamic>> _days;
  List<dynamic> _backendShifts = [];

  @override
  void initState() {
    super.initState();
    _initDaysOfWeek();
    _loadShifts();
  }

  void _initDaysOfWeek() {
    final now = DateTime.now();
    // Start of current week (Monday)
    final monday = now.subtract(Duration(days: now.weekday - 1));

    _days = List.generate(7, (i) {
      final d = monday.add(Duration(days: i));
      return {
        'day': DateFormat('E').format(d),
        'date': DateFormat('d').format(d),
        'ymd': DateFormat('yyyy-MM-dd').format(d),
        'full': DateFormat('d MMM').format(d),
      };
    });
  }

  Future<void> _loadShifts() async {
    try {
      final res = await ApiClient.get('/api/staff/my/shifts');
      if (res != null && mounted) {
        setState(() {
          _backendShifts = res is List ? res : [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedDay = _days[_selectedDayIndex];
    final selectedYmd = selectedDay['ymd'];

    // Filter shifts for selected date or general shifts
    final dayShifts = _backendShifts.where((s) {
      final shiftDate = s['date']?.toString();
      return shiftDate == selectedYmd || shiftDate == null || shiftDate.isEmpty;
    }).toList();

    final dateRangeLabel = '${_days.first['full']} - ${_days.last['full']}, ${DateTime.now().year}';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        automaticallyImplyLeading: widget.showBackButton,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Shift Roster',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadShifts,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            children: [
              // Date Range Card with Day Pills
              Container(
                padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left_rounded, color: Color(0xFF64748B), size: 22),
                          onPressed: () {},
                        ),
                        Text(
                          dateRangeLabel,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B), size: 22),
                          onPressed: () {},
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Horizontal Day Pills Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: _days.asMap().entries.map((entry) {
                        final i = entry.key;
                        final d = entry.value;
                        final isSelected = i == _selectedDayIndex;

                        return GestureDetector(
                          onTap: () => setState(() => _selectedDayIndex = i),
                          child: Container(
                            width: 42,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF1A56DB) : Colors.transparent,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              children: [
                                Text(
                                  d['day']!,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: isSelected ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF64748B),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  d['date']!,
                                  style: GoogleFonts.outfit(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Shift Cards List
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (dayShifts.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Center(
                    child: Column(
                      children: [
                        const Icon(Icons.event_busy_outlined, color: Color(0xFF94A3B8), size: 36),
                        const SizedBox(height: 8),
                        Text(
                          'No scheduled shifts for this date',
                          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: dayShifts.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final s = dayShifts[index];
                    final title = s['shiftName'] ?? 'Shift Assignment';
                    final startTime = s['startTime'] ?? '09:00 AM';
                    final endTime = s['endTime'] ?? '06:00 PM';
                    final notes = s['notes'] ?? 'Warehouse - Pune';

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: const BoxDecoration(
                              color: Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.access_time_rounded, color: Color(0xFF1A56DB), size: 22),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      title,
                                      style: GoogleFonts.inter(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const Spacer(),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFDCFCE7),
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Text(
                                        'Scheduled',
                                        style: GoogleFonts.inter(
                                          fontSize: 11,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF15803D),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(Icons.access_time_rounded, size: 14, color: Color(0xFF64748B)),
                                    const SizedBox(width: 4),
                                    Text(
                                      '$startTime - $endTime',
                                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF64748B)),
                                    const SizedBox(width: 4),
                                    Text(
                                      notes,
                                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 20),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
