import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/theme.dart';
import '../common/fly_target_anchor.dart';
import '../common/nav_icon_locator.dart';

/// Floating pill bottom bar — frosted white glass, sliding active pill, haptics.
class FlipkartBottomNav extends StatefulWidget {
  const FlipkartBottomNav({
    super.key,
    required this.currentIndex,
    required this.items,
    required this.onTap,
    this.cartBadgeCount = 0,
    this.accountInitial,
  });

  final int currentIndex;
  final List<FlipkartNavItem> items;
  final ValueChanged<int> onTap;
  final int cartBadgeCount;
  final String? accountInitial;

  static const barHeight = 62.0;

  static final barColor = const Color(0xF5FFFFFF);
  static final activePillColor = Colors.black.withValues(alpha: 0.07);
  static const iconActive = AppColors.primary;
  static const iconInactive = AppColors.navUnselected;

  @override
  State<FlipkartBottomNav> createState() => _FlipkartBottomNavState();
}

class _FlipkartBottomNavState extends State<FlipkartBottomNav> {
  double _indicatorIndex = 0;
  bool _isDragging = false;
  int _lastHapticIndex = 0;

  @override
  void initState() {
    super.initState();
    _indicatorIndex = widget.currentIndex.toDouble();
    _lastHapticIndex = widget.currentIndex;
  }

