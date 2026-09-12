import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/routing/app_router.dart';
import 'core/theme/lalao_theme.dart';

class LalaoApp extends ConsumerWidget {
  const LalaoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Lalao',
      debugShowCheckedModeBanner: false,
      theme: LalaoTheme.light(),
      routerConfig: router,
    );
  }
}
