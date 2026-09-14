import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Defers building heavy home sections until after the first frame(s) to reduce startup jank.
class DeferredHomeSection extends StatefulWidget {
  const DeferredHomeSection({
    super.key,
    required this.child,
    this.delay = const Duration(milliseconds: 0),
    this.placeholderHeight = 0,
  });

  final Widget child;
  final Duration delay;
  final double placeholderHeight;

  @override
  State<DeferredHomeSection> createState() => _DeferredHomeSectionState();
}

class _DeferredHomeSectionState extends State<DeferredHomeSection> {
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    if (widget.delay == Duration.zero) {
      SchedulerBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _ready = true);
      });
    } else {
      Future<void>.delayed(widget.delay, () {
        if (mounted) setState(() => _ready = true);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_ready) return widget.child;
    if (widget.placeholderHeight <= 0) return const SizedBox.shrink();
    return SizedBox(height: widget.placeholderHeight);
  }
}
