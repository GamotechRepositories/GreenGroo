class User {
  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    this.shopNo = '',
    this.shopName = '',
    this.shopAddress = '',
    this.gstNumber = '',
    this.accountType = 'retail',
    this.ownerContact = '',
    this.role = 'user',
  });

  final String id;
  final String name;
  final String email;
  final String phone;
  final String shopNo;
  final String shopName;
  final String shopAddress;
  final String gstNumber;
  final String accountType;
  final String ownerContact;
  final String role;

  bool get isAdmin => role == 'admin';

  String get contactLabel =>
      email.trim().isNotEmpty ? email.trim() : phone.trim();

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      shopNo: json['shopNo']?.toString() ?? '',
      shopName: json['shopName']?.toString() ?? '',
      shopAddress: json['shopAddress']?.toString() ?? '',
      gstNumber: json['gstNumber']?.toString() ?? '',
      accountType: json['accountType']?.toString() ?? 'retail',
      ownerContact: json['ownerContact']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
    );
  }

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'shopNo': shopNo,
        'shopName': shopName,
        'shopAddress': shopAddress,
        'gstNumber': gstNumber,
        'accountType': accountType,
        'ownerContact': ownerContact,
        'role': role,
      };
}

class AuthSession {
  const AuthSession({required this.user, required this.token});

  final User user;
  final String token;
}
