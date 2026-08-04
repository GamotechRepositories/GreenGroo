import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../core/exceptions/api_exception.dart';
import '../../core/providers/app_providers.dart';
import '../../core/utils/cart_utils.dart';
import '../../core/utils/currency_formatter.dart';
import '../../models/coupon.dart';
import '../../routes/route_paths.dart';
import '../auth/auth_controller.dart';
import '../cart/cart_controller.dart';

class CouponsScreen extends ConsumerStatefulWidget {
  const CouponsScreen({super.key});

  @override
  ConsumerState<CouponsScreen> createState() => _CouponsScreenState();
}

class _CouponsScreenState extends ConsumerState<CouponsScreen> {
  final _codeController = TextEditingController();

  List<Coupon> _coupons = const [];
  bool _loading = true;
  String _error = '';
  bool _showCodeInput = false;
  bool _applying = false;
  String _applyError = '';
  String? _applyingCode;
  String? _copiedCode;
  final Set<String> _expandedCodes = {};

  double get _subtotal =>
      calculateCartSummary(ref.read(cartControllerProvider).items).subtotal;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final cart = ref.read(cartControllerProvider);
      if (cart.items.isEmpty && !cart.loading) {
        ref.read(cartControllerProvider.notifier).loadCart(silent: true);
      }
      _loadCoupons();
    });
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _loadCoupons() async {
    setState(() {
      _loading = true;
      _error = '';
    });
    try {
      final coupons = await ref
          .read(apiServiceProvider)
          .fetchAvailableCoupons(subtotal: _subtotal);
      if (!mounted) return;
      setState(() {
        _coupons = coupons;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = apiErrorMessage(e, fallback: 'Failed to load coupons.');
        _loading = false;
      });
    }
  }

  Future<void> _applyCoupon(String code) async {
    final trimmed = code.trim().toUpperCase();
    if (trimmed.isEmpty || _applying) return;

    if (!ref.read(authControllerProvider).isLoggedIn) {
      ref.read(authControllerProvider.notifier).openAuthModal();
      return;
    }

    setState(() {
      _applying = true;
      _applyingCode = trimmed;
      _applyError = '';
    });

    try {
      await ref
          .read(apiServiceProvider)
          .validateCoupon(code: trimmed, subtotal: _subtotal);
      if (!mounted) return;
      setState(() {
        _applying = false;
        _applyingCode = null;
      });
      if (context.canPop()) {
        // Opened from checkout — return the code so it can apply it.
        context.pop(trimmed);
      } else {
        context.push('${RoutePaths.checkout}?coupon=$trimmed');
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _applying = false;
        _applyingCode = null;
        _applyError = apiErrorMessage(e, fallback: 'Failed to apply coupon.');
      });
    }
  }

  Future<void> _copyCode(String code) async {
    await Clipboard.setData(ClipboardData(text: code));
    if (!mounted) return;
    setState(() => _copiedCode = code);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted && _copiedCode == code) {
        setState(() => _copiedCode = null);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Rebuild when cart changes so unlock states stay accurate.
    ref.watch(cartControllerProvider.select((s) => s.items.length));

    return Scaffold(
      backgroundColor: AppColors.mobileSurface,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () =>
              context.canPop() ? context.pop() : context.go(RoutePaths.home),
        ),
        title: const Text('Coupons'),
        actions: [
          TextButton(
            onPressed: () =>
                setState(() => _showCodeInput = !_showCodeInput),
            child: const Text('Have a code?'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadCoupons,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_showCodeInput) ...[
              _buildCodeInput(),
              const SizedBox(height: 16),
            ],
            if (_applyError.isNotEmpty) ...[
              Text(
                _applyError,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
              const SizedBox(height: 12),
            ],
            const Text(
              'Featured Coupons',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 32),
                child: Column(
                  children: [
                    Text(
                      _error,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    OutlinedButton(
                      onPressed: _loadCoupons,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              )
            else if (_coupons.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: Center(
                  child: Text(
                    'No coupons available right now.\nCheck back soon!',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              ..._coupons.map(
                (coupon) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _CouponCard(
                    coupon: coupon,
                    copied: _copiedCode == coupon.code,
                    expanded: _expandedCodes.contains(coupon.code),
                    applying: _applying && _applyingCode == coupon.code,
                    onCopy: () => _copyCode(coupon.code),
                    onToggleExpand: () => setState(() {
                      if (!_expandedCodes.remove(coupon.code)) {
                        _expandedCodes.add(coupon.code);
                      }
                    }),
                    onAction: () {
                      if (coupon.redemptionBlocked.isNotEmpty) return;
                      if (coupon.unlocked) {
                        _applyCoupon(coupon.code);
                      } else {
                        context.go(RoutePaths.cart);
                      }
                    },
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCodeInput() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _codeController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(
                hintText: 'Enter coupon code',
                isDense: true,
              ),
              onSubmitted: _applyCoupon,
            ),
          ),
          const SizedBox(width: 10),
          FilledButton(
            onPressed:
                _applying ? null : () => _applyCoupon(_codeController.text),
            child: _applying && _applyingCode == null
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text('Apply'),
          ),
        ],
      ),
    );
  }
}

class _CouponCard extends StatelessWidget {
  const _CouponCard({
    required this.coupon,
    required this.copied,
    required this.expanded,
    required this.applying,
    required this.onCopy,
    required this.onToggleExpand,
    required this.onAction,
  });

  final Coupon coupon;
  final bool copied;
  final bool expanded;
  final bool applying;
  final VoidCallback onCopy;
  final VoidCallback onToggleExpand;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final blocked = coupon.redemptionBlocked.isNotEmpty;
    final unlocked = coupon.unlocked;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: unlocked ? Colors.green.shade200 : AppColors.borderLight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: unlocked ? Colors.green.shade50 : AppColors.mobileSurface,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.local_offer_outlined,
                  size: 20,
                  color: unlocked ? Colors.green.shade700 : AppColors.textMuted,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      coupon.headline,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      coupon.unlockMessage,
                      style: TextStyle(
                        fontSize: 12,
                        color: blocked
                            ? Colors.red.shade700
                            : unlocked
                                ? Colors.green.shade700
                                : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: unlocked
                      ? Colors.green.shade50
                      : AppColors.mobileSurface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  unlocked ? 'Unlocked' : 'Locked',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: unlocked
                        ? Colors.green.shade700
                        : AppColors.textMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.mobileSurface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppColors.borderLight,
                    style: BorderStyle.solid,
                  ),
                ),
                child: Text(
                  coupon.code,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                    fontSize: 13,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              TextButton.icon(
                onPressed: onCopy,
                icon: Icon(
                  copied ? Icons.check : Icons.copy_outlined,
                  size: 16,
                ),
                label: Text(copied ? 'Copied' : 'Copy'),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  visualDensity: VisualDensity.compact,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: onToggleExpand,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  visualDensity: VisualDensity.compact,
                ),
                child: Text(expanded ? 'Less' : 'Know more'),
              ),
            ],
          ),
          if (expanded) ...[
            const SizedBox(height: 8),
            if (coupon.validityLabel.isNotEmpty)
              _detailRow('Valid till', coupon.validityLabel),
            if (coupon.minOrderAmount > 0)
              _detailRow('Minimum order', formatInr(coupon.minOrderAmount)),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: blocked || applying ? null : onAction,
                child: applying
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(unlocked ? 'Apply at checkout' : 'View cart'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
