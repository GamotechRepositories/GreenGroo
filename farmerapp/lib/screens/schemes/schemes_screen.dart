import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/skeleton_loader.dart';
import '../../services/farmer_state.dart';
import '../../models/farmer_models.dart';
import '../../core/utils/photo_picker_sheet.dart';
import '../main_shell.dart';
import '../../services/app_language.dart';

Future<void> _openGovtPortal(BuildContext context, String? urlString) async {
  final target = (urlString != null && urlString.trim().isNotEmpty)
      ? urlString.trim()
      : 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin';

  final uri = Uri.parse(target.startsWith('http') ? target : 'https://$target');
  try {
    final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!launched && context.mounted) {
      final lang = AppLanguage();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(
              mr: 'पोर्टल उघडता आले नाही: $target',
              en: 'Could not open portal: $target',
            ),
          ),
        ),
      );
    }
  } catch (e) {
    if (context.mounted) {
      final lang = AppLanguage();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            lang.tr(mr: 'त्रुटी: $e', en: 'Error: $e'),
          ),
        ),
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
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _selectedTab = 0; // 0 = All Schemes, 1 = My Applications
  String _selectedCategory = 'All Schemes';
  String _selectedStatus = 'All Status';
  String _appStatusFilter = 'all';
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
        if (_selectedStatus == 'active' && (s.statusBadge == 'active' || s.status.toLowerCase().contains('active'))) {
          matchesStat = true;
        } else if (_selectedStatus == 'closing_soon' && (s.statusBadge == 'closing_soon' || s.status.toLowerCase().contains('closing'))) {
          matchesStat = true;
        } else if (_selectedStatus == 'upcoming' && (s.statusBadge == 'upcoming' || s.status.toLowerCase().contains('upcoming'))) {
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

  List<GovtSchemeApplication> _filterApplications(List<GovtSchemeApplication> allApps) {
    return allApps.where((app) {
      if (_appStatusFilter != 'all') {
        if (_appStatusFilter == 'accepted' && (app.status == 'accepted' || app.status == 'approved')) {
          // match
        } else if (app.status != _appStatusFilter) {
          return false;
        }
      }
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        return app.schemeTitle.toLowerCase().contains(q) ||
            app.schemeCategory.toLowerCase().contains(q) ||
            app.adminNotes.toLowerCase().contains(q) ||
            app.notes.toLowerCase().contains(q);
      }
      return true;
    }).toList();
  }

  void _showApplyDialog(BuildContext context, GovtScheme scheme, {GovtSchemeApplication? existingApp}) {
    final lang = AppLanguage();
    final state = FarmerState();
    final profile = state.profile;
    final notesController = TextEditingController(text: existingApp?.notes ?? '');
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(modalContext).viewInsets.bottom,
              ),
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                ),
                padding: const EdgeInsets.all(20),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  lang.tr(
                                    mr: existingApp != null && existingApp.status == 'rejected'
                                        ? 'योजनेसाठी पुन्हा अर्ज करा'
                                        : 'योजनेसाठी अर्ज करा',
                                    en: existingApp != null && existingApp.status == 'rejected'
                                        ? 'Re-apply for Govt Scheme'
                                        : 'Apply for Govt Scheme',
                                  ),
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryDark,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  scheme.shortName.isNotEmpty ? scheme.shortName : scheme.title,
                                  style: const TextStyle(fontSize: 12, color: AppColors.muted),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close),
                            onPressed: () => Navigator.pop(modalContext),
                          ),
                        ],
                      ),
                      const Divider(height: 20),

                      // Scheme Benefit Highlight
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.account_balance_outlined, color: Color(0xFF16A34A), size: 24),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    lang.tr(mr: 'अनुदान / लाभ', en: 'Subsidy / Benefit'),
                                    style: const TextStyle(fontSize: 11, color: Color(0xFF166534), fontWeight: FontWeight.bold),
                                  ),
                                  Text(
                                    '${scheme.subsidyPercent} • ${scheme.maxAmount}',
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF14532D)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Farmer Applicant Details Summary
                      Text(
                        lang.tr(mr: 'शेतकऱ्याचा तपशील (Applicant Info)', en: 'Farmer Applicant Info'),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.text),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            _buildInfoRow(
                              Icons.person_outline,
                              lang.tr(mr: 'नाव', en: 'Name'),
                              profile.fullName.isNotEmpty ? profile.fullName : lang.tr(mr: 'शेतकरी', en: 'Farmer'),
                            ),
                            const SizedBox(height: 6),
                            _buildInfoRow(
                              Icons.phone_outlined,
                              lang.tr(mr: 'मोबाईल', en: 'Mobile'),
                              profile.mobile.isNotEmpty ? profile.mobile : '—',
                            ),
                            const SizedBox(height: 6),
                            _buildInfoRow(
                              Icons.location_on_outlined,
                              lang.tr(mr: 'गाव / तालुका', en: 'Village / Taluka'),
                              [profile.village, profile.taluka, profile.district].where((e) => e.isNotEmpty).join(', ').isNotEmpty
                                  ? [profile.village, profile.taluka, profile.district].where((e) => e.isNotEmpty).join(', ')
                                  : '—',
                            ),
                            const SizedBox(height: 6),
                            _buildInfoRow(
                              Icons.landscape_outlined,
                              lang.tr(mr: 'एकूण शेतजमीन', en: 'Farm Land'),
                              '${profile.totalAcres} ${profile.totalFarmAreaUnit}',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Optional Remarks / Notes
                      Text(
                        lang.tr(mr: 'काही विशेष नोंद किंवा शेरा (पर्यायी)', en: 'Notes / Remarks (Optional)'),
                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: AppColors.text),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: notesController,
                        maxLines: 2,
                        decoration: InputDecoration(
                          hintText: lang.tr(
                            mr: 'उदा. ठिबक सिंचनासाठी 2 एकर क्षेत्र उपलब्ध आहे...',
                            en: 'e.g. 2 acres land available for drip irrigation...',
                          ),
                          hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
                          filled: true,
                          fillColor: AppColors.background,
                          contentPadding: const EdgeInsets.all(12),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),

                      // Submit Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF15803D),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  setModalState(() => isSubmitting = true);
                                  final success = await state.applyForScheme(
                                    schemeId: scheme.id,
                                    schemeTitle: scheme.title,
                                    notes: notesController.text.trim(),
                                  );
                                  if (!modalContext.mounted) return;
                                  Navigator.pop(modalContext);

                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: success ? const Color(0xFF15803D) : Colors.red.shade700,
                                      content: Text(
                                        success
                                            ? lang.tr(
                                                mr: '✅ अर्ज यशस्वीरित्या सादर करण्यात आला आहे!',
                                                en: '✅ Application submitted successfully!',
                                              )
                                            : lang.tr(
                                                mr: 'अर्ज सादर करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
                                                en: 'Failed to submit application. Please try again.',
                                              ),
                                      ),
                                    ),
                                  );
                                  if (success) {
                                    setState(() {
                                      _selectedTab = 1; // switch to My Applications tab
                                    });
                                  }
                                },
                          child: isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : Text(
                                  lang.tr(mr: 'अर्ज जमा करा (Submit Application)', en: 'Submit Application'),
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 15, color: AppColors.muted),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.text),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: FarmerState(),
      builder: (context, _) {
        final state = FarmerState();
        final lang = AppLanguage();
        final loading = !state.isPreferencesLoaded || (state.isLoadingFromBackend && !state.schemesReady);
        if (loading) {
          return const SchemesSkeletonLoader();
        }

        final allSchemes = state.schemes;
        final schemes = _filterSchemes(allSchemes);
        final myApps = _filterApplications(state.schemeApplications);
        final categories = _getAvailableCategories(allSchemes);

        return Scaffold(
          key: _scaffoldKey,
          drawer: const FarmerSidebarDrawer(),
          backgroundColor: AppColors.background,
          appBar: AppBar(
            leading: IconButton(
              icon: const Icon(Icons.menu_rounded, color: AppColors.primaryDark),
              tooltip: lang.tr(mr: 'मेनू उघडा', en: 'Open Menu'),
              onPressed: () {
                if (_scaffoldKey.currentState != null) {
                  _scaffoldKey.currentState!.openDrawer();
                } else {
                  MainShell.openDrawer(context);
                }
              },
            ),
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  lang.tr(mr: 'शासकीय योजना', en: 'Govt Schemes'),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                Text(
                  lang.tr(mr: 'MahaDBT आणि केंद्र कृषी योजना', en: 'MahaDBT & Agriculture Schemes'),
                  style: const TextStyle(fontSize: 11, color: AppColors.muted),
                ),
              ],
            ),
          ),
          body: RefreshIndicator(
            onRefresh: () => FarmerState().fetchFromBackend(),
            color: AppColors.primary,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 🌟 TOP HERO BANNER WITH GOVT SCHEMES BACKGROUND
                  Container(
                    width: double.infinity,
                    height: 136,
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.asset(
                            'assets/images/govt_schemes_banner_bg.png',
                            fit: BoxFit.cover,
                            alignment: Alignment.center,
                            errorBuilder: (context, error, stackTrace) => Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF166534), Color(0xFF15803D)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                              ),
                            ),
                          ),
                          Positioned.fill(
                            child: DecoratedBox(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                  stops: const [0.0, 0.58, 1.0],
                                  colors: [
                                    Colors.black.withValues(alpha: 0.74),
                                    Colors.black.withValues(alpha: 0.40),
                                    Colors.transparent,
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF16A34A),
                                              borderRadius: BorderRadius.circular(12),
                                            ),
                                            child: Text(
                                              lang.tr(mr: '🏛️ शासकीय योजना', en: '🏛️ Govt Schemes'),
                                              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            lang.tr(
                                              mr: '${allSchemes.length} योजना उपलब्ध',
                                              en: '${allSchemes.length} Schemes Available',
                                            ),
                                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.white),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        lang.tr(mr: 'शासकीय योजना व अनुदान', en: 'Govt Schemes & Subsidies'),
                                        style: const TextStyle(
                                          fontSize: 17,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                          letterSpacing: -0.3,
                                        ),
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        lang.tr(
                                          mr: 'MahaDBT आणि केंद्र शासनाच्या थेट योजनांचा लाभ घ्या!',
                                          en: 'Access MahaDBT and Central government direct benefits!',
                                        ),
                                        style: const TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w500,
                                          color: Color(0xFFE2E8F0),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF2E7D32),
                                    foregroundColor: Colors.white,
                                    elevation: 2,
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  icon: const Icon(Icons.open_in_new, size: 14),
                                  label: const Text(
                                    'MahaDBT',
                                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                  onPressed: () => _openGovtPortal(context, 'https://mahadbt.maharashtra.gov.in/Farmer/AgriLogin/AgriLogin'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Segment Tabs: [ All Schemes ] | [ My Applications ]
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _selectedTab = 0),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              decoration: BoxDecoration(
                                color: _selectedTab == 0 ? AppColors.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.account_balance_outlined,
                                    size: 16,
                                    color: _selectedTab == 0 ? Colors.white : AppColors.muted,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    lang.tr(mr: 'सर्व योजना', en: 'All Schemes'),
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.bold,
                                      color: _selectedTab == 0 ? Colors.white : AppColors.text,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _selectedTab = 1),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 9),
                              decoration: BoxDecoration(
                                color: _selectedTab == 1 ? AppColors.primary : Colors.transparent,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.assignment_outlined,
                                    size: 16,
                                    color: _selectedTab == 1 ? Colors.white : AppColors.muted,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    lang.tr(mr: 'माझे अर्ज', en: 'My Applications'),
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.bold,
                                      color: _selectedTab == 1 ? Colors.white : AppColors.text,
                                    ),
                                  ),
                                  if (state.schemeApplications.isNotEmpty) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                      decoration: BoxDecoration(
                                        color: _selectedTab == 1 ? Colors.white.withValues(alpha: 0.25) : AppColors.primaryLight,
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Text(
                                        '${state.schemeApplications.length}',
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.w800,
                                          color: _selectedTab == 1 ? Colors.white : AppColors.primary,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Search input
                  TextField(
                    decoration: InputDecoration(
                      hintText: lang.tr(
                        mr: 'योजना शोधा (उदा. ठिबक, कुसुम, पीक विमा)...',
                        en: 'Search schemes (e.g. Drip, Solar, Crop Insurance)...',
                      ),
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

                  // =================== TAB 0: ALL SCHEMES ===================
                  if (_selectedTab == 0) ...[
                    // Category Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: categories.map((cat) {
                          final isSelected = _selectedCategory == cat;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(
                                cat == 'All Schemes' ? lang.tr(mr: 'सर्व योजना', en: 'All Schemes') : cat,
                                style: TextStyle(fontSize: 12, color: isSelected ? Colors.white : AppColors.text),
                              ),
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

                    // Status Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildStatusChip('All Status', lang.tr(mr: 'सर्व स्थिती', en: 'All Status')),
                          _buildStatusChip('active', lang.tr(mr: 'अर्जासाठी खुले (Active)', en: 'Active')),
                          _buildStatusChip('closing_soon', lang.tr(mr: 'अंतिम तारीख जवळ (Closing Soon)', en: 'Closing Soon')),
                          _buildStatusChip('upcoming', lang.tr(mr: 'लवकरच सुरू (Upcoming)', en: 'Upcoming')),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          lang.tr(
                            mr: 'उपलब्ध योजना (${schemes.length})',
                            en: 'Available Schemes (${schemes.length})',
                          ),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                        ),
                        if (!state.schemesReady || state.isLoadingFromBackend)
                          const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                          ),
                      ],
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
                          children: [
                            Icon(
                              allSchemes.isEmpty ? Icons.account_balance_wallet_outlined : Icons.search_off,
                              size: 44,
                              color: AppColors.muted,
                            ),
                            const SizedBox(height: 10),
                            Text(
                              allSchemes.isEmpty
                                  ? lang.tr(mr: 'सध्या कोणतीही योजना उपलब्ध नाही', en: 'No schemes currently available')
                                  : lang.tr(mr: 'कोणतीही योजना सापडली नाही', en: 'No matching scheme found'),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              allSchemes.isEmpty
                                  ? lang.tr(mr: 'नवीन शासकीय योजना जोडल्यावर येथे दिसतील.', en: 'Newly added schemes will appear here.')
                                  : lang.tr(mr: 'कृपया वेगळा शब्द किंवा कॅटेगरी निवडा', en: 'Please try another filter or search keyword'),
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
                          final app = state.getApplicationForScheme(scheme.id);
                          return _SchemeCard(
                            scheme: scheme,
                            application: app,
                            onApply: () => _showApplyDialog(context, scheme, existingApp: app),
                          );
                        },
                      ),
                  ]

                  // =================== TAB 1: MY APPLICATIONS ===================
                  else ...[
                    // Application status filter chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _buildAppStatusChip('all', lang.tr(mr: 'सर्व अर्ज', en: 'All Applications')),
                          _buildAppStatusChip('pending', lang.tr(mr: '⏳ प्रलंबित (Pending)', en: '⏳ Pending')),
                          _buildAppStatusChip('accepted', lang.tr(mr: '✓ मंजूर (Accepted)', en: '✓ Accepted')),
                          _buildAppStatusChip('rejected', lang.tr(mr: '❌ अमान्य (Rejected)', en: '❌ Rejected')),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          lang.tr(
                            mr: 'माझे सादर केलेले अर्ज (${myApps.length})',
                            en: 'My Submitted Applications (${myApps.length})',
                          ),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.text),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (myApps.isEmpty)
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
                            const Icon(Icons.assignment_late_outlined, size: 44, color: AppColors.muted),
                            const SizedBox(height: 10),
                            Text(
                              state.schemeApplications.isEmpty
                                  ? lang.tr(mr: 'तुम्ही अजून कोणत्याही योजनेसाठी अर्ज केलेला नाही', en: 'You haven\'t applied for any scheme yet')
                                  : lang.tr(mr: 'या स्थितीमध्ये कोणतेही अर्ज नाहीत', en: 'No applications found in this status'),
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.text),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              lang.tr(
                                mr: 'शासकीय योजना टॅबमधून योजनेचा तपशील पाहून थेट अर्ज करा.',
                                en: 'Browse schemes and apply directly from the All Schemes tab.',
                              ),
                              style: const TextStyle(fontSize: 12, color: AppColors.muted),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 14),
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: const Icon(Icons.search, size: 16),
                              label: Text(
                                lang.tr(mr: 'योजना पहा व अर्ज करा', en: 'Browse Schemes'),
                                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                              ),
                              onPressed: () => setState(() => _selectedTab = 0),
                            ),
                          ],
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: myApps.length,
                        separatorBuilder: (context, index) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final app = myApps[index];
                          final matchingScheme = allSchemes.firstWhere(
                            (s) => s.id == app.schemeId,
                            orElse: () => GovtScheme(
                              id: app.schemeId,
                              title: app.schemeTitle,
                              shortName: app.schemeTitle,
                              category: app.schemeCategory,
                              status: 'active',
                              statusBadge: 'active',
                              subsidyPercent: app.subsidyAmount,
                              maxAmount: '',
                              description: '',
                              deadline: '',
                            ),
                          );

                          return _ApplicationCard(
                            application: app,
                            scheme: matchingScheme,
                            onReapply: () => _showApplyDialog(context, matchingScheme, existingApp: app),
                          );
                        },
                      ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(String key, String label) {
    final isSelected = _selectedStatus == key;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11, color: isSelected ? Colors.white : AppColors.muted)),
        selected: isSelected,
        selectedColor: AppColors.primary,
        backgroundColor: Colors.white,
        side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
        onSelected: (selected) {
          if (selected) setState(() => _selectedStatus = key);
        },
      ),
    );
  }

  Widget _buildAppStatusChip(String key, String label) {
    final isSelected = _appStatusFilter == key;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label, style: TextStyle(fontSize: 11.5, color: isSelected ? Colors.white : AppColors.text)),
        selected: isSelected,
        selectedColor: AppColors.primary,
        backgroundColor: Colors.white,
        side: BorderSide(color: isSelected ? AppColors.primary : AppColors.border),
        onSelected: (selected) {
          if (selected) setState(() => _appStatusFilter = key);
        },
      ),
    );
  }
}

