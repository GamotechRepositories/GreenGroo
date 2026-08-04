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
  static const _fadeDuration = Duration(milliseconds: 500);

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
                      color: const Color(0xFFFFFAF6),
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
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const AppLogo(height: 84),
          const SizedBox(height: 18),
          const Text(
            'Bulk Mobile Mart',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          const Text(
            'Your Trusted Wholesale Partner',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 18),
          Container(
            width: 132,
            height: 3,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              gradient: const LinearGradient(
                colors: [AppColors.primary, Color(0xFFFFB347)],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
