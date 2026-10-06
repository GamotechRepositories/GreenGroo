import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../config/theme.dart';
import '../../../widgets/common/app_network_image.dart';
import '../delivery_rating_controller.dart';
import 'order_feedback_repository.dart';

const _green = Color(0xFF2E7D32);
const _promptedKey = 'feedback_prompted_orders';

const _positiveTags = {'On time', 'Polite', 'Careful with items', 'Followed instructions'};

const _ratingWords = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent'];

/// Opens the rate-your-order sheet (delivery partner + products).
/// Returns true when feedback was submitted.
Future<bool> showOrderFeedbackSheet(
  BuildContext context,
  WidgetRef ref,
  String orderId, {
  OrderFeedbackInfo? preloaded,
}) async {
  final repo = ref.read(orderFeedbackRepositoryProvider);
  OrderFeedbackInfo? info = preloaded;
  if (info == null) {
    try {
      info = await repo.fetch(orderId);
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not load feedback. Try again.')),
        );
      }
      return false;
    }
  }
  if (!context.mounted) return false;
  if (info.submitted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Thanks! You already rated this order.')),
    );
    return false;
  }
  if (!info.eligible) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('You can rate the order once it is delivered.')),
    );
    return false;
  }

  final result = await showModalBottomSheet<int>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => _OrderFeedbackSheet(info: info!, repo: repo),
  );
  if (result != null && result > 0) {
    await ref.read(deliveryRatingsProvider.notifier).setRating(orderId, result);
    return true;
  }
  return false;
}

/// Shows the feedback sheet once, automatically, the first time a delivered
/// order without feedback is opened.
Future<void> maybePromptOrderFeedback(BuildContext context, WidgetRef ref, String orderId) async {
  if (orderId.isEmpty) return;
  final prefs = await SharedPreferences.getInstance();
  final prompted = prefs.getStringList(_promptedKey) ?? const <String>[];
  if (prompted.contains(orderId)) return;

  OrderFeedbackInfo info;
  try {
    info = await ref.read(orderFeedbackRepositoryProvider).fetch(orderId);
  } catch (_) {
    return;
  }
  if (!info.eligible) return;
  final next = [...prompted, orderId];
  await prefs.setStringList(_promptedKey, next.length > 200 ? next.sublist(next.length - 200) : next);
  if (info.submitted || info.skipped) {
    if (info.riderRating != null) {
      await ref.read(deliveryRatingsProvider.notifier).setRating(orderId, info.riderRating!);
    }
    return;
  }
  if (!context.mounted) return;
  await showOrderFeedbackSheet(context, ref, orderId, preloaded: info);
}

class _OrderFeedbackSheet extends StatefulWidget {
  const _OrderFeedbackSheet({required this.info, required this.repo});

  final OrderFeedbackInfo info;
  final OrderFeedbackRepository repo;

  @override
  State<_OrderFeedbackSheet> createState() => _OrderFeedbackSheetState();
}

class _OrderFeedbackSheetState extends State<_OrderFeedbackSheet> {
  int _riderRating = 0;
  final Set<String> _tags = {};
  final _riderComment = TextEditingController();
  final Map<String, int> _productRatings = {};
  final Map<String, TextEditingController> _productComments = {};
  final Set<String> _openComments = {};
  bool _submitting = false;
  String? _error;

  bool get _hasRider => widget.info.riderName != null;

  bool get _canSubmit => !_submitting && (_riderRating > 0 || _productRatings.isNotEmpty);

  List<String> get _visibleTags {
    final positive = _riderRating == 0 || _riderRating >= 4;
    return widget.info.riderTags.where((t) => _positiveTags.contains(t) == positive).toList();
  }

