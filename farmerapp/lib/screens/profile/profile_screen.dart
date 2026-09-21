import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Farmer Profile & KYC'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Profile Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.primaryLight,
                    child: Icon(Icons.person, size: 36, color: AppColors.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'Ramesh Shinde',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                        ),
                        SizedBox(height: 2),
                        Text(
                          '+91 98220 12345',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'ID: GGC-FRM-0082',
                          style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Farm Details
            _SectionTile(
              icon: Icons.landscape_outlined,
              title: 'Farm Profile & Land Records',
              subtitle: '4.5 Acres • Gut No. 142/2, Pune',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _SectionTile(
              icon: Icons.verified_user_outlined,
              title: 'KYC & Document Verification',
              subtitle: 'Aadhaar, 7/12 Utara, Bank Passbook',
              badge: 'Approved',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _SectionTile(
              icon: Icons.account_balance_wallet_outlined,
              title: 'Bank Account & Settlement',
              subtitle: 'HDFC Bank • A/C ending 4402',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _SectionTile(
              icon: Icons.policy_outlined,
              title: 'Government Schemes & Subsidies',
              subtitle: 'PM-KISAN, Drip Irrigation Subsidies',
              onTap: () {},
            ),
            const SizedBox(height: 8),
            _SectionTile(
              icon: Icons.help_outline,
              title: 'Support & Farmer Manager',
              subtitle: 'Manager: Nitin Patil (+91 99231 00812)',
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? badge;
  final VoidCallback onTap;

  const _SectionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.badge,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.border),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        trailing: badge != null
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  badge!,
                  style: const TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.bold),
                ),
              )
            : const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        onTap: onTap,
      ),
    );
  }
}
