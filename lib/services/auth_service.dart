import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import 'convex_service.dart';

final convexServiceProvider = Provider<ConvexService>((ref) {
  return ConvexService();
});

class AuthState {
  final UserModel? user;
  final bool isLoggedIn;
  final bool isLoading;

  AuthState({
    this.user,
    this.isLoggedIn = false,
    this.isLoading = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoggedIn,
    bool? isLoading,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoggedIn: isLoggedIn ?? this.isLoggedIn,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ConvexService _convexService;

  AuthNotifier(this._convexService)
      : super(AuthState(
          user: UserModel(
            id: 'u1',
            name: 'Providence Osiobe',
            username: 'osiobeprovidence',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
            email: 'osiobeprovidence@gmail.com',
            isNINVerified: true,
            isBlueVerified: true,
            role: 'super_admin',
            location: 'Lagos, Nigeria',
            bio: 'Building Lalao — Nigerian-first local community platform.',
          ),
          isLoggedIn: true,
          isLoading: false,
        ));

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true);
    await Future.delayed(const Duration(milliseconds: 600));
    state = state.copyWith(
      isLoggedIn: true,
      isLoading: false,
    );
  }

  void logout() {
    state = AuthState(isLoggedIn: false, isLoading: false);
  }

  void completeOnboarding() {
    if (state.user != null) {
      final updatedUser = UserModel(
        id: state.user!.id,
        name: state.user!.name,
        username: state.user!.username,
        avatar: state.user!.avatar,
        email: state.user!.email,
        isNINVerified: state.user!.isNINVerified,
        isBlueVerified: state.user!.isBlueVerified,
        role: state.user!.role,
        location: state.user!.location,
        bio: state.user!.bio,
        onboardingCompleted: true,
      );
      state = state.copyWith(user: updatedUser);
    }
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final convexService = ref.watch(convexServiceProvider);
  return AuthNotifier(convexService);
});
