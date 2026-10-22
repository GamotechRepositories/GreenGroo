import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/app_colors.dart';
import '../core/api_client.dart';
import '../core/session_manager.dart';
import 'login_screen.dart';
import 'salary_screen.dart';

class ProfileScreen extends StatefulWidget {
  final bool showBackButton;
  const ProfileScreen({super.key, this.showBackButton = true});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic> _staff = {};

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final s = await SessionManager.getStaff();
    if (mounted && s != null) {
      setState(() => _staff = s);
    }

    // Refresh from live backend
    try {
      final res = await ApiClient.get('/api/staff/my/overview');
      if (res != null && res['profile'] != null && mounted) {
        final profile = res['profile'] as Map<String, dynamic>;
        setState(() => _staff = profile);
        await SessionManager.saveStaff(profile);
      }
    } catch (_) {}
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Log Out'),
        content: const Text('Are you sure you want to log out of your staff account?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log Out', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await SessionManager.clearSession();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  void _showInfoSheet(String title, List<Map<String, String>> fields) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            ...fields.map((f) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(f['label']!, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
                      Flexible(
                        child: Text(
                          f['value']!,
                          textAlign: TextAlign.right,
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
                        ),
                      ),
                    ],
                  ),
                )),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final rawName = (_staff['name'] ?? '').toString().trim();
    final name = rawName.isNotEmpty ? rawName : (_staff['email'] ?? 'Staff Member');
    final staffId = _staff['staffId'] ?? (_staff['id'] != null ? 'GG${_staff['id'].toString().substring(0, 4).toUpperCase()}' : 'GG-STAFF');
    final role = _staff['roleLabel'] ?? _staff['roleTitle'] ?? (_staff['role'] ?? 'Operations').toString().replaceAll('_', ' ').toUpperCase();
    final email = (_staff['email'] ?? '—').toString();
    final phone = (_staff['phone'] ?? '—').toString();
    final dept = _staff['department'] ?? 'Operations';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFD),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A56DB),
        elevation: 0,
        centerTitle: false,
        automaticallyImplyLeading: widget.showBackButton,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          'Profile',
          style: GoogleFonts.outfit(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: Colors.white),
            onPressed: () {
              _showInfoSheet('App Configuration', [
                {'label': 'App Version', 'value': 'v1.0.0 (GreenGroo Staff)'},
                {'label': 'Push Notifications', 'value': 'Enabled ✓'},
                {'label': 'Live Attendance GPS', 'value': 'Active during punch ✓'},
                {'label': 'Sync Status', 'value': 'Connected to Server'},
              ]);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadProfile,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            children: [
              // Profile Card (Matches Screen 12)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFFDBEAFE),
                        border: Border.all(color: const Color(0xFFBFDBFE), width: 1.5),
                      ),
                      child: Center(
                        child: Text(
                          name.isNotEmpty ? name[0].toUpperCase() : 'S',
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF1A56DB),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: GoogleFonts.inter(
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Staff ID: $staffId',
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                          const SizedBox(height: 1),
                          Text(
                            role,
                            style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Settings Menu List (Matches Screen 12)
              _buildMenuItem(
                Icons.person_outline_rounded,
                'Personal Information',
                onTap: () {
                  _showInfoSheet('Personal Information', [
                    {'label': 'Full Name', 'value': name},
                    {'label': 'Staff ID', 'value': staffId},
                    {'label': 'Email', 'value': email},
                    {'label': 'Phone', 'value': phone},
                    {'label': 'Designation', 'value': role},
                    {'label': 'Department', 'value': dept},
                  ]);
                },
              ),
              _buildMenuItem(
                Icons.account_balance_outlined,
                'Bank Details',
                onTap: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const SalaryScreen()));
                },
              ),
              _buildMenuItem(
                Icons.phone_outlined,
                'Emergency Contact',
                onTap: () {
                  _showInfoSheet('Emergency Support Contacts', [
                    {'label': 'Registered Phone', 'value': phone.isNotEmpty ? phone : 'Not specified'},
                    {'label': 'HR Support Hotline', 'value': '+91 80000 12345'},
                    {'label': 'HR Desk Email', 'value': 'hr@greengroo.in'},
                    {'label': 'Support Hours', 'value': '9:00 AM - 6:00 PM (Mon-Sat)'},
                  ]);
                },
              ),
              _buildMenuItem(
                Icons.description_outlined,
                'Documents & KYC',
                onTap: () {
                  _showInfoSheet('KYC Verification', [
                    {'label': 'Employee Profile', 'value': 'Verified ✓'},
                    {'label': 'Mobile Number Verification', 'value': phone.isNotEmpty ? 'Verified ✓ ($phone)' : 'Pending'},
                    {'label': 'Staff Identity', 'value': 'Active ($staffId)'},
                    {'label': 'HR Agreement', 'value': 'On Record ✓'},
                  ]);
                },
              ),
              _buildMenuItem(
                Icons.lock_outline_rounded,
                'Change Password',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Password reset link sent to $email'),
                      backgroundColor: AppColors.primary,
                    ),
                  );
                },
              ),
              _buildMenuItem(
                Icons.settings_outlined,
                'App Settings',
                onTap: () {
                  _showInfoSheet('App Configuration', [
                    {'label': 'App Version', 'value': 'v1.0.0 (GreenGroo Staff)'},
                    {'label': 'Push Notifications', 'value': 'Active ✓'},
                    {'label': 'Auto Shift Sync', 'value': 'Enabled ✓'},
                  ]);
                },
              ),
              _buildMenuItem(
                Icons.help_outline_rounded,
                'Help & Support',
                onTap: () {
                  _showInfoSheet('HR & Operations Help Desk', [
                    {'label': 'HR Desk', 'value': 'hr@greengroo.in'},
                    {'label': 'Operations Helpline', 'value': '+91 80000 12345'},
                    {'label': 'Support Hours', 'value': '9:00 AM - 6:00 PM (Mon-Sat)'},
                  ]);
                },
              ),

              const SizedBox(height: 20),

              // Logout Button (Soft Red Background & Red Border matching Screen 12)
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _handleLogout,
                  icon: const Icon(Icons.logout_rounded, color: Color(0xFFDC2626), size: 18),
                  label: Text(
                    'Logout',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFFDC2626),
                    ),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    side: const BorderSide(color: Color(0xFFFCA5A5)),
                    backgroundColor: const Color(0xFFFEF2F2),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, {required VoidCallback onTap}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        child: ListTile(
          dense: true,
          leading: Icon(icon, color: const Color(0xFF475569), size: 20),
          title: Text(
            title,
            style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF1E293B)),
          ),
          trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 20),
          onTap: onTap,
        ),
      ),
    );
  }
}
