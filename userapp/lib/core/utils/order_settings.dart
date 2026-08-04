import 'package:intl/intl.dart';

import '../../models/store_settings.dart';

const _defaultCartNoticeEn = [
  'Please Verify Your Address Before Placing Your Order.',
  'Minimum order value ₹{{minOrder}}',
  'Parcel opening video is must for return.',
  'Shipping depends on parcel weight minimum Rs {{minShipping}}.',
  'User have to pay shipping charges in advance.',
];

const _defaultCartNoticeHi = [
  'कृपया अपना पूरा पता ठीक से लिखें ऑर्डर करने से पहले। इसके बाद ऑर्डर करें।',
  'न्यूनतम ऑर्डर मूल्य {{minOrder}}.',
  'पार्सल वापसी के लिए पार्सल खोलने का वीडियो अनिवार्य है।',
  'शिपिंग पार्सल के वजन पर निर्भर करता है न्यूनतम {{minShipping}}/',
  'उपयोगकर्ता को शिपिंग शुल्क अग्रिम रूप से देना होगा।',
];

final _amountFormatter = NumberFormat.decimalPattern('en_IN');

StoreSettings mergeStoreSettings(StoreSettings? settings) {
  final source = settings;
  return StoreSettings(
    minimumOrderValue: source?.minimumOrderValue ?? 3000,
    minimumShippingCharge: source?.minimumShippingCharge ?? 280,
    shippingSlabs: source?.shippingSlabs ?? const [],
    merchantUpiId: source?.merchantUpiId ?? '',
    merchantUpiName: source?.merchantUpiName ?? 'BulkMobileMart',
    merchantUpiAccounts: source?.merchantUpiAccounts ?? const [],
    cartNoticeEn: source?.cartNoticeEn.isNotEmpty == true
        ? source!.cartNoticeEn
        : _defaultCartNoticeEn,
    cartNoticeHi: source?.cartNoticeHi.isNotEmpty == true
        ? source!.cartNoticeHi
        : _defaultCartNoticeHi,
  );
}

String _formatAmount(num amount) {
  return _amountFormatter.format(amount);
}

String _interpolateNoticeLine(String line, StoreSettings settings) {
  return line
      .replaceAll('{{minOrder}}', _formatAmount(settings.minimumOrderValue))
      .replaceAll(
        '{{minShipping}}',
        _formatAmount(settings.minimumShippingCharge),
      );
}

List<String> buildCartNoticeBullets(StoreSettings? settings, {String language = 'en'}) {
  final merged = mergeStoreSettings(settings);
  final lines = language == 'hi' ? merged.cartNoticeHi : merged.cartNoticeEn;
  return lines.map((line) => _interpolateNoticeLine(line, merged)).toList();
}
