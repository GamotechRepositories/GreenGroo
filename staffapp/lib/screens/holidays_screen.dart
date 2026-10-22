import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';

class HolidaysScreen extends StatefulWidget {
  const HolidaysScreen({super.key});

  @override
  State<HolidaysScreen> createState() => _HolidaysScreenState();
}

class _HolidaysScreenState extends State<HolidaysScreen> {
  int _selectedDay = DateTime.now().day;
  int _monthIndex = DateTime.now().month - 1; // 0 to 11

  bool _isLoading = true;
  List<Map<String, dynamic>> _holidays = [];

  @override
  void initState() {
    super.initState();
    _loadHolidays();
  }

  Future<void> _loadHolidays() async {
    try {
      final res = await ApiClient.get('/api/staff/my/feed');
      if (res != null && mounted) {
        final list = res['holidays'] as List?;
        if (list != null) {
          final now = DateTime.now();
          final mapped = list.map((h) {
            DateTime? hDate;
            if (h['scheduledAt'] != null && h['scheduledAt'].toString().isNotEmpty) {
              hDate = DateTime.tryParse(h['scheduledAt'].toString());
            }

            int daysLeft = 0;
            String daysLabel = 'Holiday';
            if (hDate != null) {
              daysLeft = hDate.difference(now).inDays;
              if (daysLeft > 0) {
                daysLabel = '$daysLeft days left';
              } else if (daysLeft == 0) {
                daysLabel = 'Today';
              } else {
                daysLabel = 'Passed';
              }
            }

            return {
              'id': h['id']?.toString() ?? '',
              'name': h['title'] ?? 'Company Holiday',
              'date': hDate != null ? DateFormat('d MMM yyyy (E)').format(hDate) : 'Annual Holiday',
              'daysLeft': daysLabel,
              'dateTime': hDate,
              'description': h['body'] ?? 'Official paid holiday observed by GreenGroo.',
            };
          }).toList();

          setState(() {
            _holidays = mapped;
            _isLoading = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  void _showHolidayDetail(Map<String, dynamic> h) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.celebration_rounded, color: Color(0xFF1A56DB), size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(h['name'], style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(h['date'], style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    h['daysLeft'],
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.bold, color: const Color(0xFF15803D)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 10),
            Text(h['description'], style: GoogleFonts.inter(fontSize: 13, height: 1.4)),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currentYear = DateTime.now().year;
    final monthName = DateFormat('MMMM yyyy').format(DateTime(currentYear, _monthIndex + 1, 1));

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Holidays',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _loadHolidays,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Upcoming Holidays Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Upcoming Holidays',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    '${_holidays.length} Listed',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A56DB),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 12),

              // Upcoming Holidays List (Dynamically populated from backend)
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_holidays.isEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Center(
                    child: Text(
                      'No upcoming holidays published by HR',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _holidays.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final h = _holidays[index];

                    return GestureDetector(
                      onTap: () => _showHolidayDetail(h),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.celebration_outlined, color: Color(0xFF1A56DB), size: 22),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    h['name'],
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    h['date'],
                                    style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                h['daysLeft'],
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF15803D),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),

              const SizedBox(height: 24),

              // Holiday Calendar Section
              Text(
                'Holiday Calendar',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  children: [
                    // Month navigation
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left_rounded, color: Color(0xFF64748B)),
                          onPressed: () {
                            if (_monthIndex > 0) setState(() => _monthIndex--);
                          },
                        ),
                        Text(
                          monthName,
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172A),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B)),
                          onPressed: () {
                            if (_monthIndex < 11) setState(() => _monthIndex++);
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Weekdays
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) {
                        return SizedBox(
                          width: 36,
                          child: Text(
                            day,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF94A3B8),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 12),

                    // Calendar Dates Grid
                    _buildCalendarGrid(currentYear, _monthIndex + 1),
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

  Widget _buildCalendarGrid(int year, int month) {
    final firstDay = DateTime(year, month, 1);
    final daysInMonth = DateTime(year, month + 1, 0).day;
    final leadOffset = firstDay.weekday - 1; // Mon = 1 -> offset 0

    final days = <Widget>[];

    for (int i = 0; i < leadOffset; i++) {
      days.add(const SizedBox(width: 36, height: 36));
    }

    for (int day = 1; day <= daysInMonth; day++) {
      final matchingHoliday = _holidays.firstWhere(
        (h) {
          final hDate = h['dateTime'] as DateTime?;
          return hDate != null && hDate.year == year && hDate.month == month && hDate.day == day;
        },
        orElse: () => {},
      );

      final isHoliday = matchingHoliday.isNotEmpty;
      final isSelected = day == _selectedDay;

      days.add(
        GestureDetector(
          onTap: () {
            setState(() => _selectedDay = day);
            if (isHoliday) {
              _showHolidayDetail(matchingHoliday);
            }
          },
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isHoliday
                  ? const Color(0xFF1A56DB)
                  : (isSelected ? const Color(0xFFDBEAFE) : Colors.transparent),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$day',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: (isHoliday || isSelected) ? FontWeight.bold : FontWeight.w500,
                  color: isHoliday
                      ? Colors.white
                      : (isSelected ? const Color(0xFF1A56DB) : const Color(0xFF334155)),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 8,
      alignment: WrapAlignment.spaceAround,
      children: days,
    );
  }
}
