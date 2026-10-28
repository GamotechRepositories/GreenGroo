import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../models/farmer_trace.dart';
import '../../widgets/common/app_network_image.dart';

const Color _green = Color(0xFF0A6C38);
const Color _borderGreen = Color(0xFFDDEADB);
const Color _slate900 = Color(0xFF0F172A);
const Color _slate700 = Color(0xFF334155);
const Color _slate500 = Color(0xFF64748B);

/// Farmer profile focused on the farmer and their crops (photo, about, crops, photos).
class FarmerProfileScreen extends StatefulWidget {
  const FarmerProfileScreen({super.key, this.farmer});

  final FarmerTrace? farmer;

  @override
  State<FarmerProfileScreen> createState() => _FarmerProfileScreenState();
}

class _FarmerProfileScreenState extends State<FarmerProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _shareProfile(String name, String location) {
    Share.share(
      'Meet our farmer $name from $location on GreenGrocc! Pure, farm-fresh produce sourced directly with complete traceability.\nhttps://greengrocc.com/farmer-profile',
      subject: '$name · GreenGrocc Farmer Profile',
    );
  }

  @override
  Widget build(BuildContext context) {
    final f = widget.farmer;

    final rawName = f?.name.trim() ?? '';
    final name = rawName.isNotEmpty
        ? (rawName.startsWith('श्री.') || rawName.startsWith('श्री ') ? rawName : 'श्री. $rawName')
        : 'श्री. Anand Dhumal';

    final location = f?.location.trim().isNotEmpty == true
        ? f!.location.trim()
        : 'Shirur, Pune, Maharashtra';

    final area = f != null && (f.cultivationArea.isNotEmpty || f.totalArea.isNotEmpty)
        ? (f.cultivationArea.isNotEmpty ? f.cultivationArea : f.totalArea)
        : '5 acres';

    final experience = f?.experience.trim().isNotEmpty == true
        ? f!.experience.trim()
        : '12 वर्षे शेतीचा अनुभव';

    final bio = f?.bio.trim().isNotEmpty == true
        ? f!.bio.trim()
        : 'Runs a desi cow dairy: milk is chilled to 4°C within 30 minutes of milking and bottled the same morning. Committed to sustainable, residue-tested farming in Shirur, Pune.';

    final crops = (f?.crops.isNotEmpty == true)
        ? f!.crops
        : const [
            FarmerCrop(
              name: 'Amul Gold Full Cream Milk, 500 ml Pouch',
              variety: 'Napier & lucerne fodder',
              area: '5 acres',
              status: 'ताजी आवक · उपलब्ध (In Stock)',
            ),
            FarmerCrop(
              name: 'Allahabad Safeda Guava (Peru)',
              variety: 'Allahabad Safeda',
              area: '5 acres',
              status: 'ताजी आवक · उपलब्ध (In Stock)',
            ),
          ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: _slate900,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Farmer Profile',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () => _shareProfile(name, location),
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(color: const Color(0xFFE2E8F0), height: 1),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 1. Farmer Card matching Screenshot 2
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _borderGreen),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x06000000),
                    blurRadius: 8,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Farmer Photo (Rounded square)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: SizedBox(
                      width: 96,
                      height: 104,
                      child: f?.farmerImage.isNotEmpty == true
                          ? AppNetworkImage(imageUrl: f!.farmerImage, fit: BoxFit.cover)
                          : Container(
                              color: const Color(0xFFE6F5EA),
                              child: const Icon(Icons.person_rounded, color: _green, size: 48),
                            ),
                    ),
                  ),
                  const SizedBox(width: 14),

                  // Farmer Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w900,
                                  color: _green,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.verified_rounded, size: 16, color: _green),
                          ],
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 14, color: _green),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                location,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w500,
                                  color: _slate700,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.spa_outlined, size: 14, color: _green),
                            const SizedBox(width: 4),
                            Text(
                              area,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w500,
                                color: _slate700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Sub-Tabs Container: About Farm | Crops | Photos
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: _borderGreen),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TabBar(
                    controller: _tabController,
                    indicatorColor: _green,
                    indicatorWeight: 2.5,
                    labelColor: _green,
                    unselectedLabelColor: _slate500,
                    labelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800, fontSize: 13.5),
                    unselectedLabelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, fontSize: 13.5),
                    tabs: const [
                      Tab(text: 'About Farm'),
                      Tab(text: 'Crops'),
                      Tab(text: 'Photos'),
                    ],
                  ),
                  const Divider(color: Color(0xFFF1F5F9), height: 1),

                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: AnimatedBuilder(
                      animation: _tabController,
                      builder: (context, _) {
                        if (_tabController.index == 0) {
                          return _buildAboutFarmTab(bio, area, experience);
                        } else if (_tabController.index == 1) {
                          return _buildCropsTab(crops);
                        } else {
                          return _buildPhotosTab(f);
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),
          ],
        ),
      ),
    );
  }

  Widget _buildAboutFarmTab(String bio, String area, String experience) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'About Farm',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          bio,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 12.5,
            height: 1.45,
            color: _slate700,
          ),
        ),
        const SizedBox(height: 16),

        // 3 Metric Badges matching Screenshot 2
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                icon: Icons.spa_outlined,
                value: area.replaceAll('acres', 'एकर').replaceAll('acre', 'एकर'),
                label: 'जमीन',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.agriculture_outlined,
                value: experience.contains('वर्षे') ? experience.split(' ')[0] : '12 वर्षे',
                label: 'शेतीचा अनुभव',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildMetricCard(
                icon: Icons.eco_outlined,
                value: '10+',
                label: 'पिकांचे प्रकार',
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard({required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF4FAF5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFDDEADB)),
      ),
      child: Column(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Color(0xFFE6F5EA),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, size: 18, color: _green),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              fontWeight: FontWeight.w900,
              color: _slate900,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 10.5,
              fontWeight: FontWeight.w600,
              color: _slate500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCropsTab(List<FarmerCrop> crops) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Grown Crops & Varieties',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 10),
        for (final crop in crops)
          Container(
            padding: const EdgeInsets.all(12),
            margin: const EdgeInsets.only(bottom: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F5EA),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.grass_rounded, color: _green, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        crop.name,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                          color: _slate900,
                        ),
                      ),
                      if (crop.variety.isNotEmpty)
                        Text(
                          'Variety: ${crop.variety} · ${crop.area}',
                          style: GoogleFonts.plusJakartaSans(fontSize: 11, color: _slate500),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F5EA),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'In Season',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w800,
                      color: _green,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPhotosTab(FarmerTrace? f) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Farm & Orchard Gallery',
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w800,
            color: _slate900,
          ),
        ),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 8,
          mainAxisSpacing: 8,
          childAspectRatio: 1.3,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: f?.farmImage.isNotEmpty == true
                  ? AppNetworkImage(imageUrl: f!.farmImage, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFE6F5EA),
                      child: const Icon(Icons.landscape_rounded, color: _green, size: 36),
                    ),
            ),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: f?.farmerImage.isNotEmpty == true
                  ? AppNetworkImage(imageUrl: f!.farmerImage, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFE6F5EA),
                      child: const Icon(Icons.agriculture_rounded, color: _green, size: 36),
                    ),
            ),
          ],
        ),
      ],
    );
  }
}
