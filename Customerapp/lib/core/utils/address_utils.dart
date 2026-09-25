import '../../models/address.dart';

String getAddressFullName(Address address) {
  return address.fullName.isNotEmpty ? address.fullName : '';
}

String formatAddressLine(Address address) {
  final full = address.fullAddress.trim();
  final shopName = address.shopName.trim();
  final shopNo = address.shopNo.trim();
  final landmark = address.landmark.trim();
  final area = address.area.trim();
  final city = address.city.trim();
  final state = address.state.trim();
  final pincode = address.pincode.trim();

  bool isPlaceholder(String val) {
    final lower = val.toLowerCase();
    return lower.isEmpty ||
        lower == 'main' ||
        lower == 'home/work' ||
        lower == 'pending' ||
        lower == 'near location' ||
        lower == 'checkout in progress' ||
        lower == 'address to be confirmed' ||
        lower == 'main address' ||
        lower == 'city' ||
        lower == 'state';
  }

  final parts = <String>[];
  if (!isPlaceholder(shopName)) parts.add(shopName);
  if (!isPlaceholder(shopNo)) {
    parts.add(shopNo.toLowerCase().startsWith('flat') ||
            shopNo.toLowerCase().startsWith('house') ||
            shopNo.toLowerCase().startsWith('shop')
        ? shopNo
        : 'Flat/House $shopNo');
  }
  if (!isPlaceholder(full)) parts.add(full);
  if (!isPlaceholder(area)) {
    parts.add(area);
  } else if (!isPlaceholder(landmark)) {
    parts.add(landmark);
  }

  final cityStatePinParts = [
    if (!isPlaceholder(city)) city,
    if (!isPlaceholder(state)) state,
    if (pincode.isNotEmpty && pincode != '110001') pincode,
  ];

  if (cityStatePinParts.isNotEmpty) {
    parts.add(cityStatePinParts.join(', '));
  }

  if (parts.isEmpty) {
    if (full.isNotEmpty && full != 'Address to be confirmed') return full;
    return [
      if (!isPlaceholder(city)) city,
      if (!isPlaceholder(state)) state,
      if (pincode.isNotEmpty) pincode,
    ].join(', ');
  }

  return parts.join(', ');
}

Map<String, String> mapAddressToForm(Address address) {
  return {
    'fullName': address.fullName,
    'number': address.number,
    'email': address.email,
    'shopNo': address.shopNo,
    'shopName': address.shopName,
    'fullAddress': address.fullAddress,
    'landmark': address.landmark,
    'area': address.area.isNotEmpty ? address.area : address.landmark,
    'city': address.city,
    'state': address.state,
    'pincode': address.pincode,
  };
}

String? validateAddressForm(Map<String, String> form) {
  final fullName = form['fullName']?.trim() ?? '';
  final number = form['number']?.trim() ?? '';
  final email = form['email']?.trim() ?? '';
  final shopNo = form['shopNo']?.trim() ?? '';
  final shopName = form['shopName']?.trim() ?? '';
  final fullAddress = form['fullAddress']?.trim() ?? '';
  final landmark = form['landmark']?.trim() ?? '';
  final area = form['area']?.trim() ?? '';
  final city = form['city']?.trim() ?? '';
  final state = form['state']?.trim() ?? '';
  final pincode = form['pincode']?.trim() ?? '';

  if (fullName.isEmpty) return 'Full name is required';
  if (number.isEmpty) return 'Phone number is required';
  if (!RegExp(r'^[6789]\d{9}$').hasMatch(number)) {
    return 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
  }
  if (email.isEmpty) return 'Email is required';
  if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
    return 'Enter a valid email address';
  }
  if (shopNo.isEmpty) return 'House / flat number is required';
  if (shopName.isEmpty) return 'Building / society name is required';
  if (fullAddress.isEmpty) return 'Street address is required';
  if (area.isEmpty && landmark.isEmpty) return 'Area or landmark is required';
  if (city.isEmpty) return 'City is required';
  if (state.isEmpty) return 'State is required';
  if (pincode.isEmpty) return 'Pincode is required';
  if (!RegExp(r'^\d{6}$').hasMatch(pincode)) return 'Pincode must be 6 digits';
  return null;
}
