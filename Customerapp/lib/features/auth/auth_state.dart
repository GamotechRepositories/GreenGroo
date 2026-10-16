import '../../models/user.dart';

enum AuthModalMode { login, signup }

class AuthState {
  const AuthState({
    this.user,
    this.token,
    this.loading = false,
    this.authModal,
    this.redirectRoute,
  });

  final User? user;
  final String? token;
  final bool loading;
  final AuthModalMode? authModal;
  final String? redirectRoute;

  bool get isLoggedIn => user != null && token != null;

  AuthState copyWith({
    User? user,
    String? token,
    bool? loading,
    AuthModalMode? authModal,
    String? redirectRoute,
    bool clearUser = false,
    bool clearToken = false,
    bool clearAuthModal = false,
    bool clearRedirectRoute = false,
  }) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      token: clearToken ? null : (token ?? this.token),
      loading: loading ?? this.loading,
      authModal: clearAuthModal ? null : (authModal ?? this.authModal),
      redirectRoute: clearRedirectRoute
          ? null
          : (redirectRoute ?? this.redirectRoute),
    );
  }
}
