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
    this.status = 'active',
    this.isActive = true,
    this.rawBlocked = false,
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
  final String status;
  final bool isActive;
  final bool rawBlocked;

  bool get isAdmin => role.trim().toLowerCase() == 'admin';

  bool get isBlocked =>
      isAdmin ||
      rawBlocked ||
      status.trim().toLowerCase() == 'blocked' ||
      status.trim().toLowerCase() == 'inactive' ||
      !isActive;

  String get blockedMessage {
    if (isAdmin) {
      return 'Please use the admin panel to sign in.';
    }
    return 'Your account has been blocked by admin. Please contact support.';
  }

  String get contactLabel =>
      email.trim().isNotEmpty ? email.trim() : phone.trim();

  factory User.fromJson(Map<String, dynamic> json) {
    final statusStr = json['status']?.toString() ?? 'active';
    final isActiveBool = json['isActive'] is bool
        ? json['isActive'] as bool
        : json['active'] is bool
            ? json['active'] as bool
            : true;
    final isBlockedBool = json['isBlocked'] == true ||
        json['blocked'] == true ||
        statusStr.trim().toLowerCase() == 'blocked';

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
      status: statusStr,
      isActive: isActiveBool,
      rawBlocked: isBlockedBool,
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
        'status': status,
        'isActive': isActive,
        'isBlocked': rawBlocked,
      };
}

class AuthSession {
  const AuthSession({required this.user, required this.token});

  final User user;
  final String token;
}
