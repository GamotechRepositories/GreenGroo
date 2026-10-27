import 'dart:ui' show Color;

abstract final class AppAssets {
  static const deliveryScooter = 'assets/splash/delivery_scooter.webp';

  static const splashImage = 'assets/splash/delivery_splash.png';

  static const brandLogo = 'assets/branding/greengrocc_logo.png';

  /// Sampled from the edges of [splashImage] so the image blends into the screen.
  static const splashBackground = Color(0xFFF6F2DC);

  static const _vehiclesBase = 'assets/chooseVahicles';
  static const motorcycle = '$_vehiclesBase/motorcycle.webp';
  static const bicycle = '$_vehiclesBase/Bycycle.webp';
  static const ebike = '$_vehiclesBase/ebike.webp';
  static const van = '$_vehiclesBase/van.webp';
}