class _SchemeCard extends StatelessWidget {
  final GovtScheme scheme;
  final GovtSchemeApplication? application;
  final VoidCallback onApply;

  const _SchemeCard({
    required this.scheme,
    this.application,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    final lang = AppLanguage();

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
            padding: const EdgeInsets.all(14),
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
                const SizedBox(height: 8),

                // Application Status Banner if already applied
                if (application != null) ...[
                  _buildAppliedBadge(context, application!),
                  const SizedBox(height: 8),
                ],

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
                          '${lang.tr(mr: 'अनुदान', en: 'Subsidy')}: ${scheme.subsidyPercent} • ${scheme.maxAmount}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  scheme.description,
                  style: const TextStyle(fontSize: 12, color: AppColors.text),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 10),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.event, size: 14, color: AppColors.muted),
                        const SizedBox(width: 4),
                        Text(
                          '${lang.tr(mr: 'अंतिम मुदत', en: 'Deadline')}: ${scheme.deadline}',
                          style: const TextStyle(fontSize: 11, color: AppColors.muted),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        TextButton.icon(
                          style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4)),
                          onPressed: () => _showSchemeDetails(context, scheme),
                          icon: const Icon(Icons.info_outline, size: 15, color: AppColors.primary),
                          label: Text(
                            lang.tr(mr: 'तपशील', en: 'Details'),
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppColors.primary),
                          ),
                        ),
                        const SizedBox(width: 4),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: application == null || application!.status == 'rejected'
                                ? const Color(0xFF15803D)
                                : Colors.grey.shade600,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: const Size(60, 32),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            elevation: 0,
                          ),
                          onPressed: () {
                            if (application != null && (application!.status == 'pending' || application!.status == 'accepted' || application!.status == 'approved')) {
                              _showStatusInfo(context, application!);
                            } else {
                              onApply();
                            }
                          },
                          child: Text(
                            application == null
                                ? lang.tr(mr: 'अर्ज करा', en: 'Apply')
                                : application!.status == 'rejected'
                                    ? lang.tr(mr: 'पुन्हा अर्ज', en: 'Re-apply')
                                    : lang.tr(mr: 'स्थिती पहा', en: 'View Status'),
                            style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
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

  Widget _buildAppliedBadge(BuildContext context, GovtSchemeApplication app) {
    final lang = AppLanguage();
    Color bg;
    Color border;
    Color textColor;
    IconData icon;
    String statusText;

    if (app.status == 'accepted' || app.status == 'approved') {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFF86EFAC);
      textColor = const Color(0xFF166534);
      icon = Icons.check_circle;
      statusText = lang.tr(mr: 'अर्ज मंजूर (Accepted ✓)', en: 'Application Accepted ✓');
    } else if (app.status == 'rejected') {
      bg = const Color(0xFFFEF2F2);
      border = const Color(0xFFFCA5A5);
      textColor = const Color(0xFF991B1B);
      icon = Icons.cancel;
      statusText = lang.tr(mr: 'अर्ज अमान्य (Rejected ❌)', en: 'Application Rejected ❌');
    } else {
      bg = const Color(0xFFFFFBEB);
      border = const Color(0xFFFDE68A);
      textColor = const Color(0xFF92400E);
      icon = Icons.hourglass_top_rounded;
      statusText = lang.tr(mr: 'अर्ज प्रलंबित (Pending ⏳)', en: 'Application Pending ⏳');
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: textColor),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              statusText,
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: textColor),
            ),
          ),
          if (app.adminNotes.isNotEmpty)
            InkWell(
              onTap: () => _showStatusInfo(context, app),
              child: const Icon(Icons.info_outline, size: 15, color: AppColors.muted),
            ),
        ],
      ),
    );
  }

  void _showStatusInfo(BuildContext context, GovtSchemeApplication app) {
    final lang = AppLanguage();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          lang.tr(mr: 'अर्जाची स्थिती', en: 'Application Status'),
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              app.schemeTitle,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            Text(
              '${lang.tr(mr: 'स्थिती', en: 'Status')}: ${app.status.toUpperCase()}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            if (app.adminNotes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                lang.tr(mr: 'प्रशासकीय शेरा / कारण:', en: 'Admin Note / Reason:'),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.muted),
              ),
              const SizedBox(height: 2),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(app.adminNotes, style: const TextStyle(fontSize: 12)),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(lang.tr(mr: 'बंद करा', en: 'Close')),
          ),
        ],
      ),
    );
  }

  void _showSchemeDetails(BuildContext context, GovtScheme scheme) {
    final lang = AppLanguage();
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
                            '${lang.tr(mr: 'वर्ग', en: 'Category')}: ${scheme.category}',
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
                              '${lang.tr(mr: 'स्तर', en: 'Level')}: ${scheme.govtLevel}',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.blue.shade700),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Text(
                      lang.tr(mr: 'योजनेचे स्वरूप (Overview)', en: 'Scheme Overview'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
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
                              '${lang.tr(mr: 'अनुदान / लाभ', en: 'Subsidy / Benefit')}: ${scheme.subsidyPercent} (${scheme.maxAmount})',
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      lang.tr(mr: 'पात्रता निकष (Eligibility Criteria)', en: 'Eligibility Criteria'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (scheme.eligibility.isEmpty)
                      Text(
                        lang.tr(mr: 'पात्रतेची माहिती उपलब्ध नाही.', en: 'Eligibility details not provided yet.'),
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      )
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
                    Text(
                      lang.tr(mr: 'आवश्यक कागदपत्रे (Required Documents)', en: 'Required Documents'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    if (scheme.documents.isEmpty)
                      Text(
                        lang.tr(mr: 'कागदपत्रांची यादी उपलब्ध नाही.', en: 'Required documents not listed yet.'),
                        style: const TextStyle(fontSize: 12, color: AppColors.muted),
                      )
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
                        label: Text(
                          lang.tr(
                            mr: 'शासकीय पोर्टलवर जा (Govt Portal)',
                            en: 'Open Govt Portal (MahaDBT)',
                          ),
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
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

class _ApplicationCard extends StatelessWidget {
  final GovtSchemeApplication application;
  final GovtScheme scheme;
  final VoidCallback onReapply;

  const _ApplicationCard({
    required this.application,
    required this.scheme,
    required this.onReapply,
  });

  @override
  Widget build(BuildContext context) {
    final lang = AppLanguage();

    Color bg;
    Color border;
    Color textColor;
    IconData icon;
    String statusLabel;

    if (application.status == 'accepted' || application.status == 'approved') {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFF86EFAC);
      textColor = const Color(0xFF166534);
      icon = Icons.check_circle;
      statusLabel = lang.tr(mr: 'मंजूर (Accepted ✓)', en: 'Accepted ✓');
    } else if (application.status == 'rejected') {
      bg = const Color(0xFFFEF2F2);
      border = const Color(0xFFFCA5A5);
      textColor = const Color(0xFF991B1B);
      icon = Icons.cancel;
      statusLabel = lang.tr(mr: 'अमान्य (Rejected ❌)', en: 'Rejected ❌');
    } else {
      bg = const Color(0xFFFFFBEB);
      border = const Color(0xFFFDE68A);
      textColor = const Color(0xFF92400E);
      icon = Icons.hourglass_top_rounded;
      statusLabel = lang.tr(mr: 'प्रलंबित (Pending ⏳)', en: 'Pending ⏳');
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      application.schemeTitle,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      application.schemeCategory.isNotEmpty ? application.schemeCategory : 'Government Scheme',
                      style: const TextStyle(fontSize: 11.5, color: AppColors.muted),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: border),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, size: 14, color: textColor),
                    const SizedBox(width: 5),
                    Text(
                      statusLabel,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: textColor),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const Divider(height: 18),

          // Application Details
          if (application.subsidyAmount.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.currency_rupee, size: 15, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(
                  '${lang.tr(mr: 'अनुदान', en: 'Subsidy')}: ${application.subsidyAmount}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],

          if (application.appliedAt.isNotEmpty) ...[
            Row(
              children: [
                const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.muted),
                const SizedBox(width: 5),
                Text(
                  '${lang.tr(mr: 'अर्ज दिनांक', en: 'Applied Date')}: ${application.appliedAt.split('T').first}',
                  style: const TextStyle(fontSize: 11.5, color: AppColors.muted),
                ),
              ],
            ),
            const SizedBox(height: 6),
          ],

          // Farmer Notes
          if (application.notes.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(8),
              margin: const EdgeInsets.only(top: 4, bottom: 4),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${lang.tr(mr: 'तुमची नोंद', en: 'Your Note')}: ${application.notes}',
                style: const TextStyle(fontSize: 11.5, color: AppColors.text),
              ),
            ),
          ],

          // Admin Remarks / Notes
          if (application.adminNotes.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.only(top: 6),
              decoration: BoxDecoration(
                color: application.status == 'rejected' ? const Color(0xFFFEF2F2) : const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: application.status == 'rejected' ? const Color(0xFFFECACA) : const Color(0xFFBBF7D0),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    lang.tr(mr: 'प्रशासनाचा शेरा (Admin Remarks):', en: 'Admin Remarks:'),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: application.status == 'rejected' ? const Color(0xFF991B1B) : const Color(0xFF166534),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    application.adminNotes,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: application.status == 'rejected' ? const Color(0xFF7F1D1D) : const Color(0xFF14532D),
                    ),
                  ),
                ],
              ),
            ),
          ],

          // Re-apply button if rejected
          if (application.status == 'rejected') ...[
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF15803D),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.refresh, size: 16),
                label: Text(
                  lang.tr(mr: 'पुन्हा अर्ज करा (Re-apply)', en: 'Re-apply for Scheme'),
                  style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold),
                ),
                onPressed: onReapply,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
