import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../services/auth_service.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      body: CustomScrollView(
        slivers: [
          // Profile header
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [AppColors.zinc900, AppColors.zinc700],
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 16,
                    left: 20,
                    right: 20,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 42,
                          backgroundImage: user != null && user.avatar.isNotEmpty
                              ? NetworkImage(user.avatar)
                              : null,
                          backgroundColor: AppColors.zinc600,
                          child: (user == null || user.avatar.isEmpty)
                              ? const Icon(LucideIcons.user,
                                  color: Colors.white, size: 40)
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    user?.name ?? 'Lalao User',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                  if (user?.isBlueVerified == true) ...[
                                    const SizedBox(width: 6),
                                    const Icon(LucideIcons.badgeCheck,
                                        color: AppColors.indigo500, size: 18),
                                  ],
                                  if (user?.isNINVerified == true) ...[
                                    const SizedBox(width: 4),
                                    const Icon(LucideIcons.shieldCheck,
                                        color: AppColors.emerald500, size: 18),
                                  ],
                                ],
                              ),
                              Text(
                                '@${user?.username ?? 'user'}',
                                style: const TextStyle(
                                  color: AppColors.zinc300,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (user?.location != null) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(LucideIcons.mapPin,
                                        color: AppColors.zinc400, size: 12),
                                    const SizedBox(width: 4),
                                    Text(
                                      user!.location!,
                                      style: const TextStyle(
                                        color: AppColors.zinc400,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              IconButton(
                onPressed: () => context.push('/settings'),
                icon: const Icon(LucideIcons.settings, color: AppColors.zinc900),
              ),
            ],
          ),

          // Bio + stats
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (user?.bio != null) ...[
                    Text(
                      user!.bio!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.zinc700,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],
                  Row(
                    children: [
                      _StatChip(label: 'Rallies', value: '24'),
                      const SizedBox(width: 12),
                      _StatChip(label: 'Friends', value: '342'),
                      const SizedBox(width: 12),
                      _StatChip(label: 'Followers', value: '1.2K'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(LucideIcons.edit3, size: 16),
                          label: const Text('Edit Profile'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.zinc900,
                            side: const BorderSide(color: AppColors.zinc200),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: () => context.push('/settings'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.zinc900,
                          side: const BorderSide(color: AppColors.zinc200),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Icon(LucideIcons.settings, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // Badges row
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Badges',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.zinc900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _BadgeChip(
                        icon: LucideIcons.shieldCheck,
                        label: 'NIN Verified',
                        color: AppColors.emerald600,
                        bg: AppColors.emerald50,
                        active: user?.isNINVerified ?? false,
                      ),
                      const SizedBox(width: 8),
                      _BadgeChip(
                        icon: LucideIcons.badgeCheck,
                        label: 'Blue Verified',
                        color: AppColors.indigo600,
                        bg: AppColors.indigo50,
                        active: user?.isBlueVerified ?? false,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 8)),

          // Admin section
          if (user?.role == 'admin' || user?.role == 'super_admin')
            SliverToBoxAdapter(
              child: InkWell(
                onTap: () => context.push('/admin'),
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.indigo50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.layoutDashboard,
                            color: AppColors.indigo600, size: 20),
                      ),
                      const SizedBox(width: 14),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Admin Dashboard',
                                style: TextStyle(
                                  fontWeight: FontWeight.w800,
                                  fontSize: 15,
                                  color: AppColors.zinc900,
                                )),
                            Text('Manage users, rallies & analytics',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.zinc500,
                                )),
                          ],
                        ),
                      ),
                      const Icon(LucideIcons.chevronRight,
                          color: AppColors.zinc400),
                    ],
                  ),
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 24)),

          // Sign out
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ElevatedButton.icon(
                onPressed: () {
                  ref.read(authProvider.notifier).logout();
                  context.go('/login');
                },
                icon: const Icon(LucideIcons.logOut, size: 16),
                label: const Text('Sign Out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.rose600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  minimumSize: const Size(double.infinity, 52),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;

  const _StatChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: AppColors.zinc900,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            color: AppColors.zinc500,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

class _BadgeChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color bg;
  final bool active;

  const _BadgeChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.bg,
    required this.active,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: active ? bg : AppColors.zinc100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? color.withOpacity(0.3) : AppColors.zinc200,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: active ? color : AppColors.zinc400),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: active ? color : AppColors.zinc400,
            ),
          ),
        ],
      ),
    );
  }
}
