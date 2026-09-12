import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/auth_service.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/onboarding_screen.dart';
import '../../features/feed/presentation/home_feed_screen.dart';
import '../../features/explore/presentation/explore_screen.dart';
import '../../features/messages/presentation/conversations_screen.dart';
import '../../features/messages/presentation/chat_screen.dart';
import '../../features/cycles/presentation/story_viewer_screen.dart';
import '../../models/cycle_model.dart';
import '../../models/message_model.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/rally/presentation/rally_detail_screen.dart';
import '../../features/rally/presentation/create_rally_screen.dart';
import '../../features/safety/presentation/verification_screen.dart';
import '../../features/settings/presentation/settings_screen.dart';
import '../../features/admin/presentation/admin_dashboard_screen.dart';
import '../widgets/lalao_app_shell.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState.isLoggedIn;
      final isLoggingIn = state.matchedLocation == '/login';

      if (!isLoggedIn && !isLoggingIn) {
        return '/login';
      }
      if (isLoggedIn && isLoggingIn) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),

      // Main Navigation Shell (Bottom Navigation Bar)
      ShellRoute(
        builder: (context, state, child) {
          return LalaoAppShell(currentPath: state.matchedLocation, child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) => const HomeFeedScreen(),
          ),
          GoRoute(
            path: '/explore',
            builder: (context, state) => const ExploreScreen(),
          ),
          GoRoute(
            path: '/messages',
            builder: (context, state) => const ConversationsScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
        ],
      ),

      // Full screen modal routes
      GoRoute(
        path: '/rally/create',
        builder: (context, state) => const CreateRallyScreen(),
      ),
      GoRoute(
        path: '/rally/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return RallyDetailScreen(rallyId: id);
        },
      ),
      GoRoute(
        path: '/verification',
        builder: (context, state) => const VerificationScreen(),
      ),
      GoRoute(
        path: '/settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => const AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final extra = state.extra as ConversationModel?;
          return ChatScreen(conversationId: id, conversation: extra);
        },
      ),
      GoRoute(
        path: '/story/:userId',
        builder: (context, state) {
          final extra = state.extra as CycleModel;
          return StoryViewerScreen(cycle: extra);
        },
      ),
    ],
  );
});
