import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../common/app_network_image.dart';
import '../common/nav_icon_locator.dart';

class FlyProductRequest {
  const FlyProductRequest({
    required this.start,
    required this.end,
    required this.imageUrl,
  });

  final Offset start;
  final Offset end;
  final String imageUrl;
}

void Function(FlyProductRequest request)? _flyProductTrigger;

void triggerFlyProduct({
  required BuildContext sourceContext,
  required String? imageUrl,
  required RenderBox? targetBox,
}) {
  if (imageUrl == null || imageUrl.isEmpty) return;

  final sourceBox = sourceContext.findRenderObject() as RenderBox?;
  if (sourceBox == null || targetBox == null || _flyProductTrigger == null) return;

  final start = sourceBox.localToGlobal(sourceBox.size.center(Offset.zero));
  final end = targetBox.localToGlobal(targetBox.size.center(Offset.zero));

  _flyProductTrigger!(
    FlyProductRequest(start: start, end: end, imageUrl: imageUrl),
  );
}

void triggerFlyToCart({
  required BuildContext sourceContext,
  required String? imageUrl,
}) {
  triggerFlyProduct(
    sourceContext: sourceContext,
    imageUrl: imageUrl,
    targetBox: NavIconLocator.cartIconBox,
  );
}

void triggerFlyToWishlist({
  required BuildContext sourceContext,
  required String? imageUrl,
}) {
  triggerFlyProduct(
    sourceContext: sourceContext,
    imageUrl: imageUrl,
    targetBox: NavIconLocator.wishlistIconBox,
  );
}

class FlyProductAnimator extends StatefulWidget {
  const FlyProductAnimator({super.key});

  @override
  State<FlyProductAnimator> createState() => _FlyProductAnimatorState();
}

class _FlyProductAnimatorState extends State<FlyProductAnimator>
    with SingleTickerProviderStateMixin {
  static const double _size = 40;

  FlyProductRequest? _request;
  late final AnimationController _controller;
  late final Animation<double> _progress;
  late final Animation<double> _scale;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _progress = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOutCubic,
    );
    _scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.78), weight: 45),
      TweenSequenceItem(tween: Tween(begin: 0.78, end: 0.36), weight: 37),
      TweenSequenceItem(tween: Tween(begin: 0.36, end: 0.1), weight: 18),
    ]).animate(_controller);
    _opacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.96), weight: 45),
      TweenSequenceItem(tween: Tween(begin: 0.96, end: 0.82), weight: 37),
      TweenSequenceItem(tween: Tween(begin: 0.82, end: 0.0), weight: 18),
    ]).animate(_controller);
    _flyProductTrigger = _startAnimation;
  }

  @override
  void dispose() {
    if (_flyProductTrigger == _startAnimation) {
      _flyProductTrigger = null;
    }
    _controller.dispose();
    super.dispose();
  }

  void _startAnimation(FlyProductRequest request) {
    if (!mounted || _controller.isAnimating) return;

    setState(() => _request = request);
    _controller.forward(from: 0).whenComplete(() {
      if (!mounted) return;
      setState(() => _request = null);
    });
  }

  Offset _positionAt(FlyProductRequest request, double t) {
    final eased = Curves.easeInOutCubic.transform(t);
    final linear = Offset.lerp(request.start, request.end, eased)!;
    final arcLift = -72 * math.sin(math.pi * eased);
    return Offset(linear.dx, linear.dy + arcLift);
  }

  @override
  Widget build(BuildContext context) {
    final request = _request;
    if (request == null) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final currentScale = _scale.value;
        final position = _positionAt(request, _progress.value);
        return Positioned(
          left: position.dx - (_size * currentScale) / 2,
          top: position.dy - (_size * currentScale) / 2,
          child: Opacity(
            opacity: _opacity.value,
            child: Transform.scale(
              scale: currentScale,
              child: child,
            ),
          ),
        );
      },
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [
            BoxShadow(
              color: Color(0x26000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: AppNetworkImage(
            imageUrl: request.imageUrl,
            width: _size,
            height: _size,
            fit: BoxFit.contain,
            cacheWidth: 80,
            cacheHeight: 80,
            errorIcon: Icons.image_outlined,
          ),
        ),
      ),
    );
  }
}
