import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../core/app_colors.dart';
import '../core/api_client.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String _selectedTab = 'All';
  bool _isLoading = true;
  final List<String> _tabs = ['All', 'Important', 'Personal'];

  List<Map<String, dynamic>> _notifications = [];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiClient.get('/api/staff/my/notifications');
      final List rawList = res is List ? res : (res is Map && res['data'] is List ? res['data'] : []);

      final List<Map<String, dynamic>> mapped = [];
      for (final n in rawList) {
        if (n is! Map) continue;
        final id = (n['id'] ?? n['_id'] ?? '').toString();
        final title = (n['title'] ?? 'Notification').toString();
        final message = (n['message'] ?? '').toString();
        final priority = (n['priority'] ?? 'normal').toString();
        final categoryStr = (n['category'] ?? '').toString();
        final sentBy = (n['sentBy'] ?? 'Admin').toString();
        final isRead = n['isRead'] == true;
        final createdAtStr = n['createdAt']?.toString();

        String timeStr = 'Recent';
        if (createdAtStr != null) {
          try {
            final dt = DateTime.parse(createdAtStr);
            final diff = DateTime.now().difference(dt);
            if (diff.inMinutes < 60) {
              timeStr = '${diff.inMinutes}m ago';
            } else if (diff.inHours < 24) {
              timeStr = '${diff.inHours}h ago';
            } else {
              timeStr = DateFormat('dd MMM').format(dt);
            }
          } catch (_) {}
        }

        final isUrgent = priority == 'urgent' || priority == 'high';
        final isPersonal = categoryStr.toLowerCase() == 'personal' || categoryStr.toLowerCase() == 'staff';

        String category = 'Important';
        if (isPersonal) {
          category = 'Personal';
        } else if (!isUrgent) {
          category = 'All';
        }

        IconData icon = Icons.notifications_none_rounded;
        Color iconBg = const Color(0xFFDBEAFE);
        Color iconColor = const Color(0xFF2563EB);

        if (isUrgent) {
          icon = Icons.campaign_rounded;
          iconBg = const Color(0xFFFEE2E2);
          iconColor = const Color(0xFFDC2626);
        } else if (categoryStr.toLowerCase() == 'leave') {
          icon = Icons.check_circle_outline_rounded;
          iconBg = const Color(0xFFDCFCE7);
          iconColor = const Color(0xFF16A34A);
        } else if (categoryStr.toLowerCase() == 'salary' || categoryStr.toLowerCase() == 'incentive') {
          icon = Icons.savings_outlined;
          iconBg = const Color(0xFFFEF3C7);
          iconColor = const Color(0xFFD97706);
        }

        mapped.add({
          'id': id,
          'title': title,
          'sender': '$sentBy • $timeStr',
          'body': message,
          'icon': icon,
          'iconBg': iconBg,
          'iconColor': iconColor,
          'category': category,
          'isRead': isRead,
        });
      }

      if (mounted) {
        setState(() {
          _notifications = mapped;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(Map<String, dynamic> n) async {
    final id = n['id'];
    setState(() => n['isRead'] = true);

    if (id != null && id.toString().isNotEmpty) {
      try {
        await ApiClient.post('/api/staff/my/notifications/$id/read', {});
      } catch (_) {}
    }
  }

  void _showNotificationDetail(Map<String, dynamic> n) {
    _markAsRead(n);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: n['iconBg'], shape: BoxShape.circle),
              child: Icon(n['icon'], color: n['iconColor'], size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(n['title'], style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(n['sender'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 12),
            Text(n['body'], style: GoogleFonts.inter(fontSize: 13, height: 1.5, color: const Color(0xFF1E293B))),
          ],
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Got it', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _selectedTab == 'All'
        ? _notifications
        : _notifications.where((n) => n['category'] == _selectedTab || n['category'] == 'Important').toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Notifications',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
      ),
      body: Column(
        children: [
          // Filter Tabs: [All] | [Important] | [Personal]
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: _tabs.map((t) {
                final isSelected = _selectedTab == t;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(
                      t,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                    selected: isSelected,
                    selectedColor: AppColors.primary,
                    backgroundColor: const Color(0xFFF1F5F9),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    side: BorderSide.none,
                    onSelected: (val) {
                      if (val) setState(() => _selectedTab = t);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          // Notifications List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : RefreshIndicator(
                    onRefresh: _loadNotifications,
                    color: AppColors.primary,
                    child: filtered.isEmpty
                        ? Center(
                            child: SingleChildScrollView(
                              physics: const AlwaysScrollableScrollPhysics(),
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.notifications_off_outlined, size: 52, color: AppColors.textMuted),
                                  const SizedBox(height: 14),
                                  Text(
                                    'No Notifications',
                                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Broadcasts, announcements, and direct notices will appear here.',
                                    textAlign: TextAlign.center,
                                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                            itemCount: filtered.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final n = filtered[index];

                              return GestureDetector(
                                onTap: () => _showNotificationDetail(n),
                                child: Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: n['isRead'] == false
                                          ? AppColors.primary.withValues(alpha: 0.4)
                                          : const Color(0xFFE2E8F0),
                                      width: n['isRead'] == false ? 1.5 : 1.0,
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: n['iconBg'],
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(n['icon'], color: n['iconColor'], size: 20),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    n['title'],
                                                    style: GoogleFonts.inter(
                                                      fontSize: 14,
                                                      fontWeight: FontWeight.bold,
                                                      color: const Color(0xFF0F172A),
                                                    ),
                                                  ),
                                                ),
                                                if (n['isRead'] == false)
                                                  Container(
                                                    width: 8,
                                                    height: 8,
                                                    decoration: const BoxDecoration(
                                                      color: AppColors.primary,
                                                      shape: BoxShape.circle,
                                                    ),
                                                  ),
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              n['sender'],
                                              style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                                            ),
                                            const SizedBox(height: 6),
                                            Text(
                                              n['body'],
                                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155), height: 1.4),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
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
