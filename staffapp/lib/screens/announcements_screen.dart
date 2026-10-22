import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/api_client.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  String _selectedCategory = 'All';
  final List<String> _categories = ['All', 'Company', 'Operations', 'HR'];

  bool _isLoading = true;
  List<Map<String, dynamic>> _announcements = [];

  @override
  void initState() {
    super.initState();
    _loadAnnouncements();
  }

  Future<void> _loadAnnouncements() async {
    try {
      final res = await ApiClient.get('/api/staff/my/feed');
      if (res != null && mounted) {
        final list = res['announcements'] as List?;
        if (list != null) {
          final mapped = list.map((a) {
            return {
              'id': a['id']?.toString() ?? '',
              'title': a['title'] ?? 'Notice',
              'dept': a['createdBy'] ?? 'HR Operations',
              'time': a['publishedAt'] != null ? a['publishedAt'].toString().split('T').first : 'Recent',
              'category': a['category'] ?? 'HR',
              'body': a['body'] ?? '',
            };
          }).toList();

          setState(() {
            _announcements = mapped;
            _isLoading = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) setState(() => _isLoading = false);
  }

  void _showAnnouncementDetail(Map<String, dynamic> a) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
              child: const Icon(Icons.campaign_outlined, color: Color(0xFF1A56DB), size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(a['title'] ?? '', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${a['dept']}  •  ${a['time']}', style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
            const SizedBox(height: 12),
            Text(a['body'] ?? '', style: GoogleFonts.inter(fontSize: 13, height: 1.5, color: const Color(0xFF1E293B))),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1A56DB)),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedCategory == 'All'
        ? _announcements
        : _announcements.where((a) => a['category'] == _selectedCategory || a['dept'] == _selectedCategory).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Announcements',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter Chips Row
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _categories.map((c) {
                final isSelected = _selectedCategory == c;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      c,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: const Color(0xFF1A56DB),
                    backgroundColor: const Color(0xFFF1F5F9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    side: BorderSide.none,
                    onSelected: (val) {
                      if (val) setState(() => _selectedCategory = c);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Announcements List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _loadAnnouncements,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.notifications_off_outlined, color: Color(0xFF94A3B8), size: 40),
                              const SizedBox(height: 8),
                              Text(
                                'No announcements found',
                                style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          itemCount: filtered.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final a = filtered[index];

                            return GestureDetector(
                              onTap: () => _showAnnouncementDetail(a),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFE2E8F0)),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: const Icon(Icons.campaign_outlined, color: Color(0xFF1A56DB), size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            a['title'] ?? '',
                                            style: GoogleFonts.inter(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: const Color(0xFF0F172A),
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${a['dept']} • ${a['time']}',
                                            style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8)),
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            a['body'] ?? '',
                                            style: GoogleFonts.inter(
                                              fontSize: 13,
                                              color: const Color(0xFF334155),
                                              height: 1.4,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }
}
