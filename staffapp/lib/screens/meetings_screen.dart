import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/app_colors.dart';
import '../core/api_client.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen> {
  int _selectedTabIndex = 0; // 0: Upcoming, 1: Past
  bool _isLoading = true;
  List<Map<String, dynamic>> _meetings = [];

  @override
  void initState() {
    super.initState();
    _loadMeetings();
  }

  Future<void> _loadMeetings() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/api/staff/my/meetings');
      final List rawList = res is List ? res : (res is Map && res['data'] is List ? res['data'] : []);

      final now = DateTime.now();
      final List<Map<String, dynamic>> mapped = [];

      for (final m in rawList) {
        if (m is! Map) continue;
        final link = (m['link'] ?? '').toString();
        final note = (m['note'] ?? '').toString();
        final meetingId = (m['meetingId'] ?? '').toString();
        final password = (m['password'] ?? '').toString();
        final createdAtStr = m['createdAt']?.toString();

        DateTime dt = now;
        if (createdAtStr != null) {
          try {
            dt = DateTime.parse(createdAtStr);
          } catch (_) {}
        }

        // Meeting is upcoming if created within last 24h or in future
        final isUpcoming = dt.isAfter(now.subtract(const Duration(hours: 24)));

        String platform = 'Google Meet';
        IconData icon = Icons.video_call_rounded;
        final lowerLink = link.toLowerCase();
        if (lowerLink.contains('zoom')) {
          platform = 'Zoom';
          icon = Icons.videocam_rounded;
        } else if (lowerLink.contains('teams')) {
          platform = 'MS Teams';
          icon = Icons.groups_rounded;
        } else if (lowerLink.contains('webex')) {
          platform = 'Cisco Webex';
          icon = Icons.video_chat_rounded;
        }

        final title = note.isNotEmpty ? note : (meetingId.isNotEmpty ? 'Meeting ID: $meetingId' : 'Team Sync');
        final formattedDt = DateFormat('dd MMM yyyy • hh:mm a').format(dt);

        mapped.add({
          'id': m['_id'] ?? '',
          'title': title,
          'datetime': formattedDt,
          'platform': platform,
          'url': link,
          'meetingId': meetingId,
          'password': password,
          'icon': icon,
          'isUpcoming': isUpcoming,
        });
      }

      if (mounted) {
        setState(() {
          _meetings = mapped;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _launchMeetingUrl(String urlStr) async {
    if (urlStr.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No meeting URL specified by host')),
      );
      return;
    }

    final uri = Uri.tryParse(urlStr.startsWith('http') ? urlStr : 'https://$urlStr');
    if (uri != null) {
      try {
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
          return;
        }
      } catch (_) {}
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Joining: $urlStr')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedTabIndex == 0
        ? _meetings.where((m) => m['isUpcoming'] == true).toList()
        : _meetings.where((m) => m['isUpcoming'] == false).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Meetings',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Tab Switcher: [Upcoming] | [Past]
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
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
                          color: _selectedTabIndex == 0 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Upcoming',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _selectedTabIndex == 0 ? Colors.white : AppColors.textSecondary,
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
                          color: _selectedTabIndex == 1 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Past',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: _selectedTabIndex == 1 ? Colors.white : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Meetings List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : RefreshIndicator(
                    onRefresh: _loadMeetings,
                    color: AppColors.primary,
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                      children: [
                        if (filtered.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 50),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.event_available_rounded, size: 48, color: AppColors.textMuted),
                                  const SizedBox(height: 12),
                                  Text(
                                    _selectedTabIndex == 0
                                        ? 'No upcoming meetings scheduled'
                                        : 'No past meetings recorded',
                                    style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'HR and team sync links will appear here.',
                                    style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ...filtered.map((m) {
                            final hasUrl = (m['url'] as String).isNotEmpty;
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
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
                                    child: Icon(m['icon'], color: AppColors.primary, size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          m['title'],
                                          style: GoogleFonts.inter(
                                            fontSize: 14,
                                            fontWeight: FontWeight.bold,
                                            color: const Color(0xFF0F172A),
                                          ),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          m['datetime'],
                                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            const Icon(Icons.videocam_outlined, size: 13, color: AppColors.textMuted),
                                            const SizedBox(width: 4),
                                            Text(
                                              m['platform'],
                                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                                            ),
                                            if (m['password'] != null && (m['password'] as String).isNotEmpty) ...[
                                              const SizedBox(width: 8),
                                              Text(
                                                '• Pass: ${m['password']}',
                                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  ElevatedButton(
                                    onPressed: hasUrl ? () => _launchMeetingUrl(m['url']) : null,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: hasUrl ? AppColors.primary : const Color(0xFF94A3B8),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    ),
                                    child: const Text('Join', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                            );
                          }),

                        const SizedBox(height: 32),

                        // Bottom Illustration & Text
                        Center(
                          child: Column(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFEFF6FF),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.groups_rounded, size: 36, color: AppColors.primary),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Stay connected with your team',
                                style: GoogleFonts.outfit(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Meetings help us move forward together',
                                style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