  @override
  void dispose() {
    _riderComment.dispose();
    for (final c in _productComments.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    final error = await widget.repo.submit(
      widget.info.orderId,
      riderRating: _hasRider && _riderRating > 0 ? _riderRating : null,
      riderComment: _riderComment.text.trim(),
      riderTags: _tags.where(_visibleTags.contains).toList(),
      productRatings: _productRatings,
      productComments: {
        for (final e in _productComments.entries)
          if (e.value.text.trim().isNotEmpty) e.key: e.value.text.trim(),
      },
    );
    if (!mounted) return;
    if (error != null) {
      setState(() {
        _submitting = false;
        _error = error;
      });
      return;
    }
    final summary = _riderRating > 0
        ? _riderRating
        : (_productRatings.values.reduce((a, b) => a + b) / _productRatings.length).round();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Thanks for your feedback!'),
        backgroundColor: _green,
      ),
    );
    Navigator.pop(context, summary);
  }

  @override
  Widget build(BuildContext context) {
    final info = widget.info;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE0E0E0),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _header(info),
                    if (_hasRider) ...[
                      const SizedBox(height: 20),
                      _riderSection(info),
                    ],
                    if (info.products.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      _productsSection(info),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _error!,
                        style: const TextStyle(color: Color(0xFFC62828), fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            _footer(),
          ],
        ),
      ),
    );
  }

  Widget _header(OrderFeedbackInfo info) {
    return Column(
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(color: Color(0xFFE8F5E9), shape: BoxShape.circle),
          child: const Icon(Icons.check_circle_rounded, color: _green, size: 34),
        ),
        const SizedBox(height: 10),
        const Text(
          'Order delivered!',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 4),
        Text(
          info.orderNumber.isEmpty
              ? 'How was your experience?'
              : 'How was order #${info.orderNumber}?',
          style: const TextStyle(fontSize: 13.5, color: AppColors.textSecondary),
        ),
      ],
    );
  }

  Widget _riderSection(OrderFeedbackInfo info) {
    final name = info.riderName ?? 'your delivery partner';
    return _Section(
      children: [
        Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: const Color(0xFFE8F5E9),
              child: const Icon(Icons.delivery_dining_rounded, color: _green),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Rate $name',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                  ),
                  const Text(
                    'Delivery partner',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _StarRow(
          rating: _riderRating,
          size: 40,
          onChanged: (v) => setState(() => _riderRating = v),
        ),
        if (_riderRating > 0) ...[
          const SizedBox(height: 4),
          Center(
            child: Text(
              _ratingWords[_riderRating],
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: _riderRating >= 4 ? _green : const Color(0xFFE65100),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            _riderRating >= 4 ? 'What went well?' : 'What went wrong?',
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final tag in _visibleTags)
                FilterChip(
                  label: Text(tag),
                  selected: _tags.contains(tag),
                  onSelected: (on) => setState(() => on ? _tags.add(tag) : _tags.remove(tag)),
                  showCheckmark: false,
                  labelStyle: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: _tags.contains(tag) ? Colors.white : AppColors.textPrimary,
                  ),
                  selectedColor: _green,
                  backgroundColor: Colors.white,
                  side: BorderSide(color: _tags.contains(tag) ? _green : const Color(0xFFE0E0E0)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _riderComment,
            maxLines: 2,
            maxLength: 300,
            decoration: _inputDecoration('Anything else about the delivery? (optional)'),
          ),
        ],
      ],
    );
  }

  Widget _productsSection(OrderFeedbackInfo info) {
    return _Section(
      children: [
        const Text(
          'Rate your items',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 2),
        const Text(
          'Your ratings help other shoppers',
          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 8),
        for (final product in info.products) _productRow(product),
      ],
    );
  }

  Widget _productRow(FeedbackProduct product) {
    final rating = _productRatings[product.productId] ?? 0;
    final commentOpen = _openComments.contains(product.productId);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 48,
                  height: 48,
                  color: const Color(0xFFF5F5F5),
                  child: product.image.isEmpty
                      ? const Icon(Icons.shopping_basket_outlined, color: AppColors.textSecondary)
                      : AppNetworkImage(imageUrl: product.image, width: 48, height: 48, cacheWidth: 48),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    _StarRow(
                      rating: rating,
                      size: 26,
                      alignStart: true,
                      onChanged: (v) => setState(() => _productRatings[product.productId] = v),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (rating > 0 && !commentOpen)
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: () => setState(() {
                  _openComments.add(product.productId);
                  _productComments.putIfAbsent(product.productId, TextEditingController.new);
                }),
                icon: const Icon(Icons.edit_outlined, size: 16),
                label: const Text('Write a review'),
                style: TextButton.styleFrom(foregroundColor: _green, padding: const EdgeInsets.only(left: 60)),
              ),
            ),
          if (commentOpen)
            Padding(
              padding: const EdgeInsets.only(left: 60, top: 8),
              child: TextField(
                controller: _productComments[product.productId],
                maxLines: 2,
                maxLength: 300,
                decoration: _inputDecoration('What did you like or dislike?'),
              ),
            ),
        ],
      ),
    );
  }

  Widget _footer() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF0F0F0))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          FilledButton(
            onPressed: _canSubmit ? _submit : null,
            style: FilledButton.styleFrom(
              backgroundColor: _green,
              disabledBackgroundColor: const Color(0xFFC8E6C9),
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _submitting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Submit feedback', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
          ),
          TextButton(
            onPressed: _submitting ? null : () => Navigator.pop(context),
            style: TextButton.styleFrom(foregroundColor: AppColors.textSecondary),
            child: const Text('Maybe later'),
          ),
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    OutlineInputBorder border(Color c) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: c),
        );
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 13, color: Color(0xFF9E9E9E)),
      filled: true,
      fillColor: const Color(0xFFFAFAFA),
      isDense: true,
      contentPadding: const EdgeInsets.all(12),
      border: border(const Color(0xFFE0E0E0)),
      enabledBorder: border(const Color(0xFFE0E0E0)),
      focusedBorder: border(_green),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: children),
    );
  }
}

class _StarRow extends StatelessWidget {
  const _StarRow({
    required this.rating,
    required this.onChanged,
    this.size = 32,
    this.alignStart = false,
  });

  final int rating;
  final ValueChanged<int> onChanged;
  final double size;
  final bool alignStart;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: alignStart ? MainAxisAlignment.start : MainAxisAlignment.center,
      children: List.generate(5, (i) {
        final star = i + 1;
        final on = star <= rating;
        return GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => onChanged(star),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: size * 0.08),
            child: AnimatedScale(
              scale: on ? 1.0 : 0.92,
              duration: const Duration(milliseconds: 150),
              child: Icon(
                on ? Icons.star_rounded : Icons.star_outline_rounded,
                size: size,
                color: on ? const Color(0xFFFFB300) : const Color(0xFFBDBDBD),
              ),
            ),
          ),
        );
      }),
    );
  }
}
