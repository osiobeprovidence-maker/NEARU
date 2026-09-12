import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/verification_repository.dart';
import '../convex_client.dart';

/// Provides a [VerificationRepository] instance using the shared [ConvexClient].
final verificationRepositoryProvider = Provider<VerificationRepository>((ref) {
  final client = ref.watch(convexClientProvider);
  return VerificationRepository(client);
});
