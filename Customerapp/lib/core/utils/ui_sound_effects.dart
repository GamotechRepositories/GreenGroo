import 'package:audioplayers/audioplayers.dart';

/// Short UI sounds for cart / wishlist feedback.
abstract final class UiSoundEffects {
  static final AudioPlayer _cartPlayer = AudioPlayer()
    ..setReleaseMode(ReleaseMode.stop);
  static final AudioPlayer _wishlistPlayer = AudioPlayer()
    ..setReleaseMode(ReleaseMode.stop);

  static Future<void> playCartAdd() => _play(_cartPlayer, 'sounds/cart_add.wav', volume: 0.72);

  static Future<void> playWishlistAdd() =>
      _play(_wishlistPlayer, 'sounds/wishlist_add.wav', volume: 0.58);

  static Future<void> _play(
    AudioPlayer player,
    String asset, {
    double volume = 0.65,
  }) async {
    try {
      await player.stop();
      await player.play(AssetSource(asset), volume: volume);
    } catch (_) {
      // Ignore if audio fails (e.g. silent mode on some devices).
    }
  }
}
