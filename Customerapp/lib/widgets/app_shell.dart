import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:customer_app/core/bootstrap/app_bootstrap.dart';
import 'package:customer_app/core/scroll/tab_scroll_registry.dart';
import 'package:customer_app/features/auth/auth_controller.dart';
import 'package:customer_app/features/cart/cart_controller.dart';
import 'package:customer_app/routes/route_paths.dart';
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
      label: 'Categories',
      icon: Icons.widgets_outlined,
      activeIcon: Icons.widgets_rounded,
      assetIcon: 'assets/images/categoriesIcon (1).png',
    ),
    FlipkartNavItem(
      label: 'Orders',
      icon: Icons.receipt_long_outlined,
      activeIcon: Icons.receipt_long_rounded,
      assetIcon: 'assets/images/orderAgainIcon.png',
    ),
    FlipkartNavItem(
      label: 'Cart',
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart_rounded,
      showBadge: true,
    ),
    FlipkartNavItem(
      label: 'Account',
      icon: Icons.account_circle_outlined,
      activeIcon: Icons.account_circle_rounded,
      assetIcon: 'assets/images/profileIcon.png',
    ),
  ];

  static const _authRequiredIndices = {2};

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

  Future<void> _onTap(int index) async {
    final auth = ref.read(authControllerProvider);

    if (_authRequiredIndices.contains(index) && !auth.isLoggedIn) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      return;
    }

    final isCurrentTab = index == widget.navigationShell.currentIndex;

    if (isCurrentTab) {
      await ref.read(tabScrollRegistryProvider).scrollToTop(index);
      widget.navigationShell.goBranch(index, initialLocation: true);
      return;
    }

    widget.navigationShell.goBranch(index, initialLocation: false);
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

    final currentRoute = GoRouterState.of(context).uri.path;
    final isKeyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final isProductRoute = currentRoute == RoutePaths.product;
    final hideBottomNav = isKeyboardOpen || isProductRoute;

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
                      currentIndex: widget.navigationShell.currentIndex,
                      items: _tabs,
                      cartBadgeCount: cartCount,
                      accountInitial: accountInitial,
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
