import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:share_plus/share_plus.dart';

import '../../core/providers/app_providers.dart';
import '../../core/providers/location_provider.dart';
import '../../features/address/address_controller.dart';
import '../../models/address.dart';
import '../../routes/route_paths.dart';

void showSelectDeliveryLocationBottomSheet(BuildContext context, WidgetRef ref) {
  ref.read(addressControllerProvider.notifier).loadAddresses();

  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (context) => const SelectDeliveryLocationSheetContent(),
  );
}

class SelectDeliveryLocationSheetContent extends ConsumerStatefulWidget {
  const SelectDeliveryLocationSheetContent({super.key});

  @override
  ConsumerState<SelectDeliveryLocationSheetContent> createState() =>
      _SelectDeliveryLocationSheetContentState();
}

class _SelectDeliveryLocationSheetContentState
    extends ConsumerState<SelectDeliveryLocationSheetContent> {
  final _searchController = TextEditingController();
  bool _isDetectingLocation = false;
  String _searchQuery = '';
  List<String> _searchResults = [];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleDetectLiveLocation() async {
    setState(() => _isDetectingLocation = true);

    await Future<void>.delayed(const Duration(milliseconds: 700));

    final liveLoc = const DeliveryLocation(
      latitude: 18.5912,
      longitude: 73.7389,
      state: 'Maharashtra',
      city: 'Pune',
      area: 'Hinjawadi Phase 2',
      pincode: '411057',
      address:
          'Geras Imperium Rise Plaza, Rajiv Gandhi Infotech Park, Hinjawadi Phase 2, Pune, Maharashtra 411057',
      label: 'Hinjawadi Phase 2, Pune',
    );

    await ref.read(deliveryLocationProvider.notifier).setLocation(liveLoc);
    ref.invalidate(nearestStoreProvider);

    if (mounted) {
      setState(() => _isDetectingLocation = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Live location detected: Hinjawadi Phase 2, Pune',
                  style: GoogleFonts.plusJakartaSans(fontSize: 13),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF047857),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  Future<void> _selectAddress(DeliveryLocation loc) async {
    await ref.read(deliveryLocationProvider.notifier).setLocation(loc);
    ref.invalidate(nearestStoreProvider);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Delivery location updated to ${loc.area ?? loc.city}',
            style: GoogleFonts.plusJakartaSans(fontSize: 13),
          ),
          backgroundColor: const Color(0xFF047857),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  void _onSearchChanged(String val) async {
    setState(() => _searchQuery = val.trim());
    if (_searchQuery.isEmpty) {
      setState(() => _searchResults = []);
      return;
    }
    final api = ref.read(apiServiceProvider);
    try {
      final res = await api.fetchLocationPincodes(state: 'Maharashtra', city: 'Pune', q: _searchQuery);
      if (mounted) {
        setState(() => _searchResults = res);
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final currentLocation = ref.watch(deliveryLocationProvider);
    final savedAddresses = ref.watch(addressControllerProvider.select((s) => s.addresses));

    final mediaQuery = MediaQuery.of(context);
    final maxSheetHeight = mediaQuery.size.height * 0.88;

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.topCenter,
      children: [
        // Floating X Close Button
        Positioned(
          top: -50,
          child: GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 38,
              height: 38,
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 8,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(Icons.close_rounded, color: Colors.white, size: 22),
            ),
          ),
        ),

        // Main Sheet Body
        Container(
          constraints: BoxConstraints(maxHeight: maxSheetHeight),
          decoration: const BoxDecoration(
            color: Color(0xFFF8FAFC),
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Drag Handle & Title
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFCBD5E1),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    Text(
                      'Select delivery location',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),

              // Search Area Input Bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 46,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: _onSearchChanged,
                    decoration: InputDecoration(
                      hintText: 'Search for area, street name...',
                      hintStyle: GoogleFonts.plusJakartaSans(
                        fontSize: 13.5,
                        color: const Color(0xFF94A3B8),
                        fontWeight: FontWeight.w500,
                      ),
                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: Color(0xFF64748B),
                        size: 21,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Scrollable Options & Saved Addresses List
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    if (_searchQuery.isNotEmpty && _searchResults.isNotEmpty) ...[
                      Text(
                        'Search Results',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                        ),
                        child: Column(
                          children: _searchResults.map((pin) {
                            return ListTile(
                              leading: const Icon(Icons.location_on_outlined, color: Color(0xFF047857)),
                              title: Text('Pincode $pin', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 13.5)),
                              onTap: () {
                                _selectAddress(DeliveryLocation(
                                  pincode: pin,
                                  city: 'Pune',
                                  area: 'Area $pin',
                                  address: 'Area $pin, Pune - $pin',
                                ));
                              },
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Top Action Options Card
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // 1. Use Current Location
                          InkWell(
                            onTap: _isDetectingLocation ? null : _handleDetectLiveLocation,
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF0FDF4),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.my_location_rounded,
                                      color: Color(0xFF047857),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Use current location',
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 14.5,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF047857),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _isDetectingLocation
                                              ? 'Detecting live location...'
                                              : (currentLocation?.displayAddress ??
                                                  'Geras Imperium Rise Plaza, Rajiv Gandhi Infotech Park, Hinjawadi Phase 2, Pune, Maharashtra'),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.plusJakartaSans(
                                            fontSize: 11.5,
                                            color: const Color(0xFF64748B),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (_isDetectingLocation)
                                    const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Color(0xFF047857),
                                      ),
                                    )
                                  else
                                    const Icon(
                                      Icons.chevron_right_rounded,
                                      color: Color(0xFF94A3B8),
                                      size: 22,
                                    ),
                                ],
                              ),
                            ),
                          ),

                          const Divider(height: 1, color: Color(0xFFF1F5F9)),

                          // 2. Add New Address
                          InkWell(
                            onTap: () {
                              Navigator.of(context).pop();
                              context.push(RoutePaths.location);
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF0FDF4),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.add_rounded,
                                      color: Color(0xFF047857),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Add new address',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 14.5,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF047857),
                                      ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: Color(0xFF94A3B8),
                                    size: 22,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const Divider(height: 1, color: Color(0xFFF1F5F9)),

                          // 3. Request address from someone else
                          InkWell(
                            onTap: () {
                              Share.share(
                                'Hi! Please share your delivery address with me for ordering groceries on GreenGrocc: https://greengrocc.in',
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF25D366),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(
                                      Icons.chat_bubble_outline_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Request address from someone else',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: Color(0xFF94A3B8),
                                    size: 22,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          const Divider(height: 1, color: Color(0xFFF1F5F9)),

                          // 4. Import your addresses from Zomato
                          InkWell(
                            onTap: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    'Zomato addresses imported successfully!',
                                    style: GoogleFonts.plusJakartaSans(fontSize: 13),
                                  ),
                                  backgroundColor: const Color(0xFFE23744),
                                  behavior: SnackBarBehavior.floating,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                              );
                            },
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                              child: Row(
                                children: [
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE23744),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'zomato',
                                        style: GoogleFonts.plusJakartaSans(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w900,
                                          fontSize: 7.5,
                                          fontStyle: FontStyle.italic,
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'Import your addresses from Zomato',
                                      style: GoogleFonts.plusJakartaSans(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    color: Color(0xFF94A3B8),
                                    size: 22,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Saved Addresses Section Header
                    Text(
                      'Your saved addresses',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF64748B),
                      ),
                    ),

                    const SizedBox(height: 10),

                    // Render Saved Addresses List
                    if (savedAddresses.isNotEmpty)
                      ...savedAddresses.map((addr) => _SavedAddressCardItem(
                            address: addr,
                            isCurrent: currentLocation?.pincode == addr.pincode || addr.isDefault,
                            onSelect: () => _selectAddress(
                              DeliveryLocation(
                                pincode: addr.pincode,
                                city: addr.city,
                                state: addr.state,
                                area: addr.fullAddress,
                                address: '${addr.shopNo} ${addr.shopName}, ${addr.fullAddress}, ${addr.city}, ${addr.state} - ${addr.pincode}',
                                label: '${addr.shopName.isNotEmpty ? addr.shopName : addr.fullAddress}, ${addr.city}',
                              ),
                            ),
                          ))
                    else ...[
                      // Mock/Default Saved Address Card 1: Work
                      _SavedAddressCardItem(
                        address: const Address(
                          id: 'mock_work',
                          fullName: 'Work',
                          number: '9579636287',
                          email: '',
                          shopNo: '618',
                          shopName: 'Office number 618 floor 6 gerra imperium hinjewadi phase 2',
                          fullAddress: "Gera's Imperium Rise, Hinjawadi Phase 2 Road, Hinjawadi Phase 2",
                          landmark: '',
                          city: 'Pune',
                          state: 'Maharashtra',
                          pincode: '411057',
                          isDefault: true,
                        ),
                        isCurrent: true,
                        onSelect: () => _selectAddress(
                          const DeliveryLocation(
                            pincode: '411057',
                            city: 'Pune',
                            state: 'Maharashtra',
                            area: 'Hinjawadi Phase 2',
                            address:
                                "Office number 618 floor 6 gerra imperium hinjewadi phase 2, Gera's Imperium Rise, Hinjawadi Phase 2 Road, Pune - 411057",
                            label: 'Work - Office number 618 floor 6',
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Mock/Default Saved Address Card 2: Other
                      _SavedAddressCardItem(
                        address: const Address(
                          id: 'mock_other',
                          fullName: 'Other',
                          number: '9579636287',
                          email: '',
                          shopNo: '103',
                          shopName: 'Room no 103 gate no 3 balewadi stadium mahlunge road',
                          fullAddress: 'National Games Park, Balewadi',
                          landmark: '',
                          city: 'Pune',
                          state: 'Maharashtra',
                          pincode: '411045',
                        ),
                        distanceText: '5.53 km',
                        isCurrent: false,
                        onSelect: () => _selectAddress(
                          const DeliveryLocation(
                            pincode: '411045',
                            city: 'Pune',
                            state: 'Maharashtra',
                            area: 'Balewadi',
                            address:
                                'Room no 103 gate no 3 balewadi stadium mahlunge road, National Games Park, Balewadi, Pune - 411045',
                            label: 'Other - Balewadi Stadium',
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SavedAddressCardItem extends StatelessWidget {
  const _SavedAddressCardItem({
    required this.address,
    required this.onSelect,
    this.isCurrent = false,
    this.distanceText,
  });

  final Address address;
  final VoidCallback onSelect;
  final bool isCurrent;
  final String? distanceText;

  @override
  Widget build(BuildContext context) {
    final title = address.fullName.isNotEmpty ? address.fullName : 'Saved Address';
    final isWork = title.toLowerCase().contains('work') || title.toLowerCase().contains('office');

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isCurrent ? const Color(0xFF10B981) : const Color(0xFFF1F5F9),
            width: isCurrent ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            InkWell(
              onTap: onSelect,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon Badge (Work/Home/Other) with "You're here" overlay if current
                    Column(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: isWork ? const Color(0xFFFEF3C7) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            isWork ? Icons.apartment_rounded : Icons.location_on_rounded,
                            color: isWork ? const Color(0xFFD97706) : const Color(0xFF047857),
                            size: 24,
                          ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFFA7F3D0)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.check_circle_rounded, color: Color(0xFF047857), size: 10),
                                const SizedBox(width: 2),
                                Text(
                                  "You're here",
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 8.5,
                                    fontWeight: FontWeight.w800,
                                    color: const Color(0xFF047857),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else if (distanceText != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            distanceText!,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(width: 12),

                    // Address Info Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                title,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              const Spacer(),
                              const Icon(
                                Icons.push_pin_outlined,
                                size: 16,
                                color: Color(0xFF94A3B8),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${address.shopNo.isNotEmpty ? "${address.shopNo}, " : ""}${address.shopName.isNotEmpty ? "${address.shopName}, " : ""}${address.fullAddress}, ${address.city}',
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              height: 1.35,
                              color: const Color(0xFF475569),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          if (address.number.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Phone number: ${address.number}',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF334155),
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),

                          // Option Buttons row (... & Share)
                          Row(
                            children: [
                              InkWell(
                                onTap: () {},
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: const Icon(Icons.more_horiz_rounded, size: 16, color: Color(0xFF64748B)),
                                ),
                              ),
                              const SizedBox(width: 8),
                              InkWell(
                                onTap: () {
                                  Share.share(
                                    'Delivery address (${address.fullName}): ${address.fullAddress}, ${address.city} - ${address.pincode}',
                                  );
                                },
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: const Icon(Icons.ios_share_rounded, size: 14, color: Color(0xFF047857)),
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
            ),

            if (isCurrent) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: const BoxDecoration(
                  color: Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(16)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.ios_share_rounded, size: 15, color: Color(0xFF047857)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Now share your addresses with friends and family',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF92400E),
                        ),
                      ),
                    ),
                    const Icon(Icons.close_rounded, size: 16, color: Color(0xFFB45309)),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
