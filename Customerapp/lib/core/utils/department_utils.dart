import 'package:flutter/material.dart';

/// Order departments, matching the backend (`departmentHelpers.js`).
abstract final class Department {
  static const preorder = 'preorder';
  static const ready2cook = 'ready2cook';
  static const instant = 'instant';

  static const ordered = [preorder, ready2cook, instant];
}

/// Map a product section / storeType to preorder | ready2cook | instant.
String departmentForSection(String section, [String storeType = '']) {
  final sec = section.trim().toLowerCase();
  final type = storeType.trim().toLowerCase();
  if (const ['ready2cook', 'ready-2-cook', 'festive'].contains(sec) || type == 'festive') {
    return Department.ready2cook;
  }
  if (const ['instantorder', 'instant', 'supermall', 'mall', 'instantorders'].contains(sec) ||
      type == 'mall') {
    return Department.instant;
  }
  return Department.preorder;
}

String departmentLabel(String department) {
  switch (department) {
    case Department.ready2cook:
      return 'Ready2Cook';
    case Department.instant:
      return 'Instant Order';
    default:
      return 'Pre-order';
  }
}

IconData departmentIcon(String department) {
  switch (department) {
    case Department.ready2cook:
      return Icons.soup_kitchen_rounded;
    case Department.instant:
      return Icons.bolt_rounded;
    default:
      return Icons.event_available_rounded;
  }
}

Color departmentColor(String department) {
  switch (department) {
    case Department.ready2cook:
      return const Color(0xFFEA580C);
    case Department.instant:
      return const Color(0xFF7C3AED);
    default:
      return const Color(0xFF047857);
  }
}
