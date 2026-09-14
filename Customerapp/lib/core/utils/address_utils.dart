import '../../models/address.dart';

String getAddressFullName(Address address) {
  return address.fullName.isNotEmpty ? address.fullName : '';
}

String formatAddressLine(Address address) {
  final parts = <String>[
    if (address.shopName.isNotEmpty) address.shopName,
    if (address.shopNo.isNotEmpty) 'Shop ${address.shopNo}',
    if (address.fullAddress.isNotEmpty) address.fullAddress,
    if (address.landmark.isNotEmpty) address.landmark,
    [address.city, address.state, address.pincode].where((p) => p.isNotEmpty).join(', '),
  ];
  return parts.where((part) => part.isNotEmpty).join(', ');
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
    'city': address.city,
    'state': address.state,
    'pincode': address.pincode,
  };
}

String? validateAddressForm(Map<String, String> form) {
  if (form['fullName']?.trim().isEmpty ?? true) return 'Full name is required';
  final number = form['number']?.trim() ?? '';
  if (number.isEmpty) return 'Phone number is required';
  if (!RegExp(r'^[6789]\d{9}$').hasMatch(number)) {
    return 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9';
  }
  final email = form['email']?.trim() ?? '';
  if (email.isEmpty) return 'Email is required';
  if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
    return 'Enter a valid email address';
  }
  if (form['shopNo']?.trim().isEmpty ?? true) return 'Shop number is required';
  if (form['shopName']?.trim().isEmpty ?? true) return 'Shop name is required';
  if (form['fullAddress']?.trim().isEmpty ?? true) return 'Full address is required';
  if (form['landmark']?.trim().isEmpty ?? true) return 'Landmark is required';
  if (form['city']?.trim().isEmpty ?? true) return 'City is required';
  if (form['state']?.trim().isEmpty ?? true) return 'State is required';
  final pincode = form['pincode']?.trim() ?? '';
  if (pincode.isEmpty) return 'Pincode is required';
  if (!RegExp(r'^\d{6}$').hasMatch(pincode)) return 'Pincode must be 6 digits';
  return null;
}
