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
    this.area = '',
    this.location,
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
  final String area;
  final String city;
  final String state;
  final String pincode;
  final Map<String, dynamic>? location;
  final bool isDefault;

  factory Address.fromJson(Map<String, dynamic> json) {
    final fullAddr = json['fullAddress']?.toString() ??
        json['address']?.toString() ??
        json['streetArea']?.toString() ??
        json['formattedAddress']?.toString() ??
        json['locationName']?.toString() ??
        json['displayAddress']?.toString() ??
        '';

    final shopNameVal = json['shopName']?.toString() ??
        json['tag']?.toString() ??
        json['label']?.toString() ??
        '';

    final shopNoVal = json['shopNo']?.toString() ??
        json['houseNo']?.toString() ??
        json['flatNo']?.toString() ??
        json['building']?.toString() ??
        '';

    final areaVal = json['area']?.toString() ??
        json['locality']?.toString() ??
        '';

    final landmarkVal = json['landmark']?.toString() ??
        '';

    final phoneVal = json['number']?.toString() ??
        json['phone']?.toString() ??
        json['mobile']?.toString() ??
        '';

    final pinVal = json['pincode']?.toString() ??
        json['zip']?.toString() ??
        json['zipCode']?.toString() ??
        json['postalCode']?.toString() ??
        '';

    Map<String, dynamic>? loc;
    if (json['location'] is Map) {
      loc = Map<String, dynamic>.from(json['location'] as Map);
    } else if (json['lat'] != null && json['lng'] != null) {
      loc = {
        'lat': double.tryParse(json['lat'].toString()),
        'lng': double.tryParse(json['lng'].toString()),
      };
    }

    return Address(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['name']?.toString() ?? '',
      number: phoneVal,
      email: json['email']?.toString() ?? '',
      shopNo: shopNoVal,
      shopName: shopNameVal,
      fullAddress: fullAddr,
      landmark: landmarkVal,
      area: areaVal,
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString() ?? '',
      pincode: pinVal,
      location: loc,
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
        'area': area,
        'city': city,
        'state': state,
        'pincode': pincode,
        if (location != null) 'location': location,
        'isDefault': isDefault,
      };
}
