import 'package:flutter/material.dart';

/// Header, search, and bottom-nav colors for Preorder, Ready to Cook, and Instant.
class StoreChrome {
  const StoreChrome({
    required this.header,
    required this.accent,
    required this.activeNavBg,
    required this.searchHint,
    required this.locationColor,
  });

  final Color header;
  final Color accent;
  final Color activeNavBg;
  final String searchHint;
  final Color locationColor;

  static StoreChrome forStore(String store) {
    switch (store) {
      case 'festive':
      case 'ready2cook':
        return const StoreChrome(
          header: Color(0xFFFFF8DB),
          accent: Color(0xFFB45309),
          activeNavBg: Color(0xFFFDE68A),
          searchHint: 'Search "Chopped", "Mixes", "Herbs"...',
          locationColor: Color(0xFF92400E),
        );
      case 'mall':
      case 'instantorder':
        return const StoreChrome(
          header: Color(0xFFE8F1FF),
          accent: Color(0xFF2563EB),
          activeNavBg: Color(0xFFBFDBFE),
          searchHint: 'Search "Snacks", "Dairy", "Essentials"...',
          locationColor: Color(0xFF1E3A8A),
        );
      default:
        return const StoreChrome(
          header: Color(0xFFB0DAC6),
          accent: Color(0xFF0C831F),
          activeNavBg: Color(0xFFD1FAE5),
          searchHint: 'Search for "Fruits", "Vegetables"...',
          locationColor: Color(0xFF047857),
        );
    }
  }
}
