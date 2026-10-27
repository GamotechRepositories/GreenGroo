import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../common/app_network_image.dart';
import '../common/nav_icon_locator.dart';
import '../layout/flipkart_bottom_nav.dart';

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
  if (imageUrl == null || imageUrl.isEmpty || _flyProductTrigger == null) {
    return;
  }
  final sourceBox = sourceContext.findRenderObject() as RenderBox?;
  if (sourceBox == null || !sourceBox.attached) return;

  final start = sourceBox.localToGlobal(sourceBox.size.center(Offset.zero));
  final target = NavIconLocator.cartIconBox;
  final Offset end;
  if (target != null && target.attached && target.hasSize) {
    end = target.localToGlobal(target.size.center(Offset.zero));
  } else {
    // Where the floating cart bar's Cart button appears once the first item lands.
    final size = MediaQuery.sizeOf(sourceContext);
    final bottom = MediaQuery.paddingOf(sourceContext).bottom;
    end = Offset(size.width - 12 - 48, size.height - bottom - FlipkartBottomNav.barHeight - 8 - 25);
  }

  _flyProductTrigger!(
    FlyProductRequest(start: start, end: end, imageUrl: imageUrl),
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

class _FlyTask {
  final int id;
  final FlyProductRequest request;
  final AnimationController controller;
  final Animation<double> progress;
  final Animation<double> scale;
  final Animation<double> opacity;

  _FlyTask({
    required this.id,
    required this.request,
    required this.controller,
    required this.progress,
    required this.scale,
    required this.opacity,
  });
}

class _FlyProductAnimatorState extends State<FlyProductAnimator>
    with TickerProviderStateMixin {
  static const double _size = 44;

  final List<_FlyTask> _tasks = [];
  int _nextId = 0;

  @override
  void initState() {
    super.initState();
    _flyProductTrigger = _startAnimation;
  }

  @override
  void dispose() {
    if (_flyProductTrigger == _startAnimation) {
      _flyProductTrigger = null;
    }
    for (final task in _tasks) {
      task.controller.dispose();
    }
    _tasks.clear();
    super.dispose();
  }

  void _startAnimation(FlyProductRequest request) {
    if (!mounted) return;

    final controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    );

    final progress = CurvedAnimation(
      parent: controller,
      curve: Curves.easeInOutCubic,
    );

    final scale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.05, end: 0.82), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 0.82, end: 0.45), weight: 40),
      TweenSequenceItem(tween: Tween(begin: 0.45, end: 0.15), weight: 20),
    ]).animate(controller);

    final opacity = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.98), weight: 45),
      TweenSequenceItem(tween: Tween(begin: 0.98, end: 0.85), weight: 35),
      TweenSequenceItem(tween: Tween(begin: 0.85, end: 0.0), weight: 20),
    ]).animate(controller);

    final task = _FlyTask(
      id: ++_nextId,
      request: request,
      controller: controller,
      progress: progress,
      scale: scale,
      opacity: opacity,
    );

    setState(() {
      _tasks.add(task);
    });

    controller.forward().whenComplete(() {
      if (!mounted) return;
      setState(() {
        _tasks.removeWhere((t) => t.id == task.id);
      });
      controller.dispose();
    });
  }

  Offset _positionAt(FlyProductRequest request, double t) {
    final eased = Curves.easeInOutCubic.transform(t);
    final linear = Offset.lerp(request.start, request.end, eased)!;
    final arcLift = -68 * math.sin(math.pi * eased);
    return Offset(linear.dx, linear.dy + arcLift);
  }

  @override
  Widget build(BuildContext context) {
    if (_tasks.isEmpty) {
      return const SizedBox.shrink();
    }

    return IgnorePointer(
      child: Stack(
        children: _tasks.map((task) {
          return AnimatedBuilder(
            key: ValueKey(task.id),
            animation: task.controller,
            builder: (context, child) {
              final currentScale = task.scale.value;
              final position = _positionAt(task.request, task.progress.value);
              return Positioned(
                left: position.dx - (_size * currentScale) / 2,
                top: position.dy - (_size * currentScale) / 2,
                child: Opacity(
                  opacity: task.opacity.value.clamp(0.0, 1.0),
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
                borderRadius: BorderRadius.circular(10),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33000000),
                    blurRadius: 10,
                    offset: Offset(0, 3),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: AppNetworkImage(
                  imageUrl: task.request.imageUrl,
                  width: _size,
                  height: _size,
                  fit: BoxFit.contain,
                  cacheWidth: 90,
                  cacheHeight: 90,
                  errorIcon: Icons.image_outlined,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
