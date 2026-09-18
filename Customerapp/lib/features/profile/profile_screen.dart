import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/app_info.dart';
import '../../config/theme.dart';
import '../../core/providers/app_providers.dart';
import '../../core/providers/package_info_provider.dart';
import '../../core/scroll/app_scroll_config.dart';
import '../../core/scroll/tab_scroll_registry.dart';
import '../../core/utils/address_utils.dart';
import '../../core/utils/website_share.dart';
import '../../features/address/address_controller.dart';
import '../../features/auth/auth_controller.dart';
import '../../models/address.dart';
import '../../models/order.dart';
import '../../models/user.dart';
import '../../routes/route_paths.dart';
import '../../widgets/address/address_form.dart';
import '../../widgets/common/refreshable_body.dart';
import '../../widgets/common/skeleton_loaders.dart';
import '../../widgets/layout/shell_bottom_insets.dart';
import '../../widgets/product/buy_again_card.dart';
import 'profile_recent_items.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late final TabScrollRegistry _tabScrollRegistry;
  final _scrollController = ScrollController();
  final _addressesSectionKey = GlobalKey();
  final _addressPageController = PageController();

  bool _showAddressForm = false;
  Address? _editingAddress;
  bool _savingAddress = false;
  String? _formError;
  int _addressPage = 0;
  List<OrderItem> _recentItems = [];
  bool _recentItemsLoading = false;

  @override
  void initState() {
    super.initState();
    _tabScrollRegistry = ref.read(tabScrollRegistryProvider);
    Future.microtask(_loadRecentItems);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _tabScrollRegistry.register(ShellTabIndex.account, _scrollController);
    });
  }

  @override
  void dispose() {
    _tabScrollRegistry.unregister(ShellTabIndex.account, _scrollController);
    _scrollController.dispose();
    _addressPageController.dispose();
    super.dispose();
  }

  Future<void> _loadRecentItems() async {
    if (!ref.read(authControllerProvider).isLoggedIn) return;

    setState(() => _recentItemsLoading = true);
    try {
      final orders = await ref.read(apiServiceProvider).fetchMyOrders();
      if (!mounted) return;
      setState(() {
        _recentItems = extractRecentOrderItems(orders);
        _recentItemsLoading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _recentItems = [];
          _recentItemsLoading = false;
        });
      }
    }
  }

  Future<void> _refreshProfile() async {
    await Future.wait([
      ref.read(addressControllerProvider.notifier).loadAddresses(),
      _loadRecentItems(),
    ]);
  }

  void _scrollToAddresses() {
    final context = _addressesSectionKey.currentContext;
    if (context != null) {
      Scrollable.ensureVisible(
        context,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _handleSaveAddress(Map<String, String> form) async {
    setState(() {
      _savingAddress = true;
      _formError = null;
    });

    final error = await ref.read(addressControllerProvider.notifier).saveAddress(
          form,
          editing: _editingAddress,
          makeDefault: _editingAddress == null &&
              ref.read(addressControllerProvider).addresses.isEmpty,
        );

    if (!mounted) return;

    setState(() {
      _savingAddress = false;
      if (error == null) {
        _showAddressForm = false;
        _editingAddress = null;
      } else {
        _formError = error;
      }
    });
  }

  Future<void> _handleDeleteAddress(Address address) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Remove address?'),
        content: const Text('This address will be removed from your saved list.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    final error =
        await ref.read(addressControllerProvider.notifier).deleteAddress(address.id);
    if (error != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error)));
    }
  }

  Future<void> _editProfileField({
    required String title,
    required String fieldKey,
    required String initialValue,
    TextInputType keyboardType = TextInputType.text,
  }) async {
    final controller = TextEditingController(text: initialValue);
    final result = await showDialog<String?>(
      context: context,
      builder: (context) {
        String? localError;
        return StatefulBuilder(
          builder: (context, setLocalState) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text('Edit $title', style: const TextStyle(fontWeight: FontWeight.bold)),
            content: TextField(
              controller: controller,
              keyboardType: keyboardType,
              autofocus: true,
              decoration: InputDecoration(
                labelText: title,
                hintText: 'Enter your $title',
                errorText: localError,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () {
                  final value = controller.text.trim();
                  if (value.isEmpty) {
                    setLocalState(() => localError = '$title is required');
                    return;
                  }
                  Navigator.pop(context, value);
                },
                child: const Text('Save'),
              ),
            ],
          ),
        );
      },
    );

    if (result == null || !mounted) return;

    final updateError = await ref.read(authControllerProvider.notifier).updateProfile({
      fieldKey: result,
    });

    if (!mounted) return;
    if (updateError != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(updateError)));
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Log out of GreenGroo?'),
        content: const Text('You will need to sign in again to access your account, orders, and saved addresses.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      ref.read(authControllerProvider.notifier).logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = ref.watch(authControllerProvider.select((s) => s.isLoggedIn));
    final user = ref.watch(authControllerProvider.select((s) => s.user));
    final addresses = ref.watch(addressControllerProvider.select((s) => s.addresses));
    final addressesLoading =
        ref.watch(addressControllerProvider.select((s) => s.loading));

    if (!isLoggedIn) {
      return RefreshableBody(
        onRefresh: _refreshProfile,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: AppColors.headerFadeBg,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
                  ),
                  child: const Icon(Icons.account_circle_outlined, size: 54, color: AppColors.primary),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Account Access Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in to manage your account details, view orders, saved addresses & quick checkout.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () => ref.read(authControllerProvider.notifier).openAuthModal(),
                    icon: const Icon(Icons.login_rounded),
                    label: const Text('Login / Sign Up', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (user == null) {
      return RefreshableBody(
        onRefresh: _refreshProfile,
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    final topInset = MediaQuery.paddingOf(context).top;
    final topPadding = topInset > 0 ? topInset + 16 : 24.0;

    return RefreshIndicator(
      onRefresh: _refreshProfile,
      child: ListView(
        controller: _scrollController,
        physics: AppScrollConfig.listPhysics,
        cacheExtent: AppScrollConfig.cacheExtent,
        padding: ShellBottomInsets.listPadding(context, top: topPadding),
        children: [
          Row(
            children: [
              const Text(
                'My Account',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _ProfileHeaderCard(
            user: user,
            onEditName: () => _editProfileField(
              title: 'Name',
              fieldKey: 'name',
              initialValue: user.name,
            ),
            onEditEmail: () => _editProfileField(
              title: 'Email',
              fieldKey: 'email',
              initialValue: user.email,
              keyboardType: TextInputType.emailAddress,
            ),
            onEditPhone: () => _editProfileField(
              title: 'Phone Number',
              fieldKey: 'phone',
              initialValue: user.phone,
              keyboardType: TextInputType.phone,
            ),
          ),
          const SizedBox(height: 16),
          _QuickActionsGrid(
            onAddresses: _scrollToAddresses,
            onOrders: () => context.go(RoutePaths.orders),
            onWishlist: () => context.push(RoutePaths.wishlist),
            onNotifications: () => context.push(RoutePaths.notifications),
            onSupport: () => context.push(RoutePaths.support),
          ),
          if (_recentItemsLoading || _recentItems.isNotEmpty) ...[
            const SizedBox(height: 20),
            _RecentOrderItemsSection(
              items: _recentItems,
              loading: _recentItemsLoading,
            ),
          ],
          const SizedBox(height: 20),
          _SavedAddressesSection(
            sectionKey: _addressesSectionKey,
            addresses: addresses,
            loading: addressesLoading,
            showForm: _showAddressForm,
            editingAddress: _editingAddress,
            savingAddress: _savingAddress,
            formError: _formError,
            pageController: _addressPageController,
            currentPage: _addressPage,
            onPageChanged: (index) => setState(() => _addressPage = index),
            onAddAddress: () => setState(() {
              _editingAddress = null;
              _showAddressForm = true;
              _formError = null;
            }),
            onCancelForm: () => setState(() {
              _showAddressForm = false;
              _editingAddress = null;
              _formError = null;
            }),
            onSubmitForm: _handleSaveAddress,
            onEditAddress: (address) => setState(() {
              _editingAddress = address;
              _showAddressForm = true;
              _formError = null;
            }),
            onDeleteAddress: _handleDeleteAddress,
          ),
          const SizedBox(height: 20),
          _MenuSection(
            onSupport: () => context.push(RoutePaths.support),
            onPrivacy: () => context.push(RoutePaths.privacyPolicy),
            onTerms: () => context.push(RoutePaths.terms),
            onContact: () => context.push(RoutePaths.contact),
            onAbout: () => context.push(RoutePaths.about),
            onShare: () async {
              final messenger = ScaffoldMessenger.of(context);
              try {
                await shareWebsite();
              } catch (_) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Could not share website. Try again.')),
                );
              }
            },
          ),
          const SizedBox(height: 20),
          _LogoutButton(onTap: _handleLogout),
          const SizedBox(height: 16),
          Center(
            child: ref.watch(packageInfoProvider).when(
                  loading: () => Text(
                    '${AppInfo.name} v${AppInfo.version}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  error: (_, _) => Text(
                    '${AppInfo.name} v${AppInfo.version}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                  ),
                  data: (info) => Text(
                    '${AppInfo.name} v${info.version}',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}

class _ProfileHeaderCard extends StatelessWidget {
  const _ProfileHeaderCard({
    required this.user,
    required this.onEditName,
    required this.onEditEmail,
    required this.onEditPhone,
  });

  final User user;
  final VoidCallback onEditName;
  final VoidCallback onEditEmail;
  final VoidCallback onEditPhone;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.headerSearchBg,
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.2), width: 2),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      profileInitials(user.name),
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 22,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: InkWell(
                      onTap: onEditName,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.edit_rounded, size: 10, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            user.name.isNotEmpty ? user.name : 'Valued Customer',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        IconButton(
                          onPressed: onEditName,
                          icon: const Icon(Icons.edit_outlined, size: 18, color: AppColors.textMuted),
                          constraints: const BoxConstraints(),
                          padding: const EdgeInsets.all(4),
                          tooltip: 'Edit Name',
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.headerSearchBg,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.verified_rounded, size: 12, color: AppColors.primary),
                          SizedBox(width: 4),
                          Text(
                            'Verified Account',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 12),
          _ProfileDetailTile(
            icon: Icons.phone_android_rounded,
            label: 'Registered Phone Number',
            value: user.phone.isNotEmpty ? user.phone : 'Not provided',
            onEdit: onEditPhone,
          ),
          const SizedBox(height: 8),
          _ProfileDetailTile(
            icon: Icons.email_outlined,
            label: 'Email Address',
            value: user.email.isNotEmpty ? user.email : 'Not provided',
            onEdit: onEditEmail,
          ),
        ],
      ),
    );
  }
}

class _ProfileDetailTile extends StatelessWidget {
  const _ProfileDetailTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onEdit,
  });

  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(
            color: AppColors.headerFadeBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: AppColors.primary),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        TextButton(
          onPressed: onEdit,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
          ),
          child: const Text('Change', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }
}

class _QuickActionsGrid extends StatelessWidget {
  const _QuickActionsGrid({
    required this.onAddresses,
    required this.onOrders,
    required this.onWishlist,
    required this.onNotifications,
    required this.onSupport,
  });

  final VoidCallback onAddresses;
  final VoidCallback onOrders;
  final VoidCallback onWishlist;
  final VoidCallback onNotifications;
  final VoidCallback onSupport;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _QuickActionTile(
          icon: Icons.shopping_bag_outlined,
          label: 'My Orders',
          onTap: onOrders,
        ),
        const SizedBox(width: 10),
        _QuickActionTile(
          icon: Icons.location_on_outlined,
          label: 'Addresses',
          onTap: onAddresses,
        ),
        const SizedBox(width: 10),
        _QuickActionTile(
          icon: Icons.favorite_border_rounded,
          label: 'Wishlist',
          onTap: onWishlist,
        ),
        const SizedBox(width: 10),
        _QuickActionTile(
          icon: Icons.headset_mic_outlined,
          label: 'Help & FAQ',
          onTap: onSupport,
        ),
      ],
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  const _QuickActionTile({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.headerFadeBg,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: AppColors.primary, size: 20),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RecentOrderItemsSection extends StatelessWidget {
  const _RecentOrderItemsSection({
    required this.items,
    required this.loading,
  });

  final List<OrderItem> items;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Buy Again',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 2),
        const Text(
          'Items from your recent orders',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 12),
        if (loading)
          SizedBox(
            height: 148,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 4,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, _) => Container(
                width: 112,
                decoration: BoxDecoration(
                  color: AppColors.mobileSurface,
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          )
        else
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (context, index) => BuyAgainCard(item: items[index]),
            ),
          ),
      ],
    );
  }
}

class _SavedAddressesSection extends StatelessWidget {
  const _SavedAddressesSection({
    required this.sectionKey,
    required this.addresses,
    required this.loading,
    required this.showForm,
    required this.editingAddress,
    required this.savingAddress,
    required this.formError,
    required this.pageController,
    required this.currentPage,
    required this.onPageChanged,
    required this.onAddAddress,
    required this.onCancelForm,
    required this.onSubmitForm,
    required this.onEditAddress,
    required this.onDeleteAddress,
  });

  final Key sectionKey;
  final List<Address> addresses;
  final bool loading;
  final bool showForm;
  final Address? editingAddress;
  final bool savingAddress;
  final String? formError;
  final PageController pageController;
  final int currentPage;
  final ValueChanged<int> onPageChanged;
  final VoidCallback onAddAddress;
  final VoidCallback onCancelForm;
  final Future<void> Function(Map<String, String> form) onSubmitForm;
  final ValueChanged<Address> onEditAddress;
  final ValueChanged<Address> onDeleteAddress;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: sectionKey,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Saved Addresses',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            if (!showForm)
              OutlinedButton.icon(
                onPressed: onAddAddress,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: const BorderSide(color: AppColors.primary),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                icon: const Icon(Icons.add_rounded, size: 16),
                label: const Text('Add New', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ),
          ],
        ),
        if (formError != null && !showForm) ...[
          const SizedBox(height: 6),
          Text(formError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
        ],
        const SizedBox(height: 10),
        if (showForm) ...[
          AddressForm(
            plain: true,
            initial: editingAddress != null ? mapAddressToForm(editingAddress!) : null,
            submitting: savingAddress,
            onCancel: onCancelForm,
            onSubmit: onSubmitForm,
          ),
          if (formError != null) ...[
            const SizedBox(height: 8),
            Text(formError!, style: TextStyle(color: Colors.red.shade700, fontSize: 13)),
          ],
        ] else if (loading)
          const SkeletonAddressList()
        else if (addresses.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderLight),
            ),
            child: Column(
              children: [
                const Icon(Icons.location_off_outlined, size: 40, color: AppColors.textMuted),
                const SizedBox(height: 8),
                const Text(
                  'No saved addresses yet',
                  style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Add your delivery location for faster checkout',
                  style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: onAddAddress,
                  icon: const Icon(Icons.add_location_alt_outlined, size: 18),
                  label: const Text('Add Delivery Address'),
                ),
              ],
            ),
          )
        else ...[
          SizedBox(
            height: 195,
            child: PageView.builder(
              controller: pageController,
              itemCount: addresses.length,
              onPageChanged: onPageChanged,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 2),
                  child: _AddressCard(
                    address: addresses[index],
                    onEdit: () => onEditAddress(addresses[index]),
                    onDelete: () => onDeleteAddress(addresses[index]),
                  ),
                );
              },
            ),
          ),
          if (addresses.length > 1) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                addresses.length,
                (index) => Container(
                  width: index == currentPage ? 16 : 6,
                  height: 6,
                  margin: const EdgeInsets.symmetric(horizontal: 3),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(3),
                    color: index == currentPage
                        ? AppColors.primary
                        : AppColors.borderLight,
                  ),
                ),
              ),
            ),
          ],
        ],
      ],
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({
    required this.address,
    required this.onEdit,
    required this.onDelete,
  });

  final Address address;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: AppColors.headerSearchBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.home_outlined, size: 18, color: AppColors.primary),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        getAddressFullName(address),
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (address.isDefault) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'DEFAULT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF15803D),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert_rounded, size: 20, color: AppColors.textMuted),
                onSelected: (value) {
                  if (value == 'edit') onEdit();
                  if (value == 'delete') onDelete();
                },
                itemBuilder: (context) => const [
                  PopupMenuItem(value: 'edit', child: Text('Edit')),
                  PopupMenuItem(value: 'delete', child: Text('Remove', style: TextStyle(color: Colors.red))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: Text(
              formatAddressLine(address),
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const Divider(height: 12),
          Row(
            children: [
              const Icon(Icons.phone_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text(
                address.number.startsWith('+91') ? address.number : '+91 ${address.number}',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
              ),
              const Spacer(),
              InkWell(
                onTap: onEdit,
                child: const Text('Edit', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
              ),
              const SizedBox(width: 12),
              InkWell(
                onTap: onDelete,
                child: const Text('Remove', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  const _MenuSection({
    required this.onSupport,
    required this.onPrivacy,
    required this.onTerms,
    required this.onContact,
    required this.onAbout,
    required this.onShare,
  });

  final VoidCallback onSupport;
  final VoidCallback onPrivacy;
  final VoidCallback onTerms;
  final VoidCallback onContact;
  final VoidCallback onAbout;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Support & Legal',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.borderLight),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              _MenuItem(
                icon: Icons.help_outline_rounded,
                title: 'Help & Support / FAQs',
                onTap: onSupport,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.privacy_tip_outlined,
                title: 'Privacy Policy',
                onTap: onPrivacy,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.article_outlined,
                title: 'Terms & Conditions',
                onTap: onTerms,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.contact_support_outlined,
                title: 'Contact Us',
                onTap: onContact,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.info_outline_rounded,
                title: 'About GreenGroo',
                onTap: onAbout,
              ),
              const Divider(height: 1, indent: 50, endIndent: 16),
              _MenuItem(
                icon: Icons.share_outlined,
                title: 'Share App / Website',
                onTap: onShare,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Icon(icon, color: AppColors.primary, size: 22),
      title: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.textPrimary),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, size: 20, color: AppColors.textMuted),
      onTap: onTap,
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFEF2F2),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFFECACA)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.logout_rounded, color: Colors.red, size: 20),
              SizedBox(width: 8),
              Text(
                'Log Out',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
