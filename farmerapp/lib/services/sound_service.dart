import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class NotificationSoundService {
  static final NotificationSoundService _instance = NotificationSoundService._internal();
  factory NotificationSoundService() => _instance;
  NotificationSoundService._internal();

  AudioPlayer? _player;

  /// Notification sound file located in assets/images/
  static const String notificationSoundAsset = 'images/universfield-new-notification-038-487899.mp3';

  AudioPlayer _getOrCreatePlayer() {
    return _player ??= AudioPlayer();
  }

  DateTime? _lastPlayedTime;

  /// Plays the custom notification sound with safe fallback and debounce
  Future<void> playNotificationSound({bool force = false}) async {
    final now = DateTime.now();
    if (!force && _lastPlayedTime != null && now.difference(_lastPlayedTime!).inSeconds < 4) {
      debugPrint('NotificationSoundService: Debounced (played recently)');
      return;
    }
    _lastPlayedTime = now;

    try {
      final player = _getOrCreatePlayer();
      await player.stop();
      await player.play(AssetSource(notificationSoundAsset), volume: 1.0);
    } on MissingPluginException {
      debugPrint('AudioPlayer native plugin not linked in current run. Fallback to SystemSound.');
      try {
        await SystemSound.play(SystemSoundType.alert);
        await HapticFeedback.mediumImpact();
      } catch (_) {}
    } catch (e) {
      debugPrint('Error playing notification sound: $e');
      try {
        await SystemSound.play(SystemSoundType.alert);
      } catch (_) {}
    }
  }


  void dispose() {
    try {
      _player?.dispose();
      _player = null;
    } catch (_) {}
  }
}

