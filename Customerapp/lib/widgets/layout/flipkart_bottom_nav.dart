import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

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

  static const barHeight = 58.0;
  static const _horizontalMargin = 22.0;
  static const _bottomMargin = 14.0;
  static const _pillHeight = 40.0;

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

    return Padding(
      padding: EdgeInsets.fromLTRB(
        FlipkartBottomNav._horizontalMargin,
        0,
        FlipkartBottomNav._horizontalMargin,
        FlipkartBottomNav._bottomMargin + bottomInset,
      ),
      child: RepaintBoundary(
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: FlipkartBottomNav.barColor,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: AppColors.borderLight,
                width: 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                final width = constraints.maxWidth;
                final count = widget.items.length;
                final tabWidth = width / count;
                final pillWidth = tabWidth * 0.78;
                final pillLeft =
                    tabWidth * (_indicatorIndex + 0.5) - pillWidth / 2;

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
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        AnimatedPositioned(
                          duration: _isDragging
                              ? Duration.zero
                              : const Duration(milliseconds: 280),
                          curve: Curves.easeOutCubic,
                          left: pillLeft,
                          top: (FlipkartBottomNav.barHeight -
                                  FlipkartBottomNav._pillHeight) /
                              2,
                          width: pillWidth,
                          height: FlipkartBottomNav._pillHeight,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: FlipkartBottomNav.activePillColor,
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Row(
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
                      ],
                    ),
                  ),
                );
              },
            ),
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
    this.showBadge = false,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
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
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: _buildIcon(),
      ),
    );
  }

  Widget _buildIcon() {
    final iconWidget = isAccount && accountInitial != null
        ? _AccountAvatar(
            initial: accountInitial!,
            selected: selected,
          )
        : Icon(
            selected ? item.activeIcon : item.icon,
            size: 23,
            color: selected
                ? FlipkartBottomNav.iconActive
                : FlipkartBottomNav.iconInactive,
          );

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
