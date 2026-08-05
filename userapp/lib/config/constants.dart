import '../config/contact.dart';

class AppConstants {
  AppConstants._();

  static const String authStorageKey = 'bmm_auth';
  static const String logoAsset = 'assets/images/favicon.png';
  static const String logoUrl =
      'https://res.cloudinary.com/dsafvwkrf/image/upload/v1780561447/GreenGrocc_logo_2-removebg-preview_wcso0k.png';

  static const int moq = 10;
  static const double freeDeliveryThreshold = 999;
  static const double shippingFee = 49;
  static const double codAdvancePercent = 0.1;

  static const int homeProductLimit = 12;

  static const String promoBannerImage =
      'https://res.cloudinary.com/dsafvwkrf/image/upload/v1781347425/Untitled_design_9_lqyd8e.png';

  static const String whatsAppUrl = ContactConfig.contactWhatsAppUrl;

  static const String whatsAppGroupUrl = ContactConfig.whatsAppGroupUrl;

  /// @deprecated Use [Env.storeUrl] for share links.
  static const String webShareBaseUrl = 'https://www.greengrocc.in';

  /// OG / website share image (matches frontend `SITE_SHARE_IMAGE_URL`).
  static const String websiteShareImageUrl =
      'https://cdn.greengrocc.in/brands/1785153280283-3b480e9c1de0abfb.jpg';
}
