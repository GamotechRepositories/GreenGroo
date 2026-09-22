import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/providers/location_provider.dart';
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

    final departmentBoxBgColor = currentStore == 'festive'
        ? const Color(0xFF7C2D12)
        : currentStore == 'mall'
            ? const Color(0xFF1E40AF)
            : const Color(0xFF0F291E);

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Top Row: 3 Department Store Cards (PREORDER, READY TO COOK, INSTANT ORDER)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: SizedBox(
              height: 34,
              child: Row(
                children: [
                  // Card 1: PREORDER
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 3),
                      child: InkWell(
                        onTap: () {
                          ref
                              .read(selectedStoreTabProvider.notifier)
                              .setStore('main');
                          ref
                              .read(selectedCategoryHeaderTabProvider.notifier)
                              .setCategory('All');
                          context.go(RoutePaths.home);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          height: 34,
                          decoration: BoxDecoration(
                            color: departmentBoxBgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: currentStore == 'main'
                                  ? Colors.white
                                  : Colors.white24,
                              width: currentStore == 'main' ? 2 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 2, vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.calendar_today_rounded,
                                size: 11,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 2),
                              Flexible(
                                child: Text(
                                  'PREORDER',
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 9.0,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Card 2: READY TO COOK
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: InkWell(
                        onTap: () {
                          ref
                              .read(selectedStoreTabProvider.notifier)
                              .setStore('festive');
                          ref
                              .read(selectedCategoryHeaderTabProvider.notifier)
                              .setCategory('All');
                          context.go(RoutePaths.home);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          height: 34,
                          decoration: BoxDecoration(
                            color: departmentBoxBgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: currentStore == 'festive'
                                  ? Colors.white
                                  : Colors.white24,
                              width: currentStore == 'festive' ? 2 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 2, vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.restaurant_rounded,
                                size: 11,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 2),
                              Flexible(
                                child: Text(
                                  'READY TO COOK',
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 9.0,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Card 3: INSTANT ORDER
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 3),
                      child: InkWell(
                        onTap: () {
                          ref
                              .read(selectedStoreTabProvider.notifier)
                              .setStore('mall');
                          ref
                              .read(selectedCategoryHeaderTabProvider.notifier)
                              .setCategory('All');
                          context.go(RoutePaths.home);
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          height: 34,
                          decoration: BoxDecoration(
                            color: departmentBoxBgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: currentStore == 'mall'
                                  ? Colors.white
                                  : Colors.white24,
                              width: currentStore == 'mall' ? 2 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.12),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 2, vertical: 2),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(
                                Icons.bolt_rounded,
                                size: 12,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 2),
                              Flexible(
                                child: Text(
                                  'INSTANT ORDER',
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 9.0,
                                    fontWeight: FontWeight.w900,
                                    color: Colors.white,
                                    letterSpacing: 0.1,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 4),

          // 2. Below Department Cards: Full-width Location selector
          InkWell(
            onTap: () => showSelectDeliveryLocationBottomSheet(context, ref),
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 2),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on_rounded,
                    size: 16,
                    color: Color(0xFF047857),
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
                  const Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 18,
                    color: Color(0xFF475569),
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
                          color: const Color(0xFF64748B),
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
}
