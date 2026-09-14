import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

import '../../config/theme.dart';

class ProductVideoPlayer extends StatefulWidget {
  const ProductVideoPlayer({
    super.key,
    required this.url,
    this.embedded = false,
  });

  final String url;
  final bool embedded;

  @override
  State<ProductVideoPlayer> createState() => _ProductVideoPlayerState();
}

class _ProductVideoPlayerState extends State<ProductVideoPlayer> {
  VideoPlayerController? _controller;
  bool _failed = false;
  bool _initializing = true;

  @override
  void initState() {
    super.initState();
    _initController();
  }

  @override
  void didUpdateWidget(covariant ProductVideoPlayer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.url.trim() != widget.url.trim()) {
      _disposeController();
      _failed = false;
      _initializing = true;
      _initController();
    }
  }

  Future<void> _initController() async {
    final url = widget.url.trim();
    if (url.isEmpty) {
      if (mounted) {
        setState(() {
          _failed = true;
          _initializing = false;
        });
      }
      return;
    }

    final controller = VideoPlayerController.networkUrl(Uri.parse(url));
    _controller = controller;

    try {
      await controller.initialize();
      if (!mounted) return;
      setState(() {
        _initializing = false;
        _failed = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _failed = true;
        _initializing = false;
      });
      await controller.dispose();
      _controller = null;
    }
  }

  void _disposeController() {
    _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) {
      return Container(
        height: widget.embedded ? 280 : 200,
        alignment: Alignment.center,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: widget.embedded ? Colors.black : AppColors.mobileSurface,
          borderRadius: BorderRadius.circular(widget.embedded ? 12 : 12),
          border: widget.embedded ? null : Border.all(color: AppColors.borderLight),
        ),
        child: Text(
          'Video preview is unavailable.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: widget.embedded ? Colors.white70 : AppColors.textSecondary,
            fontSize: 13,
          ),
        ),
      );
    }

    if (_initializing || _controller == null || !_controller!.value.isInitialized) {
      return Container(
        height: widget.embedded ? 280 : 200,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: widget.embedded ? Colors.black : AppColors.mobileSurface,
          borderRadius: BorderRadius.circular(12),
          border: widget.embedded ? null : Border.all(color: AppColors.borderLight),
        ),
        child: CircularProgressIndicator(
          strokeWidth: 2,
          color: widget.embedded ? Colors.white : null,
        ),
      );
    }

    final controller = _controller!;

    final player = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        widget.embedded
            ? SizedBox(
                height: 220,
                width: double.infinity,
                child: FittedBox(
                  fit: BoxFit.contain,
                  child: SizedBox(
                    width: controller.value.size.width,
                    height: controller.value.size.height,
                    child: VideoPlayer(controller),
                  ),
                ),
              )
            : AspectRatio(
                aspectRatio: controller.value.aspectRatio == 0
                    ? 16 / 9
                    : controller.value.aspectRatio,
                child: VideoPlayer(controller),
              ),
        Container(
          color: Colors.black87,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            children: [
              IconButton(
                onPressed: () {
                  setState(() {
                    controller.value.isPlaying
                        ? controller.pause()
                        : controller.play();
                  });
                },
                icon: Icon(
                  controller.value.isPlaying ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                ),
              ),
              Expanded(
                child: VideoProgressIndicator(
                  controller,
                  allowScrubbing: true,
                  colors: const VideoProgressColors(
                    playedColor: AppColors.primary,
                    bufferedColor: Colors.white24,
                    backgroundColor: Colors.white12,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );

    if (widget.embedded) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: player,
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      clipBehavior: Clip.antiAlias,
      child: player,
    );
  }
}
