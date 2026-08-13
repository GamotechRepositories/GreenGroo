import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/constants/app_spacing.dart';
import '../../../core/constants/service_locations.dart';
import '../../../core/routes/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/onboarding_nav.dart';
import '../../../data/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../widgets/buttons/primary_button.dart';

class AreaSelectionScreen extends StatefulWidget {
  const AreaSelectionScreen({super.key, required this.cityId});

  final String cityId;

  @override
  State<AreaSelectionScreen> createState() => _AreaSelectionScreenState();
}

class _AreaSelectionScreenState extends State<AreaSelectionScreen> {
  String? _selectedArea;
  final _searchController = TextEditingController();
  String _query = '';
  AreaManagerInfo? _darkStoreInfo;
  bool _loadingStore = false;

  ServiceCity? get _city => ServiceLocations.byId(widget.cityId);

  List<String> get _filtered {
    final areas = _city?.areas ?? const <String>[];
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return areas;
    return areas.where((a) => a.toLowerCase().contains(q)).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _onAreaSelect(String area) async {
    setState(() {
      _selectedArea = area;
      _loadingStore = true;
      _darkStoreInfo = null;
    });

    final info = await AuthService.instance.fetchAreaManagerByLocation(
      widget.cityId,
      area,
    );

    if (mounted) {
      setState(() {
        _darkStoreInfo = info;
        _loadingStore = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final city = _city;
    final areas = _filtered;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const AppBackButton(fallbackRoute: AppRoutes.selectCity),
      ),
      body: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.selectArea,
                    style: GoogleFonts.inter(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    city == null
                        ? l10n.selectAreaSubtitle
                        : '${l10n.selectAreaSubtitle} · ${city.name}',
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _query = v),
                    decoration: InputDecoration(
                      hintText: l10n.searchArea,
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      fillColor: AppColors.surfaceVariant,
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: areas.isEmpty
                  ? Center(
                      child: Text(
                        l10n.noAreasFound,
                        style: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8,
                      ),
                      itemCount: areas.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final area = areas[index];
                        final selected = _selectedArea == area;
                        return Material(
                          color:
                              selected ? AppColors.primaryLight : Colors.white,
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusMd),
                          child: InkWell(
                            onTap: () => _onAreaSelect(area),
                            borderRadius:
                                BorderRadius.circular(AppSpacing.radiusMd),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(
                                  AppSpacing.radiusMd,
                                ),
                                border: Border.all(
                                  color: selected
                                      ? AppColors.primary
                                      : AppColors.border,
                                  width: selected ? 2 : 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.place_outlined,
                                    color: selected
                                        ? AppColors.primary
                                        : AppColors.textMuted,
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      area,
                                      style: GoogleFonts.inter(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  if (selected)
                                    Icon(
                                      Icons.check_circle,
                                      color: AppColors.primary,
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),

            // DARK STORE ADDRESS & MANAGER INFO CARD
            if (_selectedArea != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDF4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBF7D0)),
                ),
                child: _loadingStore
                    ? const Row(
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF059669)),
                          ),
                          SizedBox(width: 12),
                          Text('Fetching Dark Store location details...', style: TextStyle(fontSize: 13, color: Color(0xFF065F46))),
                        ],
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.storefront_rounded, color: Color(0xFF059669), size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _darkStoreInfo?.storeName ?? '${_selectedArea!} Dark Store',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF064E3B),
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text(
                                  'ACTIVE HUB',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF047857)),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(Icons.location_on_outlined, color: Color(0xFF047857), size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  _darkStoreInfo?.storeAddress ?? '${_selectedArea!}, ${city?.name ?? "City"}',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: const Color(0xFF065F46),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (_darkStoreInfo?.phone.isNotEmpty == true) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.phone_outlined, color: Color(0xFF047857), size: 16),
                                const SizedBox(width: 6),
                                Text(
                                  'Store Manager Contact: ${_darkStoreInfo!.phone}',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF047857),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
              ),

            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 20),
              child: PrimaryButton(
                label: l10n.continueButton,
                onPressed: _selectedArea == null || city == null
                    ? null
                    : () => goOnboardingStep(
                          context,
                          step: 'documents',
                          route: AppRoutes.uploadDocuments,
                          data: {
                            'city': city.name,
                            'cityId': city.id,
                            'area': _selectedArea,
                          },
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
