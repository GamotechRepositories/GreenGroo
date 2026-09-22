import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';

class SchemesScreen extends StatefulWidget {
  const SchemesScreen({super.key});

  @override
  State<SchemesScreen> createState() => _SchemesScreenState();
}

class _SchemesScreenState extends State<SchemesScreen> {
  String _selectedCategory = 'All Schemes';
  String _selectedStatus = 'All Status';
  String _searchQuery = '';

  final List<String> _categories = [
    'All Schemes',
    'Financial Benefit',
    'Irrigation & Drip',
    'Solar & Energy',
    'Crop Insurance',
    'Machinery & Equipment',
  ];

  final List<String> _statuses = [
    'All Status',
    'Active (अर्जासाठी खुले)',
    'Closing Soon (अंतिम तारीख जवळ)',
    'Upcoming (लवकरच सुरू)',
  ];

  @override
  Widget build(BuildContext context) {
    final schemes = FarmerState().schemes.where((s) {
      final matchesCat = _selectedCategory == 'All Schemes' || s.category == _selectedCategory;
      final matchesStat = _selectedStatus == 'All Status' || s.status.contains(_selectedStatus.split(' ')[0]);
      final matchesSearch = _searchQuery.isEmpty ||
          s.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.shortName.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesStat && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Govt Schemes (शासकीय योजना)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('MahaDBT & Central Agriculture Schemes', style: TextStyle(fontSize: 11, color: AppColors.muted)),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // MahaDBT Official Portal Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.account_balance, color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          'MahaDBT शेतकरी योजना पोर्टल',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'शासकीय अनुदानाचा थेट लाभ बँक खात्यात मिळवा.',
                          style: TextStyle(fontSize: 11, color: AppColors.text),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Opening MahaDBT Portal (mahadbt.maharashtra.gov.in)...')),
                      );
                    },
                    child: const Text('Open Portal', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Search Bar
            TextField(
              decoration: InputDecoration(
                hintText: 'Search scheme (उदा. ठिबक, कुसुम, पीक विमा)...',
                prefixIcon: const Icon(Icons.search, color: AppColors.muted),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
              onChanged: (val) => setState(() => _searchQuery = val),
            ),
            const SizedBox(height: 12),

            // Category Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat, style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppColors.text)),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      backgroundColor: Colors.white,
                      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedCategory = cat);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 8),

            // Status Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _statuses.map((st) {
                  final isSelected = _selectedStatus == st;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(st, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppColors.muted)),
                      selected: isSelected,
                      selectedColor: AppColors.primary,
                      backgroundColor: Colors.white,
                      side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
                      onSelected: (selected) {
                        if (selected) setState(() => _selectedStatus = st);
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),

            // Schemes List
            Text(
              'Available Schemes (${schemes.length})',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
            ),
            const SizedBox(height: 10),

            if (schemes.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: const [
                    Icon(Icons.search_off, size: 40, color: AppColors.muted),
                    SizedBox(height: 8),
                    Text('कोणतीही योजना सापडली नाही', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.text)),
                    Text('कृपया वेगळा शब्द किंवा कॅटेगरी निवडा', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                  ],
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: schemes.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final scheme = schemes[index];
                  return _SchemeCard(scheme: scheme);
                },
              ),
          ],
        ),
      ),
    );
  }
}

class _SchemeCard extends StatelessWidget {
  final GovtScheme scheme;
  const _SchemeCard({required this.scheme});

  @override
  Widget build(BuildContext context) {
    Color badgeColor;
    Color badgeText;
    if (scheme.statusBadge == 'active') {
      badgeColor = AppColors.successLight;
      badgeText = AppColors.success;
    } else if (scheme.statusBadge == 'closing') {
      badgeColor = AppColors.warningLight;
      badgeText = AppColors.warning;
    } else {
      badgeColor = AppColors.infoLight;
      badgeText = AppColors.info;
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Text(
                    scheme.shortName,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    scheme.status,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeText),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              scheme.title,
              style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 12),

            // Subsidy & Benefits Box
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.monetization_on_outlined, size: 18, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'अनुदान: ${scheme.subsidyPercent} • ${scheme.maxAmount}',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            Text(
              scheme.description,
              style: const TextStyle(fontSize: 12, color: AppColors.text),
            ),
            const SizedBox(height: 12),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.event, size: 14, color: AppColors.muted),
                    const SizedBox(width: 4),
                    Text('अंतिम मुदत: ${scheme.deadline}', style: const TextStyle(fontSize: 11, color: AppColors.muted)),
                  ],
                ),
                TextButton.icon(
                  style: TextButton.styleFrom(padding: EdgeInsets.zero),
                  onPressed: () => _showSchemeDetails(context, scheme),
                  icon: const Icon(Icons.info_outline, size: 16, color: AppColors.primary),
                  label: const Text('तपशील व कागदपत्रे', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showSchemeDetails(BuildContext context, GovtScheme scheme) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return SafeArea(
          top: false,
          child: DraggableScrollableSheet(
          initialChildSize: 0.75,
          maxChildSize: 0.95,
          minChildSize: 0.5,
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: ListView(
                controller: scrollController,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          scheme.shortName,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                      IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                    ],
                  ),
                  const Divider(),
                  const SizedBox(height: 8),

                  const Text('योजनेचे स्वरूप (Overview)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(scheme.description, style: const TextStyle(fontSize: 13, color: AppColors.text)),
                  const SizedBox(height: 16),

                  const Text('पात्रता निकष (Eligibility Criteria)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...scheme.eligibility.map((e) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.check_circle, size: 16, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Expanded(child: Text(e, style: const TextStyle(fontSize: 12))),
                          ],
                        ),
                      )),
                  const SizedBox(height: 16),

                  const Text('आवश्यक कागदपत्रे (Required Documents)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...scheme.documents.map((d) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          children: [
                            const Icon(Icons.description_outlined, size: 16, color: AppColors.muted),
                            const SizedBox(width: 8),
                            Text(d, style: const TextStyle(fontSize: 12)),
                          ],
                        ),
                      )),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      icon: const Icon(Icons.open_in_new, size: 18),
                      label: const Text('MahaDBT वर अर्ज करा (Apply Now)', style: TextStyle(fontWeight: FontWeight.bold)),
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('MahaDBT अधिकृत संकेतस्थळाकडे पाठवत आहे...')),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );
    },
  );
  }
}
