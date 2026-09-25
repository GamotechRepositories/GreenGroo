import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/store_chrome.dart';
import '../../../widgets/common/app_network_image.dart';

class DepartmentHeroWidget extends ConsumerWidget {
  final String storeType; // 'festive' (Ready to Cook) or 'mall' (Instant Order)

  const DepartmentHeroWidget({
    super.key,
    required this.storeType,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isReadyToCook = storeType == 'festive';

    final titleText = isReadyToCook
        ? 'GRAND READY TO COOK SALE'
        : 'SUPERFAST 10-MIN INSTANT STORE';

    final subtitleText = isReadyToCook
        ? 'Chef Meals, Instant Noodles, Pasta & Sauces'
        : 'Cold Drinks, Snacks, Ice Creams & Essentials';

    final badgeColor = isReadyToCook ? const Color(0xFFEA580C) : const Color(0xFF2563EB);

    final dealCards = isReadyToCook
        ? [
            _DeptDealItem(
              title: 'Deal Zone',
              subText: 'STARTS FROM ₹49',
              image: 'https://images.unsplash.com/photo-1585837575652-267c041d77d4?w=400',
              badge: 'UP TO 50% OFF',
              badgeBg: const Color(0xFFDC2626),
              isTall: true,
            ),
            _DeptDealItem(
              title: 'Instant Noodles & Pasta',
              subText: 'STARTS FROM ₹29',
              image: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400',
              badge: 'STARTS ₹29',
              badgeBg: const Color(0xFF0284C7),
            ),
            _DeptDealItem(
              title: 'Heat & Eat Meals',
              subText: 'STARTS FROM ₹69',
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
              badge: 'STARTS ₹69',
              badgeBg: const Color(0xFF0284C7),
            ),
            _DeptDealItem(
              title: 'Sauces & Gravies',
              subText: 'STARTS FROM ₹49',
              image: 'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=400',
              badge: 'STARTS ₹49',
              badgeBg: const Color(0xFF0284C7),
            ),
            _DeptDealItem(
              title: 'Ready Mix & Soups',
              subText: 'STARTS FROM ₹39',
              image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
              badge: 'STARTS ₹39',
              badgeBg: const Color(0xFF0284C7),
            ),
          ]
        : [
            _DeptDealItem(
              title: 'Instant Deals',
              subText: 'STARTS FROM ₹19',
              image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
              badge: 'FAST 10 MIN',
              badgeBg: const Color(0xFF2563EB),
              isTall: true,
            ),
            _DeptDealItem(
              title: 'Chilled Drinks',
              subText: 'STARTS FROM ₹25',
              image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400',
              badge: 'STARTS ₹25',
              badgeBg: const Color(0xFF2563EB),
            ),
            _DeptDealItem(
              title: 'Snacks & Munchies',
              subText: 'STARTS FROM ₹15',
              image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400',
              badge: 'STARTS ₹15',
              badgeBg: const Color(0xFF2563EB),
            ),
            _DeptDealItem(
              title: 'Sweets & Ice Creams',
              subText: 'STARTS FROM ₹39',
              image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400',
              badge: 'STARTS ₹39',
              badgeBg: const Color(0xFF2563EB),
            ),
            _DeptDealItem(
              title: 'Chocolates & Candies',
              subText: 'STARTS FROM ₹20',
              image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400',
              badge: 'STARTS ₹20',
              badgeBg: const Color(0xFF2563EB),
            ),
          ];

    final deptBgColor = StoreChrome.forStore(
      isReadyToCook ? 'festive' : 'mall',
    ).header;

    return Container(
      width: double.infinity,
      color: deptBgColor,
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  titleText,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  subtitleText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF475569),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // 4-Card Offer Grid matching reference layout
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left Tall Deal Zone Card
              Expanded(
                flex: 4,
                child: _buildTallCard(dealCards[0]),
              ),
              const SizedBox(width: 8),

              // Right 2x2 Grid Cards
              Expanded(
                flex: 6,
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildSmallGridCard(dealCards[1])),
                        const SizedBox(width: 6),
                        Expanded(child: _buildSmallGridCard(dealCards[2])),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(child: _buildSmallGridCard(dealCards[3])),
                        const SizedBox(width: 6),
                        Expanded(child: _buildSmallGridCard(dealCards[4])),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTallCard(_DeptDealItem item) {
    return Container(
      height: 168,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AppNetworkImage(
                imageUrl: item.image,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 3),
            decoration: BoxDecoration(
              color: item.badgeBg,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              item.subText,
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 9.5,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallGridCard(_DeptDealItem item) {
    return Container(
      height: 81,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(4),
      child: Column(
        children: [
          Text(
            item.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 9.5,
              fontWeight: FontWeight.w800,
              color: const Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 2),
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: AppNetworkImage(
                imageUrl: item.image,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 2),
            decoration: BoxDecoration(
              color: item.badgeBg,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              item.badge,
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 8.5,
                fontWeight: FontWeight.w900,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DeptDealItem {
  final String title;
  final String subText;
  final String image;
  final String badge;
  final Color badgeBg;
  final bool isTall;

  _DeptDealItem({
    required this.title,
    required this.subText,
    required this.image,
    required this.badge,
    required this.badgeBg,
    this.isTall = false,
  });
}
