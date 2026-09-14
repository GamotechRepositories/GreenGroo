import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import '../../core/scroll/vertical_scroll_pause_scope.dart';
import '../../core/utils/viewport_utils.dart';

/// Slowly auto-scrolls a horizontal [child] — pauses on user interaction and off-screen.
class AutoHorizontalScroll extends StatefulWidget {
  const AutoHorizontalScroll({
    super.key,
    required this.height,
    required this.child,
    this.enabled = true,
    this.speed = 0.85,
    this.interval = const Duration(milliseconds: 180),
    this.resumeDelay = const Duration(milliseconds: 2500),
  });

  final double height;
  final Widget child;
  final bool enabled;
  final double speed;
  final Duration interval;
  final Duration resumeDelay;

  @override
  State<AutoHorizontalScroll> createState() => _AutoHorizontalScrollState();
}

class _AutoHorizontalScrollState extends State<AutoHorizontalScroll>
    with WidgetsBindingObserver {
  final _controller = ScrollController();
  Timer? _timer;
  Timer? _resumeTimer;
  bool _paused = false;
  bool _appActive = true;
  bool _scrollQueued = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _startAutoScroll();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final active = state == AppLifecycleState.resumed;
    if (_appActive == active) return;
    _appActive = active;
    if (active) {
      _startAutoScroll();
    } else {
      _stopAutoScroll();
    }
  }

  @override
  void didUpdateWidget(AutoHorizontalScroll oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.enabled != widget.enabled) {
      if (widget.enabled) {
        _startAutoScroll();
      } else {
        _stopAutoScroll();
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _stopAutoScroll();
    _resumeTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _stopAutoScroll();
    if (!widget.enabled || !_appActive) return;

    final disableAnimations = MediaQuery.maybeOf(context)?.disableAnimations ?? false;
    if (disableAnimations) return;

    _timer = Timer.periodic(widget.interval, (_) {
      if (!mounted || _paused || !_controller.hasClients) return;
      if (VerticalScrollPauseScope.isParentVerticalScrolling(context)) return;
      if (!isWidgetRoughlyVisible(context)) return;

      final maxScroll = _controller.position.maxScrollExtent;
      if (maxScroll <= 0) return;

      final target = _controller.offset >= maxScroll - 1
          ? 0.0
          : (_controller.offset + widget.speed).clamp(0.0, maxScroll);
      _queueSafeJump(target);
    });
  }

  void _queueSafeJump(double offset) {
    if (_scrollQueued) return;
    _scrollQueued = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollQueued = false;
      if (!mounted || !_controller.hasClients) return;
      // Avoid mutating scroll position in layout/paint phase.
      if (SchedulerBinding.instance.schedulerPhase ==
          SchedulerPhase.persistentCallbacks) {
        _queueSafeJump(offset);
        return;
      }
      _controller.jumpTo(offset);
    });
  }

  void _stopAutoScroll() {
    _timer?.cancel();
    _timer = null;
  }

  void _pauseForInteraction() {
    _paused = true;
    _resumeTimer?.cancel();
    _resumeTimer = Timer(widget.resumeDelay, () {
      if (mounted) _paused = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      child: Listener(
        onPointerDown: (_) => _pauseForInteraction(),
        child: NotificationListener<ScrollNotification>(
          onNotification: (notification) {
            if (notification is ScrollStartNotification &&
                notification.dragDetails != null) {
              _pauseForInteraction();
            }
            return false;
          },
          child: SingleChildScrollView(
            controller: _controller,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
