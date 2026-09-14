import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/connectivity_provider.dart';

/// Shell body wrapper — connectivity changes only rebuild the banner strip.
class OfflineBannerHost extends StatelessWidget {
  const OfflineBannerHost({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        child,
        const Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: _OfflineBannerStrip(),
        ),
      ],
    );
  }
}

class _OfflineBannerStrip extends ConsumerWidget {
  const _OfflineBannerStrip();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOffline = ref.watch(isOfflineProvider);

    return AnimatedCrossFade(
      duration: const Duration(milliseconds: 200),
      crossFadeState:
          isOffline ? CrossFadeState.showFirst : CrossFadeState.showSecond,
      firstChild: Material(
        elevation: 2,
        color: Colors.red.shade700,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              'No internet connection. Some features may not work.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ),
      secondChild: const SizedBox.shrink(),
    );
  }
}
