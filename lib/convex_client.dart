import 'package:convex_flutter/convex_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provides a singleton [ConvexClient] for the app.
final convexClientProvider = Provider<ConvexClient>((ref) {
  // TODO: Replace with your actual Convex deployment URL.
  const devUrl = 'https://dev-1c1d6e8d.convex.cloud';
  return ConvexClient(url: devUrl);
});
