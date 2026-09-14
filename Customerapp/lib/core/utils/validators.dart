class Validators {
  Validators._();

  static final RegExp _phonePattern = RegExp(r'^[6789]\d{9}$');
  static final RegExp _pincodePattern = RegExp(r'^\d{6}$');
  static final RegExp _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

  static bool isValidName(String value) {
    final words = value.trim().split(RegExp(r'\s+'));
    if (words.isEmpty || words.length > 2) return false;
    return words.every((word) => RegExp(r'^[A-Za-z]{2,30}$').hasMatch(word));
  }

  static bool isValidPhone(String value) => _phonePattern.hasMatch(value.trim());

  static bool isValidEmail(String value) =>
      _emailPattern.hasMatch(value.trim().toLowerCase());

  static bool isValidPincode(String value) =>
      _pincodePattern.hasMatch(value.trim());

  static final RegExp _gstPattern = RegExp(
    r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$',
  );

  static bool isValidGst(String value) =>
      _gstPattern.hasMatch(value.trim().toUpperCase());

  static bool isValidShopName(String value) =>
      value.trim().length >= 2;

  static bool isValidShopAddress(String value) =>
      value.trim().length >= 5;

  static bool isValidPassword(String value) => value.length >= 6;
}
