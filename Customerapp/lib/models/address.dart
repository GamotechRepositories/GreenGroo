class Address {
  const Address({
    required this.id,
    required this.fullName,
    required this.number,
    required this.email,
    required this.shopNo,
    required this.shopName,
    required this.fullAddress,
    required this.landmark,
    required this.city,
    required this.state,
    required this.pincode,
    this.isDefault = false,
  });

  final String id;
  final String fullName;
  final String number;
  final String email;
  final String shopNo;
  final String shopName;
  final String fullAddress;
  final String landmark;
  final String city;
  final String state;
  final String pincode;
  final bool isDefault;

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['_id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['name']?.toString() ?? '',
      number: json['number']?.toString() ?? json['phone']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      shopNo: json['shopNo']?.toString() ?? '',
      shopName: json['shopName']?.toString() ?? '',
      fullAddress:
          json['fullAddress']?.toString() ?? json['streetArea']?.toString() ?? '',
      landmark: json['landmark']?.toString() ?? '',
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      pincode: json['pincode']?.toString() ?? '',
      isDefault: json['isDefault'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'fullName': fullName,
        'number': number,
        'email': email,
        'shopNo': shopNo,
        'shopName': shopName,
        'fullAddress': fullAddress,
        'landmark': landmark,
        'city': city,
        'state': state,
        'pincode': pincode,
        'isDefault': isDefault,
      };
}
