import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../config/theme.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/order_utils.dart';
import '../../../models/order.dart';
import '../../../routes/app_router.dart';
import '../../../widgets/common/product_3d_image.dart';
import '../delivery_rating_controller.dart';

const _actionGreen = Color(0xFF2E7D32);

class BlinkitOrderCard extends ConsumerWidget {
  const BlinkitOrderCard({super.key, required this.order});

  final Order order;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final deliveryRating = ref.watch(deliveryRatingProvider(order.id));
    final isDelivered = order.status == 'delivered';
    final productId = getPrimaryProductId(order);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEEEEE)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          InkWell(
            onTap: () => context.push('/orders/${order.id}'),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 10, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _OrderHeader(
                    order: order,
                    onMenuTap: () => _showOrderMenu(context, order, productId),
                  ),
                  const SizedBox(height: 12),
                  _ProductThumbnailRow(items: order.items),
                  if (isDelivered && deliveryRating != null) ...[
                    const SizedBox(height: 12),
                    _DeliveryRatingRow(rating: deliveryRating),
                  ],
                ],
              ),
            ),
          ),
          const Divider(height: 1, thickness: 1, color: Color(0xFFEEEEEE)),
          _OrderFooter(
            order: order,
            isDelivered: isDelivered,
            hasRating: deliveryRating != null,
            onRate: () => _showRatingSheet(context, ref, order.id),
            onDownloadInvoice: () => context.push('/orders/${order.id}/invoice'),
            onReorder: () => _handleOrderAgain(context, order, productId),
          ),
        ],
      ),
    );
  }

  void _handleOrderAgain(BuildContext context, Order order, String? productId) {
    if (order.items.length > 1) {
      context.push('/orders/${order.id}');
      return;
    }
    if (productId != null) {
      context.push('/product/$productId');
      return;
    }
    context.push('/orders/${order.id}');
  }

  void _showRatingSheet(BuildContext context, WidgetRef ref, String orderId) {
    var selected = 5;
    final rootContext = rootNavigatorKey.currentContext ?? context;
    showModalBottomSheet<void>(
      context: rootContext,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Rate your delivery experience',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      final star = index + 1;
                      return IconButton(
                        onPressed: () => setState(() => selected = star),
                        icon: Icon(
                          star <= selected ? Icons.star_rounded : Icons.star_outline_rounded,
                          color: Colors.amber.shade700,
                          size: 34,
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      await ref
                          .read(deliveryRatingsProvider.notifier)
                          .setRating(orderId, selected);
                      if (sheetContext.mounted) Navigator.pop(sheetContext);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: _actionGreen,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Submit rating', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showOrderMenu(BuildContext context, Order order, String? productId) {
    final rootContext = rootNavigatorKey.currentContext ?? context;
    showDialog<void>(
      context: rootContext,
      builder: (dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.receipt_long_outlined),
                title: const Text('View order details'),
                onTap: () {
                  Navigator.pop(dialogContext);
                  context.push('/orders/${order.id}');
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.description_outlined),
                title: const Text('Download invoice'),
                onTap: () {
                  Navigator.pop(dialogContext);
                  context.push('/orders/${order.id}/invoice');
                },
              ),
              if (productId != null) ...[
                const Divider(height: 1),
                ListTile(
                  leading: const Icon(Icons.shopping_bag_outlined),
                  title: const Text('Reorder'),
                  onTap: () {
                    Navigator.pop(dialogContext);
                    context.push('/product/$productId');
                  },
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _OrderHeader extends StatelessWidget {
  const _OrderHeader({required this.order, required this.onMenuTap});

  final Order order;
  final VoidCallback onMenuTap;

  @override
  Widget build(BuildContext context) {
    final isDelivered = order.status == 'delivered';
    final statusTitle = isDelivered ? 'Order delivered' : getBlinkitStatusLabel(order.status);
    final priceAndDate = '${formatInr(order.total, withDecimals: false)} • ${formatOrderHistoryDateTime(order.createdAt)}';

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: isDelivered ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            isDelivered ? Icons.check_rounded : Icons.local_shipping_outlined,
            size: 22,
            color: isDelivered ? const Color(0xFF2E7D32) : Colors.orange.shade800,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                statusTitle,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  height: 1.2,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                priceAndDate,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onMenuTap,
            borderRadius: BorderRadius.circular(20),
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(
                Icons.more_vert,
                size: 20,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ProductThumbnailRow extends StatelessWidget {
  const _ProductThumbnailRow({required this.items});

  final List<OrderItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 60,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        cacheExtent: 120,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final item = items[index];
          return Container(
            width: 58,
            height: 58,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF7F8FA),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFEEEEEE)),
            ),
            child: Product3DImage(imageUrl: item.image, size: 50),
          );
        },
      ),
    );
  }
}

class _DeliveryRatingRow extends StatelessWidget {
  const _DeliveryRatingRow({required this.rating});

  final int rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Text(
          'Your rating:',
          style: TextStyle(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(width: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(5, (index) {
            return Icon(
              index < rating ? Icons.star_rounded : Icons.star_outline_rounded,
              size: 16,
              color: Colors.amber.shade700,
            );
          }),
        ),
      ],
    );
  }
}

class _OrderFooter extends StatelessWidget {
  const _OrderFooter({
    required this.order,
    required this.isDelivered,
    required this.hasRating,
    required this.onRate,
    required this.onDownloadInvoice,
    required this.onReorder,
  });

  final Order order;
  final bool isDelivered;
  final bool hasRating;
  final VoidCallback onRate;
  final VoidCallback onDownloadInvoice;
  final VoidCallback onReorder;

  @override
  Widget build(BuildContext context) {
    final secondVal = order.createdAt?.second ?? 0;
    final leftLabel = (secondVal % 2 == 0) ? 'Reorder' : 'Download invoice';
    final leftAction = (leftLabel == 'Reorder') ? onReorder : onDownloadInvoice;

    return SizedBox(
      height: 48,
      child: Row(
        children: [
          Expanded(
            child: _FooterActionButton(
              label: leftLabel,
              onTap: leftAction,
            ),
          ),
          const SizedBox(
            height: 24,
            child: VerticalDivider(width: 1, thickness: 1, color: Color(0xFFEEEEEE)),
          ),
          Expanded(
            child: _FooterActionButton(
              label: 'Rate order',
              onTap: onRate,
            ),
          ),
        ],
      ),
    );
  }
}

class _FooterActionButton extends StatelessWidget {
  const _FooterActionButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Center(
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: _actionGreen,
            ),
          ),
        ),
      ),
    );
  }
}
