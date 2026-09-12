import 'package:convex_flutter/convex_flutter.dart';

/// Repository handling verification related backend calls.
class VerificationRepository {
  final ConvexClient _client;

  VerificationRepository(this._client);

  /// Verify the provided NIN. Returns true on success.
  Future<bool> verifyNIN(String nin) async {
    final result = await _client.mutation(
      name: 'nin:verify',
      args: {'nin': nin},
    );
    return result == true;
  }

  /// Send an OTP to the given phone number. Returns true if sent.
  Future<bool> sendPhoneOtp(String phone) async {
    final result = await _client.mutation(
      name: 'auth:sendPhoneOtp',
      args: {'phone': phone},
    );
    return result == true;
  }

  /// Verify the OTP for a phone number. Returns true on successful verification.
  Future<bool> verifyPhoneOtp(String phone, String otp) async {
    final result = await _client.mutation(
      name: 'auth:verifyPhoneOtp',
      args: {'phone': phone, 'otp': otp},
    );
    return result == true;
  }

  /// Fetch the latest APK download URL from the backend.
  Future<String?> fetchApkUrl() async {
    final result = await _client.query(name: 'app:getApkUrl');
    if (result is String) return result;
    return null;
  }
}
