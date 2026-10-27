import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/providers/location_provider.dart';
import '../../../core/theme/store_chrome.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/address/select_delivery_location_sheet.dart';

import '../home_providers.dart';
import 'home_header_category_strip.dart';

/// Header top: the 3-way store switcher, then the delivery location row.
class HomeDeliveryBar extends ConsumerWidget {
  const HomeDeliveryBar({super.key});

  static const double height = 84;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentStore = ref.watch(selectedStoreTabProvider);
    final chrome = StoreChrome.forStore(currentStore);
    final location = ref.watch(deliveryLocationProvider);
    final storeName = ref.watch(nearestStoreProvider).value?.store?.storeName;

    final addressText = location?.hasLocation == true
        ? location!.displayAddress
        : 'Select location to see nearby stock';

    return SizedBox(
      height: height,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  _StoreTab(
                    label: 'PreOrder',
                    icon: Icons.calendar_month_outlined,
                    selected: currentStore == 'main',
                    accent: chrome.accent,
                    onTap: () => _selectStore(context, ref, 'main'),
                  ),
                  _StoreTab(
                    label: 'Ready2Cook',
                    icon: Icons.soup_kitchen_outlined,
                    selected: currentStore == 'festive',
                    accent: chrome.accent,
                    onTap: () => _selectStore(context, ref, 'festive'),
                  ),
                  _StoreTab(
                    label: 'InstantOrder',
                    icon: Icons.bolt_outlined,
                    selected: currentStore == 'mall',
                    accent: chrome.accent,
                    onTap: () => _selectStore(context, ref, 'mall'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),
            InkWell(
              onTap: () => showSelectDeliveryLocationBottomSheet(context, ref),
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                height: 26,
                child: Row(
                  children: [
                    Icon(Icons.location_on_rounded, size: 17, color: chrome.accent),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        addressText,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: chrome.accent),
                    if (storeName != null && storeName.isNotEmpty) ...[
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          '($storeName)',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: chrome.accent,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _selectStore(BuildContext context, WidgetRef ref, String store) {
    ref.read(selectedStoreTabProvider.notifier).setStore(store);
    ref.read(selectedCategoryHeaderTabProvider.notifier).setCategory('All');
    context.go(RoutePaths.home);
  }
}

/// Active tab fills the whole switcher height with a green box.
class _StoreTab extends StatelessWidget {
  const _StoreTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.accent,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final Color accent;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? accent : const Color(0xFF64748B);
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          height: double.infinity,
          decoration: BoxDecoration(
            color: selected ? accent.withValues(alpha: 0.12) : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
            border: Border.all(
              color: selected ? accent : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 15, color: fg),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                    color: fg,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
