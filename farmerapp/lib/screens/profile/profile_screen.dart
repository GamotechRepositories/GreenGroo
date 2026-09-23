import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/farmer_constants.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../auth/login_screen.dart';
import '../main_shell.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  void _changeProfilePhoto(BuildContext context, FarmerProfile profile) {
    showAppPhotoPicker(
      context,
      title: 'Farmer Profile Photo (प्रोफाईल फोटो)',
      subtitle: 'लाईव्ह कॅमेऱ्याने फोटो काढा किंवा गॅलरी मधून निवडा',
      onPhotoSelected: (photoStr) {
        final updated = FarmerProfile(
          id: profile.id,
          fullName: profile.fullName,
          mobile: profile.mobile,
          email: profile.email,
          preferredLanguage: profile.preferredLanguage,
          farmName: profile.farmName,
          totalAcres: profile.totalAcres,
          soilType: profile.soilType,
          irrigationType: profile.irrigationType,
          waterSource: profile.waterSource,
          farmingMethod: profile.farmingMethod,
          village: profile.village,
          taluka: profile.taluka,
          district: profile.district,
          state: profile.state,
          pincode: profile.pincode,
          kycStatus: profile.kycStatus,
          profilePhoto: photoStr,
          farmPhoto: profile.farmPhoto,
        );
        FarmerState().updateProfile(updated);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('प्रोफाईल फोटो अपडेट झाला! (Profile photo updated)'),
            backgroundColor: AppColors.primary,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final profile = FarmerState().profile;
        final hasAvatar = profile.profilePhoto.isNotEmpty;

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu, color: AppColors.primary),
              tooltip: 'मेनू उघडा (Menu)',
              onPressed: () => MainShell.openDrawer(context),
            ),
            title: const Text('Farmer & Farm Profile (प्रोफाईल)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Farmer Avatar Card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      InkWell(
                        onTap: () => _changeProfilePhoto(context, profile),
                        child: Stack(
                          children: [
                            Container(
                              width: 58,
                              height: 58,
                              decoration: const BoxDecoration(
                                color: AppColors.primaryLight,
                                shape: BoxShape.circle,
                              ),
                              clipBehavior: Clip.antiAlias,
                              child: hasAvatar
                                  ? AppImageWidget(
                                      imageStr: profile.profilePhoto,
                                      width: 58,
                                      height: 58,
                                      fit: BoxFit.cover,
                                    )
                                  : Center(
                                      child: Text(
                                        profile.fullName.isNotEmpty ? profile.fullName.split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase() : 'F',
                                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
                                      ),
                                    ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.camera_alt, size: 12, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              profile.fullName,
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                            ),
                            const SizedBox(height: 2),
                            Text('+91 ${profile.mobile}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.successLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'KYC Verified (प्रमाणित) ✓',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.success),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Farm Profile Details Card
                _SectionCard(
                  title: 'Farm Profile (शेतीचा तपशील)',
                  icon: Icons.agriculture,
                  children: [
                    _InfoTile(label: 'Farm Name (शेताचे नाव)', value: profile.farmName),
                    _InfoTile(label: 'Total Land (एकूण क्षेत्र)', value: '${profile.totalAcres} Acres'),
                    _InfoTile(label: 'Soil Type (मातीचा प्रकार)', value: profile.soilType),
                    _InfoTile(label: 'Irrigation (सिंचन पद्धत)', value: profile.irrigationType),
                    _InfoTile(label: 'Water Source (पाणी स्त्रोत)', value: profile.waterSource),
                    _InfoTile(label: 'Farming Method (शेती पद्धत)', value: profile.farmingMethod),
                  ],
                ),
                const SizedBox(height: 16),

                // Farm Location Card
                _SectionCard(
                  title: 'Farm Location (पत्ता व स्थान)',
                  icon: Icons.location_on_outlined,
                  children: [
                    _InfoTile(label: 'Village (गाव)', value: profile.village),
                    _InfoTile(label: 'Taluka (तालुका)', value: profile.taluka),
                    _InfoTile(label: 'District (जिल्हा)', value: profile.district),
                    _InfoTile(label: 'State (राज्य)', value: profile.state),
                    _InfoTile(label: 'Pincode (पिनकोड)', value: profile.pincode),
                  ],
                ),
                const SizedBox(height: 16),

                // Language & Preferences
                _SectionCard(
                  title: 'Preferences (भाषा व प्राधान्ये)',
                  icon: Icons.translate,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('निवडलेली भाषा (Language)', style: TextStyle(fontSize: 13, color: AppColors.muted)),
                          DropdownButton<String>(
                            value: FarmerConstants.preferredLanguages.contains(profile.preferredLanguage)
                                ? profile.preferredLanguage
                                : FarmerConstants.preferredLanguages.first,
                            underline: const SizedBox(),
                            items: FarmerConstants.preferredLanguages.map((l) {
                              return DropdownMenuItem(value: l, child: Text(l, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)));
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                final updated = FarmerProfile(
                                  id: profile.id,
                                  fullName: profile.fullName,
                                  mobile: profile.mobile,
                                  farmName: profile.farmName,
                                  totalAcres: profile.totalAcres,
                                  preferredLanguage: val,
                                );
                                FarmerState().updateProfile(updated);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('भाषा बदलून $val केली!')),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Support & Logout
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('Sign Out (लॉग आउट करा)', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () => _confirmLogout(context),
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('लॉग आउट (Sign Out)'),
          content: const Text('तुम्हाला नक्की GreenGroo Farmer App वरून लॉग आउट करायचे आहे का?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('रद्द करा (Cancel)'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(context);
                FarmerState().logout();
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              },
              child: const Text('लॉग आउट करा'),
            ),
          ],
        );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
              ),
            ],
          ),
          const Divider(height: 18),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final String label;
  final String value;

  const _InfoTile({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppColors.muted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.text)),
        ],
      ),
    );
  }
}
