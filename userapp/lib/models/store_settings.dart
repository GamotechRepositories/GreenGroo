class MerchantUpiAccount {
  const MerchantUpiAccount({
    required this.upiId,
    required this.label,
    this.enabled = true,
  });

  final String upiId;
  final String label;
  final bool enabled;

  factory MerchantUpiAccount.fromJson(Map<String, dynamic> json) {
    return MerchantUpiAccount(
      upiId: (json['upiId'] as String? ?? '').trim(),
      label: (json['label'] as String? ?? 'BulkMobileMart').trim(),
      enabled: json['enabled'] != false,
    );
  }
}

class StoreSettings {
  const StoreSettings({
    required this.minimumOrderValue,
    required this.minimumShippingCharge,
    required this.shippingSlabs,
    required this.merchantUpiId,
    required this.merchantUpiName,
    required this.merchantUpiAccounts,
    this.cartNoticeEn = const [],
    this.cartNoticeHi = const [],
  });

  final double minimumOrderValue;
  final double minimumShippingCharge;
  final List<StoreShippingSlab> shippingSlabs;
  final String merchantUpiId;
  final String merchantUpiName;
  final List<MerchantUpiAccount> merchantUpiAccounts;
  final List<String> cartNoticeEn;
  final List<String> cartNoticeHi;

  List<MerchantUpiAccount> get enabledMerchantUpiAccounts =>
      merchantUpiAccounts.where((account) => account.enabled && account.upiId.isNotEmpty).toList();

  factory StoreSettings.fromJson(Map<String, dynamic> json) {
    final slabs = (json['shippingSlabs'] as List<dynamic>? ?? [])
        .map((item) => StoreShippingSlab.fromJson(item as Map<String, dynamic>))
        .toList();

    final accounts = (json['merchantUpiAccounts'] as List<dynamic>? ?? [])
        .map((item) => MerchantUpiAccount.fromJson(item as Map<String, dynamic>))
        .where((account) => account.upiId.isNotEmpty)
        .toList();

    final legacyUpiId = (json['merchantUpiId'] as String? ?? '').trim();
    final legacyUpiName =
        (json['merchantUpiName'] as String? ?? 'BulkMobileMart').trim();

    final resolvedAccounts = accounts.isNotEmpty
        ? accounts
        : legacyUpiId.isNotEmpty
            ? [
                MerchantUpiAccount(
                  upiId: legacyUpiId,
                  label: legacyUpiName,
                  enabled: true,
                ),
              ]
            : <MerchantUpiAccount>[];

    return StoreSettings(
      minimumOrderValue: (json['minimumOrderValue'] as num?)?.toDouble() ?? 3000,
      minimumShippingCharge:
          (json['minimumShippingCharge'] as num?)?.toDouble() ?? 280,
      shippingSlabs: slabs,
      merchantUpiId: legacyUpiId,
      merchantUpiName: legacyUpiName,
      merchantUpiAccounts: resolvedAccounts,
      cartNoticeEn: (json['cartNoticeEn'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
      cartNoticeHi: (json['cartNoticeHi'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
    );
  }
}

class StoreShippingSlab {
  const StoreShippingSlab({
    required this.orderAmount,
    required this.shippingCharge,
  });

  final double orderAmount;
  final double shippingCharge;

  factory StoreShippingSlab.fromJson(Map<String, dynamic> json) {
    return StoreShippingSlab(
      orderAmount: (json['orderAmount'] as num?)?.toDouble() ?? 0,
      shippingCharge: (json['shippingCharge'] as num?)?.toDouble() ?? 0,
    );
  }
}
