import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/providers/location_provider.dart';
import '../../../routes/route_paths.dart';
import '../../../widgets/address/select_delivery_location_sheet.dart';

import '../home_providers.dart';

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

    return Container(
      color: Colors.transparent,
      padding: const EdgeInsets.fromLTRB(14, 4, 14, 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Top Row: 3 Department Store Cards (Preorder, Ready to Cook & Instant Order)
          SizedBox(
            height: 42,
            child: Row(
              children: [
                // Card 1: Preorder
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 3),
                    child: InkWell(
                      onTap: () {
                        ref
                            .read(selectedStoreTabProvider.notifier)
                            .setStore('main');
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: currentStore == 'main'
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFE5E7EB),
                            width: currentStore == 'main' ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.calendar_today_rounded,
                              size: 13,
                              color: Color(0xFF16A34A),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                'Preorder',
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF16A34A),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Card 2: Ready to Cook
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 3),
                    child: InkWell(
                      onTap: () {
                        ref
                            .read(selectedStoreTabProvider.notifier)
                            .setStore('festive');
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: currentStore == 'festive'
                                ? const Color(0xFFEA580C)
                                : const Color(0xFFE5E7EB),
                            width: currentStore == 'festive' ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.restaurant_rounded,
                              size: 13,
                              color: Color(0xFFEA580C),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                'Ready to Cook',
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFFEA580C),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // Card 3: Instant Order
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 3),
                    child: InkWell(
                      onTap: () {
                        ref
                            .read(selectedStoreTabProvider.notifier)
                            .setStore('mall');
                      },
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: currentStore == 'mall'
                                ? const Color(0xFF2563EB)
                                : const Color(0xFFE5E7EB),
                            width: currentStore == 'mall' ? 2 : 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(
                              Icons.bolt_rounded,
                              size: 14,
                              color: Color(0xFF2563EB),
                            ),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                'Instant Order',
                                overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10.5,
                                  fontWeight: FontWeight.w800,
                                  color: const Color(0xFF2563EB),
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
