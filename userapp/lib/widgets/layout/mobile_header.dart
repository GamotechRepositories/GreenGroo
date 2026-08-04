import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/utils/product_search.dart';
import '../../features/auth/auth_controller.dart';
import '../../features/home/home_providers.dart';
import '../../features/wishlist/wishlist_controller.dart';
import '../../models/category.dart';
import '../../routes/route_paths.dart';
import '../common/app_logo.dart';
import '../common/fly_target_anchor.dart';
import '../common/nav_icon_locator.dart';
import 'mobile_search_bar.dart';

class MobileHeader extends ConsumerStatefulWidget {
  const MobileHeader({
    super.key,
    this.isHomeTab = false,
  });

  final bool isHomeTab;

  @override
  ConsumerState<MobileHeader> createState() => _MobileHeaderState();
}

class _MobileHeaderState extends ConsumerState<MobileHeader> {
  static const _homeBottomRadius = 22.0;

  final _searchFocusNode = FocusNode();
  bool _searchOpen = false;

  void _openMenu() {
    if (_searchOpen) {
      setState(() => _searchOpen = false);
      _searchFocusNode.unfocus();
    }
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Menu',
      barrierColor: Colors.black54,
      pageBuilder: (context, animation, secondaryAnimation) {
        return Align(
          alignment: Alignment.centerLeft,
          child: _MobileMenuDrawer(
            onClose: () => Navigator.of(context).pop(),
          ),
        );
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(-1, 0),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOut)),
          child: child,
        );
      },
    );
  }

  void _toggleSearch() {
    setState(() => _searchOpen = !_searchOpen);
    if (_searchOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _searchFocusNode.requestFocus();
      });
    } else {
      _searchFocusNode.unfocus();
    }
  }

  void _closeSearch() {
    if (!_searchOpen) return;
    setState(() => _searchOpen = false);
    _searchFocusNode.unfocus();
  }

  @override
  void dispose() {
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    final wishlistCount = ref.watch(
      wishlistControllerProvider.select((s) => s.items.length),
    );
    final roundedHomeBottom = widget.isHomeTab && !_searchOpen;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppTheme.storefrontHeaderOverlay,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: roundedHomeBottom
                ? const BorderRadius.only(
                    bottomLeft: Radius.circular(_homeBottomRadius),
                    bottomRight: Radius.circular(_homeBottomRadius),
                  )
                : BorderRadius.zero,
            child: DecoratedBox(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.headerPrimary,
                    AppColors.headerPrimaryLight,
                  ],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Padding(
                padding: EdgeInsets.only(top: topInset),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(12, 6, 12, _searchOpen ? 8 : 10),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          _HeaderIconButton(
                            icon: Icons.menu_rounded,
                            onPressed: _openMenu,
                            light: true,
                          ),
                          const Expanded(
                            child: Center(
                              child: AppLogo(height: 42),
                            ),
                          ),
                          _HeaderIconButton(
                            icon: Icons.search_rounded,
                            onPressed: _toggleSearch,
                            light: true,
                            active: _searchOpen,
                          ),
                          const SizedBox(width: 4),
                          FlyTargetAnchor(
                            onReport: NavIconLocator.reportWishlist,
                            onClear: NavIconLocator.clearWishlist,
                            child: _HeaderIconButton(
                              icon: Icons.favorite_border_rounded,
                              onPressed: () => context.push(RoutePaths.wishlist),
                              light: true,
                              badgeCount: wishlistCount,
                            ),
                          ),
                        ],
                      ),
                      if (_searchOpen) ...[
                        const SizedBox(height: 10),
                        MobileSearchBar(
                          focusNode: _searchFocusNode,
                          autoFocus: true,
                          onSubmitted: _closeSearch,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    super.key,
    this.icon,
    this.child,
    required this.onPressed,
    this.light = false,
    this.active = false,
    this.badgeCount = 0,
  }) : assert(icon != null || child != null);

  final IconData? icon;
  final Widget? child;
  final VoidCallback onPressed;
  final bool light;
  final bool active;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: light
          ? (active
              ? Colors.white.withValues(alpha: 0.45)
              : Colors.white.withValues(alpha: 0.28))
          : const Color(0xFFF5F5F5),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onPressed,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 40,
          height: 40,
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              child ??
                  Icon(
                    icon,
                    size: 22,
                    color: light
                        ? (active ? Colors.white : Colors.white)
                        : AppColors.textPrimary,
                  ),
              if (badgeCount > 0)
                Positioned(
                  right: 0,
                  top: 0,
                  child: _HeaderBadge(count: badgeCount),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeaderBadge extends StatelessWidget {
  const _HeaderBadge({required this.count});

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

class _MobileMenuDrawer extends ConsumerWidget {
  const _MobileMenuDrawer({
    required this.onClose,
  });

  final VoidCallback onClose;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesProvider);
    final categories = categoriesAsync.value ?? const <Category>[];
    final isLoggedIn = ref.watch(
      authControllerProvider.select((s) => s.isLoggedIn),
    );
    final userName = ref.watch(
      authControllerProvider.select((s) => s.user?.name ?? ''),
    );
    final userContact = ref.watch(
      authControllerProvider.select((s) => s.user?.contactLabel ?? ''),
    );
    final width = MediaQuery.sizeOf(context).width * 0.82;

    // Full-screen routes on the root navigator — push so system back can pop.
    const rootOverlayPaths = <String>{
      RoutePaths.wishlist,
      RoutePaths.support,
      RoutePaths.about,
      RoutePaths.contact,
      RoutePaths.blog,
      RoutePaths.privacyPolicy,
      RoutePaths.terms,
      RoutePaths.shippingDetails,
      RoutePaths.justArrived,
      RoutePaths.hotSelling,
      RoutePaths.checkout,
      RoutePaths.coupons,
    };

    void navigate(String path, {bool requiresAuth = false}) {
      if (requiresAuth && !isLoggedIn) {
        onClose();
        ref.read(authControllerProvider.notifier).openAuthModal();
        return;
      }
      onClose();
      if (rootOverlayPaths.contains(path)) {
        context.push(path);
      } else {
        context.go(path);
      }
    }

    return Material(
      color: Colors.white,
      child: SizedBox(
        width: width.clamp(0, 320),
        height: double.infinity,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const AppLogo(height: 36),
                    const Spacer(),
                    IconButton(
                      onPressed: onClose,
                      icon: const Icon(Icons.close_rounded),
                    ),
                  ],
                ),
              ),
              if (!isLoggedIn)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: FilledButton(
                    onPressed: () {
                      onClose();
                      ref.read(authControllerProvider.notifier).openAuthModal();
                    },
                    child: const Text('Login / Register'),
                  ),
                )
              else
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : '?',
                        style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    title: Text(
                      userName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(userContact),
                  ),
                ),
              const Divider(height: 24),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  itemCount: _menuItemCount(categories.length, isLoggedIn),
                  itemBuilder: (context, index) => _buildMenuItem(
                    context,
                    index,
                    categories,
                    isLoggedIn,
                    navigate,
                    onClose,
                    ref,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

int _menuItemCount(int categoryCount, bool isLoggedIn) {
  var count = 7 + categoryCount;
  if (isLoggedIn) count += 2;
  return count;
}

Widget _buildMenuItem(
  BuildContext context,
  int index,
  List<Category> categories,
  bool isLoggedIn,
  void Function(String path, {bool requiresAuth}) navigate,
  VoidCallback onClose,
  WidgetRef ref,
) {
  const fixedMenus = <({IconData icon, String label, String path, bool auth})>[
    (icon: Icons.home_outlined, label: 'Home', path: RoutePaths.home, auth: false),
    (icon: Icons.grid_view_rounded, label: 'All Products', path: RoutePaths.product, auth: false),
    (icon: Icons.favorite_border, label: 'Wishlist', path: RoutePaths.wishlist, auth: true),
    (icon: Icons.receipt_long_outlined, label: 'My Orders', path: RoutePaths.orders, auth: true),
    (icon: Icons.person_outline, label: 'Account', path: RoutePaths.profile, auth: false),
    (icon: Icons.support_agent_outlined, label: 'Support', path: RoutePaths.support, auth: false),
  ];

  if (index < fixedMenus.length) {
    final item = fixedMenus[index];
    return _MenuTile(
      icon: item.icon,
      label: item.label,
      onTap: () => navigate(item.path, requiresAuth: item.auth),
    );
  }

  if (index == fixedMenus.length) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        'CATEGORIES',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.textMuted,
          letterSpacing: 1,
        ),
      ),
    );
  }

  final categoryIndex = index - fixedMenus.length - 1;
  if (categoryIndex < categories.length) {
    final category = categories[categoryIndex];
    return _MenuTile(
      label: category.categoryName,
      onTap: () {
        onClose();
        context.go(
          ProductSearch.buildPath(categoryName: category.categoryName),
        );
      },
    );
  }

  if (!isLoggedIn) return const SizedBox.shrink();

  final logoutStart = fixedMenus.length + 1 + categories.length;
  if (index == logoutStart) return const Divider();
  return _MenuTile(
    icon: Icons.logout_rounded,
    label: 'Logout',
    onTap: () {
      onClose();
      ref.read(authControllerProvider.notifier).logout();
    },
  );
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.label,
    required this.onTap,
    this.icon,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      leading: icon != null
          ? Icon(icon, size: 20, color: AppColors.textSecondary)
          : null,
      title: Text(label),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }
}
