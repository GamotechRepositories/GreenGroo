import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:customer_app/core/bootstrap/app_bootstrap.dart';
import 'package:customer_app/core/scroll/tab_scroll_registry.dart';
import 'package:customer_app/core/theme/store_chrome.dart';
import 'package:customer_app/features/auth/auth_controller.dart';
import 'package:customer_app/features/cart/cart_controller.dart';
import 'package:customer_app/features/home/home_providers.dart';
import 'app_back_binding.dart';
import 'common/offline_banner.dart';
import 'layout/flipkart_bottom_nav.dart';
import 'layout/mobile_header.dart';
import 'wishlist/wishlist_toast.dart';

class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell> {
  static const _tabs = <FlipkartNavItem>[
    FlipkartNavItem(
      label: 'Home',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
      assetIcon: 'assets/images/homeIcon.png',
    ),
    FlipkartNavItem(
      label: 'Order Again',
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long_rounded,
      assetIcon: 'assets/images/orderAgainIcon.png',
    ),
    FlipkartNavItem(
      label: 'Categories',
      icon: Icons.widgets_outlined,
      activeIcon: Icons.widgets_rounded,
      assetIcon: 'assets/images/categoriesIcon (1).png',
    ),
    FlipkartNavItem(
      label: 'Shop',
      icon: Icons.shopping_bag_outlined,
      activeIcon: Icons.shopping_bag_rounded,
      assetIcon: 'assets/images/cart.png',
      showBadge: true,
    ),
    FlipkartNavItem(
      label: 'Account',
      icon: Icons.account_circle_outlined,
      activeIcon: Icons.account_circle_rounded,
      assetIcon: 'assets/images/profileIcon.png',
    ),
  ];

  /// Visual tab order maps onto the existing shell branches.
  /// Shop keeps the cart screen so checkout stays on the bar.
  static const _shellForVisual = [0, 2, 1, 3, 4];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future<void>.delayed(const Duration(milliseconds: 800), () {
        if (mounted) _maybeBootstrap();
      });
    });
  }

  void _maybeBootstrap() {
    unawaited(bootstrapUserSession(ref));
  }

  int _visualIndex(int shellIndex) {
    switch (shellIndex) {
      case 0:
        return 0;
      case 2:
        return 1;
      case 1:
        return 2;
      case 3:
        return 3;
      case 4:
        return 4;
      default:
        return 0;
    }
  }

  Future<void> _onTap(int visualIndex) async {
    final auth = ref.read(authControllerProvider);
    final needsAuth = visualIndex == 1 || visualIndex == 4;

    if (needsAuth && !auth.isLoggedIn) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      return;
    }

    final shellIndex = _shellForVisual[visualIndex];
    final currentVisual = _visualIndex(widget.navigationShell.currentIndex);
    final isCurrentTab = visualIndex == currentVisual;

    if (isCurrentTab) {
      await ref.read(tabScrollRegistryProvider).scrollToTop(shellIndex);
    }
    if (!mounted) return;

    widget.navigationShell.goBranch(
      shellIndex,
      initialLocation: isCurrentTab,
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = ref.watch(
      cartControllerProvider.select((s) => s.cartCount),
    );
    final accountInitial = ref.watch(
      authControllerProvider.select((s) {
        final name = s.user?.name;
        if (name == null || name.trim().isEmpty) return null;
        return name.trim()[0].toUpperCase();
      }),
    );

    final isKeyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final hideBottomNav = isKeyboardOpen;
    final visualIndex = _visualIndex(widget.navigationShell.currentIndex);
    final chrome = StoreChrome.forStore(ref.watch(selectedStoreTabProvider));

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        AppBackBinding.instance.handleBack();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: const SystemUiOverlayStyle(
          systemNavigationBarColor: Colors.transparent,
          systemNavigationBarDividerColor: Colors.transparent,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          extendBody: true,
          backgroundColor: const Color(0xFFF4F5F7),
          body: OfflineBannerHost(
            child: Stack(
              children: [
                Column(
                  children: [
                    MobileHeader(
                      key: ValueKey(widget.navigationShell.currentIndex),
                      isHomeTab: widget.navigationShell.currentIndex == 0 ||
                          widget.navigationShell.currentIndex == 1,
                    ),
                    Expanded(child: widget.navigationShell),
                  ],
                ),
                if (!hideBottomNav)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: FlipkartBottomNav(
                      currentIndex: visualIndex,
                      items: _tabs,
                      cartBadgeCount: cartCount,
                      accountInitial: accountInitial,
                      activeColor: chrome.accent,
                      activeBackground: chrome.activeNavBg,
                      onTap: _onTap,
                    ),
                  ),
                if (widget.navigationShell.currentIndex == 0)
                  const Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: SizedBox.shrink(),
                  ),
                const _ShellSideEffects(),
                const WishlistToast(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Side-effect listeners isolated so cart/auth updates don't rebuild the shell tree.
class _ShellSideEffects extends ConsumerWidget {
  const _ShellSideEffects();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.isLoggedIn != true && next.isLoggedIn) {
        unawaited(bootstrapUserSession(ref));
      }
    });

    return const SizedBox.shrink();
  }
}
