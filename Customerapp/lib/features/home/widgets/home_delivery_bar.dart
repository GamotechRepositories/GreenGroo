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

class HomeDeliveryBar extends ConsumerWidget {
  const HomeDeliveryBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = ref.watch(deliveryLocationProvider);
    final nearestAsync = ref.watch(nearestStoreProvider);
    final currentStore = ref.watch(selectedStoreTabProvider);

    final addressText = location?.hasLocation == true
        ? location!.displayAddress
        : 'Select location to see nearby stock';

    final storeName = nearestAsync.value?.store?.storeName;
    final chrome = StoreChrome.forStore(currentStore);

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SizedBox(
              height: 32,
              child: Row(
                children: [
                  _DepartmentPill(
                    label: 'PreOrder',
                    icon: Icons.calendar_today_rounded,
                    selected: currentStore == 'main',
                    chrome: _pillChrome(currentStore),
                    onTap: () => _selectStore(context, ref, 'main'),
                  ),
                  const SizedBox(width: 6),
                  _DepartmentPill(
                    label: 'Ready2Cook',
                    icon: Icons.restaurant_rounded,
                    selected: currentStore == 'festive',
                    chrome: _pillChrome(currentStore),
                    onTap: () => _selectStore(context, ref, 'festive'),
                  ),
                  const SizedBox(width: 6),
                  _DepartmentPill(
                    label: 'InstantOrder',
                    icon: Icons.bolt_rounded,
                    selected: currentStore == 'mall',
                    chrome: _pillChrome(currentStore),
                    onTap: () => _selectStore(context, ref, 'mall'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 4),
          InkWell(
            onTap: () => showSelectDeliveryLocationBottomSheet(context, ref),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
              child: Row(
                children: [
                  Icon(
                    Icons.location_on_rounded,
                    size: 16,
                    color: chrome.locationColor,
                  ),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      addressText,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: chrome.locationColor,
                  ),
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
                          color: chrome.locationColor,
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
    );
  }

  static _PillChrome _pillChrome(String store) {
    switch (store) {
      case 'festive':
        return const _PillChrome(
          idleBg: Color(0xFFFDE68A),
          idleText: Color(0xFF92400E),
          activeBg: Color(0xFFFACC15),
          activeText: Color(0xFF422006),
          radius: 999,
          showIcon: false,
        );
      case 'mall':
        return const _PillChrome(
          idleBg: Color(0xFF93C5FD),
          idleText: Color(0xFF1E3A8A),
          activeBg: Color(0xFF3B82F6),
          activeText: Colors.white,
          radius: 999,
          showIcon: false,
        );
      default:
        return const _PillChrome(
          idleBg: Color(0xFF0F291E),
          idleText: Colors.white,
          activeBg: Color(0xFF0F291E),
          activeText: Colors.white,
          radius: 8,
          showIcon: true,
          activeBorder: Colors.white,
        );
    }
  }

  void _selectStore(BuildContext context, WidgetRef ref, String store) {
    ref.read(selectedStoreTabProvider.notifier).setStore(store);
    ref.read(selectedCategoryHeaderTabProvider.notifier).setCategory('All');
    context.go(RoutePaths.home);
  }
}

class _PillChrome {
  const _PillChrome({
    required this.idleBg,
    required this.idleText,
    required this.activeBg,
    required this.activeText,
    required this.radius,
    required this.showIcon,
    this.activeBorder = Colors.white,
  });

  final Color idleBg;
  final Color idleText;
  final Color activeBg;
  final Color activeText;
  final double radius;
  final bool showIcon;
  final Color activeBorder;
}

class _DepartmentPill extends StatelessWidget {
  const _DepartmentPill({
    required this.label,
    required this.icon,
    required this.selected,
    required this.chrome,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final _PillChrome chrome;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = selected ? chrome.activeBg : chrome.idleBg;
    final fg = selected ? chrome.activeText : chrome.idleText;
    final radius = BorderRadius.circular(chrome.radius);

    return Expanded(
      child: Material(
        color: bg,
        borderRadius: radius,
        child: InkWell(
          onTap: onTap,
          borderRadius: radius,
          child: Container(
            alignment: Alignment.center,
            padding: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              borderRadius: radius,
              border: Border.all(
                color: selected ? chrome.activeBorder : Colors.white24,
                width: selected && chrome.showIcon ? 2 : 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (chrome.showIcon) ...[
                  Icon(icon, size: 11, color: fg),
                  const SizedBox(width: 3),
                ],
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: chrome.showIcon ? 9 : 11,
                      fontWeight: selected ? FontWeight.w800 : FontWeight.w700,
                      color: fg,
                      letterSpacing: -0.2,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
