import '../../models/user.dart';

enum AuthModalMode { login, signup }

class AuthState {
  const AuthState({
    this.user,
    this.token,
    this.loading = false,
    this.authModal,
  });

  final User? user;
  final String? token;
  final bool loading;
  final AuthModalMode? authModal;

  bool get isLoggedIn => user != null && token != null;

  AuthState copyWith({
    User? user,
    String? token,
    bool? loading,
    AuthModalMode? authModal,
    bool clearUser = false,
    bool clearToken = false,
    bool clearAuthModal = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      token: clearToken ? null : (token ?? this.token),
      loading: loading ?? this.loading,
      authModal: clearAuthModal ? null : (authModal ?? this.authModal),
    );
  }
}
