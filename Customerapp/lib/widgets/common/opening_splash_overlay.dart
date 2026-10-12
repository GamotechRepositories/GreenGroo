import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

class OpeningSplashHost extends StatefulWidget {
  const OpeningSplashHost({super.key, required this.child});

  final Widget child;

  @override
  State<OpeningSplashHost> createState() => _OpeningSplashHostState();
}

class _OpeningSplashHostState extends State<OpeningSplashHost>
    with SingleTickerProviderStateMixin {
  static const _fadeDuration = Duration(milliseconds: 250);

  AnimationController? _controller;
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

    final controller = AnimationController(
      vsync: this,
      duration: _fadeDuration,
    );
    _controller = controller;

    _overlayOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
      CurvedAnimation(
        parent: controller,
        curve: Curves.easeOut,
      ),
    );

    // Fade directly into the home screen once the first frame is painted.
    SchedulerBinding.instance.addPostFrameCallback((_) {
      if (!mounted || _controller == null) return;
      Future.delayed(const Duration(milliseconds: 150), () {
        if (!mounted || _controller == null) return;
        _controller!.forward();
      });
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
                final overlayOpacity = _overlayOpacity?.value ?? 1.0;
                return IgnorePointer(
                  child: Opacity(
                    opacity: overlayOpacity,
                    child: const ColoredBox(
                      color: Colors.white,
                      child: _OpeningSplashContent(),
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
        width: 130,
        height: 130,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => const SizedBox(
          width: 130,
          height: 130,
        ),
      ),
    );
  }
}
