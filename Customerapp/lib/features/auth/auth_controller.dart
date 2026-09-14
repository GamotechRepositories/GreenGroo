import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/exceptions/api_exception.dart';
import '../../core/providers/app_providers.dart';
import '../../models/user.dart';
import 'auth_state.dart';

final authControllerProvider =
    NotifierProvider<AuthController, AuthState>(AuthController.new);

class OtpVerifyResult {
  const OtpVerifyResult({
    this.needsSignup = false,
    this.phone,
    this.user,
  });

  final bool needsSignup;
  final String? phone;
  final User? user;
}

class AuthController extends Notifier<AuthState> {
  @override
  AuthState build() {
    Future<void>.delayed(const Duration(milliseconds: 500), _restoreSession);
    return const AuthState();
  }

  Future<void> _restoreSession() async {
    final storage = ref.read(authStorageProvider);
    final savedToken = storage.token;

    if (savedToken == null || savedToken.isEmpty) {
      state = const AuthState(loading: false);
      return;
    }

    try {
      final user = await ref.read(apiServiceProvider).fetchMe();
      if (user.isAdmin) {
        await storage.clear();
        state = const AuthState(loading: false);
        return;
      }

      await storage.saveSession(user: user.toJson(), token: savedToken);
      state = AuthState(user: user, token: savedToken, loading: false);
    } catch (_) {
      await storage.clear();
      state = const AuthState(loading: false);
    }
  }

  void openAuthModal([AuthModalMode mode = AuthModalMode.login]) {
    state = state.copyWith(authModal: mode);
  }

  void closeAuthModal() {
    state = state.copyWith(clearAuthModal: true);
  }

  void setAuthModal(AuthModalMode mode) {
    state = state.copyWith(authModal: mode);
  }

  Future<void> sendOtp(String phone, {String purpose = 'login'}) async {
    await ref.read(apiServiceProvider).sendOtp(
          phone.trim(),
          purpose: purpose,
        );
  }

  Future<OtpVerifyResult> verifyOtp({
    required String phone,
    required String otp,
    String? name,
    String? shopName,
    String? shopAddress,
    String? gstNumber,
  }) async {
    final payload = <String, dynamic>{
      'phone': phone.trim(),
      'otp': otp.trim(),
    };
    final trimmedName = name?.trim();
    if (trimmedName != null && trimmedName.isNotEmpty) {
      payload['name'] = trimmedName;
    }
    final trimmedShopName = shopName?.trim();
    if (trimmedShopName != null && trimmedShopName.isNotEmpty) {
      payload['shopName'] = trimmedShopName;
    }
    final trimmedShopAddress = shopAddress?.trim();
    if (trimmedShopAddress != null && trimmedShopAddress.isNotEmpty) {
      payload['shopAddress'] = trimmedShopAddress;
    }
    final trimmedGst = gstNumber?.trim().toUpperCase();
    if (trimmedGst != null && trimmedGst.isNotEmpty) {
      payload['gstNumber'] = trimmedGst;
    }

    final body = await ref.read(apiServiceProvider).verifyOtp(payload);

    if (body['needsSignup'] == true) {
      return OtpVerifyResult(
        needsSignup: true,
        phone: body['phone']?.toString() ?? phone.trim(),
      );
    }

    final session = AuthSession(
      user: User.fromJson(body['user'] as Map<String, dynamic>),
      token: body['token']?.toString() ?? '',
    );

    if (session.user.isAdmin) {
      throw ApiException('Please use the admin panel to sign in.');
    }

    await _persistSession(session);
    return OtpVerifyResult(user: session.user);
  }

  Future<User> completeOtpSignupProfile({
    required String phone,
    required String name,
    required String shopName,
    required String shopAddress,
    String? gstNumber,
  }) async {
    final payload = <String, dynamic>{
      'phone': phone.trim(),
      'name': name.trim(),
      'shopName': shopName.trim(),
      'shopAddress': shopAddress.trim(),
    };
    final trimmedGst = gstNumber?.trim().toUpperCase();
    if (trimmedGst != null && trimmedGst.isNotEmpty) {
      payload['gstNumber'] = trimmedGst;
    }

    final session =
        await ref.read(apiServiceProvider).completeOtpSignupProfile(payload);

    if (session.user.isAdmin) {
      throw ApiException('Please use the admin panel to sign in.');
    }

    await _persistSession(session);
    return session.user;
  }

  Future<void> logout() async {
    await ref.read(authStorageProvider).clear();
    state = const AuthState(loading: false);
  }

  Future<String?> updateProfile(Map<String, dynamic> data) async {
    if (state.user == null) return 'Not signed in';

    try {
      final user = await ref.read(apiServiceProvider).updateProfile(data);
      await ref.read(authStorageProvider).saveSession(
            user: user.toJson(),
            token: state.token ?? '',
          );
      state = state.copyWith(user: user);
      return null;
    } catch (e) {
      return authErrorMessage(e);
    }
  }

  Future<void> _persistSession(AuthSession session) async {
    await ref.read(authStorageProvider).saveSession(
          user: session.user.toJson(),
          token: session.token,
        );
    state = state.copyWith(
      user: session.user,
      token: session.token,
      loading: false,
      clearAuthModal: true,
    );
  }
}

String authErrorMessage(Object error) => apiErrorMessage(error);
