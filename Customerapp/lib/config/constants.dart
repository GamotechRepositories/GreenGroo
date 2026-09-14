import '../config/contact.dart';

class AppConstants {
  AppConstants._();

  static const String authStorageKey = 'greengrocc_auth';
  static const String logoAsset = 'assets/images/greengrocc_logo.png';
  static const String logoUrl =
      'https://www.greengrocc.in/greengrocc-logo.png';

  static const int moq = 1;
  static const double freeDeliveryThreshold = 99;
  static const double shippingFee = 25;
  static const double codAdvancePercent = 0.1;

  static const int homeProductLimit = 12;

  static const String promoBannerImage =
      'https://www.greengrocc.in/hero-banner.png';

  static const String whatsAppUrl = ContactConfig.contactWhatsAppUrl;

  static const String whatsAppGroupUrl = ContactConfig.whatsAppGroupUrl;

  /// @deprecated Use [Env.storeUrl] for share links.
  static const String webShareBaseUrl = 'https://www.greengrocc.in';

  /// OG / website share image (matches frontend `SITE_SHARE_IMAGE_URL`).
  static const String websiteShareImageUrl =
      'https://cdn.greengrocc.in/brands/1785153280283-3b480e9c1de0abfb.jpg';
}
