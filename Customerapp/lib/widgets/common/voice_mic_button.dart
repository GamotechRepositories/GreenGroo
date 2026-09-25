import 'dart:async';

import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart';

/// Hold to speak. Listening starts on press and the search runs on release.
class VoiceMicButton extends StatefulWidget {
  const VoiceMicButton({
    super.key,
    required this.onTranscript,
    this.size = 22,
  });

  /// [isFinal] is true only after the finger is lifted.
  final void Function(String text, bool isFinal) onTranscript;
  final double size;

  @override
  State<VoiceMicButton> createState() => _VoiceMicButtonState();
}

class _VoiceMicButtonState extends State<VoiceMicButton> {
  final SpeechToText _speech = SpeechToText();
  bool _holding = false;
  bool _listening = false;
  bool _ready = false;
  bool _restarting = false;
  String _latest = '';

  static const _holdHint = 'Hold the mic and speak. Release when you are done.';

  @override
  void dispose() {
    _holding = false;
    unawaited(_speech.stop());
    super.dispose();
  }

  Future<void> _onPressDown() async {
    _holding = true;
    _latest = '';
    if (mounted) setState(() => _listening = true);
    _showMessage(_holdHint);

    if (!_ready) {
      _ready = await _speech.initialize(
        onError: (_) {},
        onStatus: _onStatus,
      );
    }
    if (!mounted || !_holding) {
      await _speech.stop();
      return;
    }
    if (!_ready) {
      setState(() => _listening = false);
      _showMessage('Allow the microphone, then hold the mic and speak.');
      return;
    }
    await _startListen();
  }

  Future<void> _startListen() async {
    if (!_holding || _speech.isListening) return;
    await _speech.listen(
      onResult: (result) {
        final words = result.recognizedWords.trim();
        if (words.isEmpty) return;
        _latest = words;
        widget.onTranscript(words, false);
      },
      listenOptions: SpeechListenOptions(
        listenMode: ListenMode.dictation,
        partialResults: true,
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 8),
        localeId: 'en_IN',
      ),
    );
  }

  void _onStatus(String status) {
    if (!_holding || _restarting) return;
    if (status != 'done' && status != 'notListening') return;
    _restarting = true;
    unawaited(() async {
      await Future<void>.delayed(const Duration(milliseconds: 250));
      _restarting = false;
      if (_holding) await _startListen();
    }());
  }

  Future<void> _onPressUp() async {
    if (!_holding && !_listening) return;
    _holding = false;
    await _speech.stop();
    if (mounted) setState(() => _listening = false);
    final spoken = _latest.trim();
    if (spoken.isEmpty) {
      _showMessage(_holdHint);
      return;
    }
    widget.onTranscript(spoken, true);
  }

  void _showMessage(String message) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: (_) => unawaited(_onPressDown()),
      onPointerUp: (_) => unawaited(_onPressUp()),
      onPointerCancel: (_) => unawaited(_onPressUp()),
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(
          _listening ? Icons.mic_rounded : Icons.mic_none_rounded,
          size: widget.size,
          color: _listening ? const Color(0xFFDC2626) : const Color(0xFF64748B),
        ),
      ),
    );
  }
}
