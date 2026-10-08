import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import '../../config/theme.dart';
import 'app_logo.dart';

class OpeningSplashHost extends StatefulWidget {
  const OpeningSplashHost({super.key, required this.child});

  final Widget child;

  @override
  State<OpeningSplashHost> createState() => _OpeningSplashHostState();
}

class _OpeningSplashHostState extends State<OpeningSplashHost>
    with SingleTickerProviderStateMixin {
  static const _maxTotal = Duration(milliseconds: 2200);
  static const _holdDuration = Duration(milliseconds: 1500);

  AnimationController? _controller;
  Animation<double>? _contentOpacity;
  Animation<double>? _contentScale;
  Animation<double>? _overlayOpacity;

  bool _showOverlay = true;
  bool _animationsEnabled = true;

  @override
  void initState() {
    super.initState();
    final reduceMotion = MediaQueryData.fromView(
      WidgetsBinding.instance.platformDispatcher.views.first,
    ).disableAnimations;

    if (reduceMotion) {
      _animationsEnabled = false;
      _showOverlay = false;
      return;
    }

    final controller = AnimationController(vsync: this, duration: _maxTotal);
    _controller = controller;

    _contentOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: controller,
        curve: const Interval(0, 0.34, curve: Curves.easeOutCubic),
      ),
    );
    _contentScale = Tween<double>(begin: 0.94, end: 1).animate(
      CurvedAnimation(
        parent: controller,
        curve: const Interval(0, 0.34, curve: Curves.easeOutCubic),
      ),
    );
    _overlayOpacity = Tween<double>(begin: 1, end: 0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Interval(
          _holdDuration.inMilliseconds / _maxTotal.inMilliseconds,
          1,
          curve: Curves.easeOut,
        ),
      ),
    );

    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _controller == null) return;
      _controller!.forward();
    });

    controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted) {
        setState(() => _showOverlay = false);
      }
    });
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_animationsEnabled) {
      return widget.child;
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        widget.child,
        if (_showOverlay)
          RepaintBoundary(
            child: AnimatedBuilder(
              animation: _controller!,
              builder: (context, _) {
                final overlayOpacity = _overlayOpacity!.value;
                return IgnorePointer(
                  child: Opacity(
                    opacity: overlayOpacity,
                    child: ColoredBox(
                      color: Colors.white,
                      child: Center(
                        child: Opacity(
                          opacity: _contentOpacity!.value,
                          child: Transform.scale(
                            scale: _contentScale!.value,
                            child: const _OpeningSplashContent(),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class _OpeningSplashContent extends StatelessWidget {
  const _OpeningSplashContent();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Image.asset(
        'assets/images/app_icon_launcher.png',
        width: 140,
        height: 140,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => const SizedBox(
          width: 140,
          height: 140,
        ),
      ),
    );
  }
}
