class UserFriendlyError {
  UserFriendlyError._();

  /// Converts any technical error, exception, or raw backend message into a clear,
  /// non-technical message that regular users can easily understand.
  static String toHumanMessage(
    dynamic error, {
    String defaultMessage = 'Something went wrong. Please check your details and try again.',
  }) {
    if (error == null) return defaultMessage;

    final raw = error
        .toString()
        .replaceAll('Exception:', '')
        .replaceAll('ApiException:', '')
        .replaceAll('ClientException with SocketException:', '')
        .trim();

    final lower = raw.toLowerCase();

    // 1. Network & Connectivity
    if (lower.contains('socketexception') ||
        lower.contains('failed host lookup') ||
        lower.contains('network is unreachable') ||
        lower.contains('connection refused') ||
        lower.contains('connection reset') ||
        lower.contains('clientexception') ||
        lower.contains('no address associated') ||
        lower.contains('network error') ||
        lower.contains('offline')) {
      return 'Unable to connect. Please check your mobile internet or WiFi connection.';
    }

    if (lower.contains('timeoutexception') ||
        lower.contains('timed out') ||
        lower.contains('deadline exceeded')) {
      return 'Connection timed out. Please check your internet connection and try again.';
    }

    if (lower.contains('handshake') ||
        lower.contains('certificate') ||
        lower.contains('tls') ||
        lower.contains('ssl')) {
      return 'Unable to establish secure connection. Please verify your device date and time.';
    }

    // 2. Authentication & Login
    if (lower.contains('invalid credentials') ||
        lower.contains('invalid password') ||
        lower.contains('wrong password') ||
        lower.contains('incorrect password') ||
        lower.contains('invalid login credentials') ||
        lower.contains('bad credentials') ||
        lower.contains('password does not match')) {
      return 'Incorrect mobile/email or password. Please verify and try again.';
    }

    if (lower.contains('account is deactivated') ||
        lower.contains('account is disabled') ||
        lower.contains('deactivated') ||
        lower.contains('inactive')) {
      return 'Your staff account is currently inactive. Please contact HR or your manager.';
    }

    if (lower.contains('staff account not found') ||
        lower.contains('staff not found') ||
        lower.contains('user not found') ||
        lower.contains('account not found') ||
        lower.contains('not registered')) {
      return 'No account found with these details. Please check your mobile number or email.';
    }

    if (lower.contains('email or phone and password are required') ||
        lower.contains('required')) {
      return 'Please enter both your mobile number/email and password.';
    }

    if (lower.contains('only') && lower.contains('login')) {
      return 'This account is not authorized for this portal with your assigned role.';
    }

    // 3. OTP & Verification
    if (lower.contains('invalid otp') ||
        lower.contains('incorrect otp') ||
        lower.contains('wrong otp') ||
        lower.contains('otp does not match')) {
      return 'The OTP you entered is incorrect. Please check the code and try again.';
    }

    if (lower.contains('otp expired') || lower.contains('expired')) {
      return 'The verification code has expired. Please tap "Resend OTP" to receive a new code.';
    }

    if (lower.contains('failed to send otp') || lower.contains('otp request failed')) {
      return 'Unable to send OTP at the moment. Please verify your mobile number and retry.';
    }

    // 4. HTTP Status Codes
    if (lower.contains('status 401') || lower.contains('unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }

    if (lower.contains('status 403') || lower.contains('forbidden')) {
      return 'Access denied. You do not have permission for this action.';
    }

    if (lower.contains('status 404') || lower.contains('not found')) {
      return 'The requested record or service could not be found.';
    }

    if (lower.contains('status 500') ||
        lower.contains('status 502') ||
        lower.contains('status 503') ||
        lower.contains('status 504') ||
        lower.contains('internal server error')) {
      return 'Our servers are temporarily busy. Please try again in a few moments.';
    }

    // 5. Punch / Attendance / Leave
    if (lower.contains('already clocked in') ||
        lower.contains('already punched') ||
        lower.contains('attendance already')) {
      return 'You have already recorded your attendance for today.';
    }

    if (lower.contains('leave balance') || lower.contains('insufficient balance')) {
      return 'You do not have enough leave days remaining for this request.';
    }

    // 6. Clean message fallback (if it's already a concise sentence without tech jargon)
    if (!lower.contains('{') &&
        !lower.contains('http') &&
        !lower.contains('error:') &&
        !lower.contains('exception') &&
        !lower.contains('status code') &&
        !lower.contains('localhost') &&
        raw.length < 100 &&
        raw.isNotEmpty) {
      return raw;
    }

    return defaultMessage;
  }
}
