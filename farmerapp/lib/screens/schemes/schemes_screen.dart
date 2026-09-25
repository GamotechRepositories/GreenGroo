import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';

Future<void> _openGovtPortal(BuildContext context, String? urlString) async {
  final target = (urlString != null && urlString.trim().isNotEmpty)
      ? urlString.trim()
      : 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin';

  final uri = Uri.parse(target.startsWith('http') ? target : 'https://$target');
  try {
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('पोर्टल उघडता आले नाही: $target')),
      );
    }
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('त्रुटी: $e')),
      );
    }
  }
}

class SchemesScreen extends StatefulWidget {
  const SchemesScreen({super.key});

  @override
  State<SchemesScreen> createState() => _SchemesScreenState();
}

class _SchemesScreenState extends State<SchemesScreen> {
  String _selectedCategory = 'All Schemes';
  String _selectedStatus = 'All Status';
  String _searchQuery = '';

  final List<String> _defaultCategories = [
    'All Schemes',
    'Financial Benefit',
    'Irrigation & Drip',
    'Solar & Energy',
    'Crop Insurance',
    'Machinery & Equipment',
    'Dairy & Livestock',
  ];

  final List<String> _statuses = [
    'All Status',
    'Active (अर्जासाठी खुले)',
    'Closing Soon (अंतिम तारीख जवळ)',
    'Upcoming (लवकरच सुरू)',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FarmerState().fetchFromBackend();
    });
  }

  List<String> _getAvailableCategories(List<GovtScheme> schemes) {
    final catSet = <String>{'All Schemes'};
    for (final c in _defaultCategories) {
      if (c != 'All Schemes') catSet.add(c);
    }
    for (final s in schemes) {
      if (s.category.isNotEmpty) catSet.add(s.category);
    }
    return catSet.toList();
  }

  List<GovtScheme> _filterSchemes(List<GovtScheme> allSchemes) {
    return allSchemes.where((s) {
      final matchesCat = _selectedCategory == 'All Schemes' || s.category == _selectedCategory;

      bool matchesStat = _selectedStatus == 'All Status';
      if (!matchesStat) {
        if (_selectedStatus.contains('Active') && (s.statusBadge == 'active' || s.status.toLowerCase().contains('active'))) {
          matchesStat = true;
        } else if (_selectedStatus.contains('Closing') && (s.statusBadge == 'closing_soon' || s.status.toLowerCase().contains('closing'))) {
          matchesStat = true;
        } else if (_selectedStatus.contains('Upcoming') && (s.statusBadge == 'upcoming' || s.status.toLowerCase().contains('upcoming'))) {
          matchesStat = true;
        } else if (s.status == _selectedStatus) {
          matchesStat = true;
        }
      }

      final matchesSearch = _searchQuery.isEmpty ||
          s.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.shortName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          s.category.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCat && matchesStat && matchesSearch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final state = FarmerState();
        final allSchemes = state.schemes;
        final schemes = _filterSchemes(allSchemes);
        final loading = state.isLoadingFromBackend && allSchemes.isEmpty;
        final categories = _getAvailableCategories(allSchemes);

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
          body: RefreshIndicator(
            onRefresh: () => FarmerState().fetchFromBackend(),
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFC8E6C9), width: 1.2),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2E7D32),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.account_balance, color: Colors.white, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: const [
                              Text(
                                'MahaDBT शेतकरी योजना पोर्टल',
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1B5E20),
                                  letterSpacing: -0.2,
                                ),
                              ),
                              SizedBox(height: 3),
                              Text(
                                'शासकीय अनुदानाचा थेट लाभ बँक खात्यात मिळवा.',
                                style: TextStyle(
                                  fontSize: 10.5,
                                  color: Color(0xFF388E3C),
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2E7D32),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onPressed: () => _openGovtPortal(context, 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin'),
                          child: const Text(
                            'Open Portal',
                            style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Search scheme (उदा. ठिबक, कुसुम, पीक विमा)...',
                      hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
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
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: categories.map((cat) {
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Available Schemes (${schemes.length})',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                      ),
                      if (state.isLoadingFromBackend)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (loading)
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
                          SizedBox(
                            width: 28,
                            height: 28,
                            child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primary),
                          ),
                          SizedBox(height: 12),
                          Text('Loading government schemes…', style: TextStyle(fontSize: 12, color: AppColors.muted)),
                        ],
                      ),
                    )
                  else if (schemes.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            allSchemes.isEmpty ? Icons.account_balance_wallet_outlined : Icons.search_off,
                            size: 44,
                            color: AppColors.muted,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            allSchemes.isEmpty ? 'सध्या कोणतीही योजना उपलब्ध नाही' : 'कोणतीही योजना सापडली नाही',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            allSchemes.isEmpty
                                ? 'Admin ने जोडलेल्या शासकीय योजना येथे दिसतील.'
                                : 'कृपया वेगळा शब्द किंवा कॅटेगरी निवडा',
                            style: const TextStyle(fontSize: 12, color: AppColors.muted),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: schemes.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final scheme = schemes[index];
                        return _SchemeCard(scheme: scheme);
                      },
                    ),
                ],
              ),
            ),
          ),
        );
      },
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
    } else if (scheme.statusBadge == 'closing_soon') {
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
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (scheme.image.isNotEmpty)
            SizedBox(
              height: 130,
              width: double.infinity,
              child: AppImageWidget(
                imageStr: scheme.image,
                fit: BoxFit.cover,
                width: double.infinity,
                height: 130,
              ),
            ),
          Padding(
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
                    const SizedBox(width: 8),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (scheme.govtLevel.isNotEmpty)
                          Container(
                            margin: const EdgeInsets.only(right: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.blue.shade200),
                            ),
                            child: Text(
                              scheme.govtLevel,
                              style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
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
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  scheme.title,
                  style: const TextStyle(fontSize: 12, color: AppColors.muted, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 10),
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
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
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
        ],
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
            initialChildSize: 0.8,
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
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                scheme.shortName,
                                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                              ),
                              Text(
                                scheme.title,
                                style: const TextStyle(fontSize: 11.5, color: AppColors.muted),
                              ),
                            ],
                          ),
                        ),
                        IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                      ],
                    ),
                    const Divider(),
                    if (scheme.image.isNotEmpty) ...[
                      ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: SizedBox(
                          height: 150,
                          width: double.infinity,
                          child: AppImageWidget(
                            imageStr: scheme.image,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: 150,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'वर्ग: ${scheme.category}',
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (scheme.govtLevel.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade50,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'स्तर: ${scheme.govtLevel}',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    const Text('योजनेचे स्वरूप (Overview)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(scheme.description, style: const TextStyle(fontSize: 13, color: AppColors.text)),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.currency_rupee, color: AppColors.primary, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'अनुदान / लाभ: ${scheme.subsidyPercent} (${scheme.maxAmount})',
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('पात्रता निकष (Eligibility Criteria)', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    if (scheme.eligibility.isEmpty)
                      const Text('Eligibility details not provided yet.', style: TextStyle(fontSize: 12, color: AppColors.muted))
                    else
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
                    if (scheme.documents.isEmpty)
                      const Text('Required documents not listed yet.', style: TextStyle(fontSize: 12, color: AppColors.muted))
                    else
                      ...scheme.documents.map((d) => Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                const Icon(Icons.description_outlined, size: 16, color: AppColors.muted),
                                const SizedBox(width: 8),
                                Expanded(child: Text(d, style: const TextStyle(fontSize: 12))),
                              ],
                            ),
                          )),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E7D32),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        icon: const Icon(Icons.open_in_new, size: 18),
                        label: const Text(
                          'Apply on Govt Portal (शासकीय पोर्टलवर अर्ज करा)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                        ),
                        onPressed: () {
                          _openGovtPortal(context, scheme.portalUrl);
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