  @override
  void didUpdateWidget(FlipkartBottomNav oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!_isDragging && oldWidget.currentIndex != widget.currentIndex) {
      // Parent rebuild already reflects currentIndex; avoid triggering an extra
      // layout pass from didUpdateWidget.
      _indicatorIndex = widget.currentIndex.toDouble();
      _lastHapticIndex = widget.currentIndex;
    }
  }

  int _indexFromX(double x, double width, int count) {
    final tabWidth = width / count;
    return ((x / tabWidth) - 0.5).round().clamp(0, count - 1);
  }

  double _fractionFromX(double x, double width, int count) {
    final tabWidth = width / count;
    return ((x / tabWidth) - 0.5).clamp(0.0, count - 1.0);
  }

  void _onDragStart() {
    setState(() => _isDragging = true);
    HapticFeedback.heavyImpact();
  }

  void _onDragUpdate(double x, double width) {
    final count = widget.items.length;
    final fraction = _fractionFromX(x, width, count);
    final hoverIndex = fraction.round();

    setState(() => _indicatorIndex = fraction);

    if (hoverIndex != _lastHapticIndex) {
      HapticFeedback.heavyImpact();
      _lastHapticIndex = hoverIndex;
    }
  }

  void _commitNavigation(int index, {required bool changedTab}) {
    HapticFeedback.heavyImpact();

    setState(() {
      _isDragging = false;
      _indicatorIndex = index.toDouble();
      _lastHapticIndex = index;
    });

    widget.onTap(index);
  }

  void _onTapUp(TapUpDetails details, double width) {
    final count = widget.items.length;
    final index = _indexFromX(details.localPosition.dx, width, count);
    _commitNavigation(index, changedTab: index != widget.currentIndex);
  }

  void _onHorizontalDragEnd(DragEndDetails details, double width) {
    final count = widget.items.length;
    final velocity = details.primaryVelocity ?? 0;
    int target;

    if (velocity.abs() >= 280) {
      target = velocity < 0
          ? (_indicatorIndex + 1).round().clamp(0, count - 1)
          : (_indicatorIndex - 1).round().clamp(0, count - 1);
    } else {
      target = _indicatorIndex.round().clamp(0, count - 1);
    }

    _commitNavigation(target, changedTab: target != widget.currentIndex);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final visualIndex =
        _isDragging ? _indicatorIndex.round() : widget.currentIndex;

    return Container(
      color: Colors.white,
      padding: EdgeInsets.only(bottom: bottomInset),
      child: RepaintBoundary(
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(
              top: BorderSide(color: Color(0xFFE5E7EB), width: 1),
            ),
            boxShadow: [
              BoxShadow(
                color: Color(0x0F000000),
                blurRadius: 8,
                offset: Offset(0, -2),
              ),
            ],
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final width = constraints.maxWidth;
              final count = widget.items.length;

                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTapUp: (details) => _onTapUp(details, width),
                  onHorizontalDragStart: (_) => _onDragStart(),
                  onHorizontalDragUpdate: (details) =>
                      _onDragUpdate(details.localPosition.dx, width),
                  onHorizontalDragEnd: (details) =>
                      _onHorizontalDragEnd(details, width),
                  child: SizedBox(
                    height: FlipkartBottomNav.barHeight,
                    child: Row(
                      children: [
                        for (var i = 0; i < count; i++)
                          Expanded(
                            child: _FloatingNavTab(
                              item: widget.items[i],
                              selected: visualIndex == i,
                              isAccount: i == count - 1,
                              accountInitial: widget.accountInitial,
                              badgeCount: widget.items[i].showBadge
                                  ? widget.cartBadgeCount
                                  : 0,
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      );
  }
}

class FlipkartNavItem {
  const FlipkartNavItem({
    required this.label,
    required this.icon,
    required this.activeIcon,
    this.assetIcon,
    this.showBadge = false,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final String? assetIcon;
  final bool showBadge;
}

class _FloatingNavTab extends StatelessWidget {
  const _FloatingNavTab({
    required this.item,
    required this.selected,
    required this.isAccount,
    this.accountInitial,
    this.badgeCount = 0,
  });

  final FlipkartNavItem item;
  final bool selected;
  final bool isAccount;
  final String? accountInitial;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildIcon(),
            const SizedBox(height: 2),
            Text(
              item.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 10,
                fontWeight: selected ? FontWeight.w900 : FontWeight.w600,
                color: selected
                    ? FlipkartBottomNav.iconActive
                    : FlipkartBottomNav.iconInactive,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcon() {
    Widget iconWidget;

    if (item.assetIcon != null && item.assetIcon!.isNotEmpty) {
      iconWidget = Image.asset(
        item.assetIcon!,
        width: 22,
        height: 22,
        fit: BoxFit.contain,
        color: selected
            ? FlipkartBottomNav.iconActive
            : FlipkartBottomNav.iconInactive,
      );
    } else if (isAccount && accountInitial != null) {
      iconWidget = _AccountAvatar(
        initial: accountInitial!,
        selected: selected,
      );
    } else {
      iconWidget = Icon(
        selected ? item.activeIcon : item.icon,
        size: 20,
        color: selected
            ? FlipkartBottomNav.iconActive
            : FlipkartBottomNav.iconInactive,
      );
    }

    if (!item.showBadge) {
      return iconWidget;
    }

    return FlyTargetAnchor(
      onReport: NavIconLocator.reportCart,
      onClear: NavIconLocator.clearCart,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          iconWidget,
          if (badgeCount > 0)
            Positioned(
              right: -7,
              top: -5,
              child: _CartCountBadge(count: badgeCount),
            ),
        ],
      ),
    );
  }
}

class _AccountAvatar extends StatelessWidget {
  const _AccountAvatar({
    required this.initial,
    required this.selected,
  });

  final String initial;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: selected
            ? AppColors.primary.withValues(alpha: 0.12)
            : Colors.transparent,
        border: Border.all(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.85)
              : AppColors.navUnselected.withValues(alpha: 0.55),
          width: selected ? 1.5 : 1,
        ),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: selected
              ? FlipkartBottomNav.iconActive
              : FlipkartBottomNav.iconInactive,
          height: 1,
        ),
      ),
    );
  }
}

class _CartCountBadge extends StatelessWidget {
  const _CartCountBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    final label = count > 99 ? '99+' : '$count';
    final minWidth = count > 9 ? 18.0 : 16.0;

    return Container(
      constraints: BoxConstraints(minWidth: minWidth, minHeight: 16),
      padding: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: AppColors.navBadge,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white, width: 1.2),
      ),
      alignment: Alignment.center,
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w700,
          height: 1,
        ),
      ),
    );
  }
}
