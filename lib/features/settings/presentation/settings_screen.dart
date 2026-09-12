import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../repositories/verification_repository.dart';
import '../../providers/verification_repository_provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../services/auth_service.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: ListView(
        children: [
          // Profile summary card
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: user != null && user.avatar.isNotEmpty
                      ? NetworkImage(user.avatar)
                      : null,
                  backgroundColor: AppColors.zinc200,
                  child: (user == null || user.avatar.isEmpty)
                      ? const Icon(LucideIcons.user,
                          color: AppColors.zinc500, size: 28)
                      : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user?.name ?? 'Lalao User',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: AppColors.zinc900,
                        ),
                      ),
                      Text(
                        '@${user?.username ?? 'user'}',
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.zinc500,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(LucideIcons.chevronRight, color: AppColors.zinc400),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Account section
          _SectionHeader(title: 'Account'),
          _SettingsItem(
            icon: LucideIcons.user,
            title: 'Edit Profile',
            subtitle: 'Update your name, bio and photo',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.mail,
            title: 'Email Address',
            subtitle: user?.email ?? 'Not set',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.lock,
            title: 'Change Password',
            subtitle: 'Update your account password',
            onTap: () {},
          ),

          const SizedBox(height: 8),

          // Verification section
          _SectionHeader(title: 'Verification & Identity'),
          _SettingsItem(
            icon: LucideIcons.shieldCheck,
            title: 'NIN Verification',
            subtitle: user?.isNINVerified == true
                ? 'Verified ✓'
                : 'Verify your identity',
            iconColor: AppColors.emerald600,
            onTap: () => context.push('/verification'),
          ),
          _SettingsItem(
            icon: LucideIcons.badgeCheck,
            title: 'Blue Verification',
            subtitle: user?.isBlueVerified == true
                ? 'Verified ✓'
                : 'Get your blue badge',
            iconColor: AppColors.indigo600,
            onTap: () {},
          ),

          const SizedBox(height: 8),

          // Privacy & Safety section
          _SectionHeader(title: 'Privacy & Safety'),
          _SettingsItem(
            icon: LucideIcons.eyeOff,
            title: 'Privacy Controls',
            subtitle: 'Control who can see your profile',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.mapPin,
            title: 'Location Radius',
            subtitle: 'Set your community discovery radius',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.userX,
            title: 'Blocked Users',
            subtitle: 'Manage your blocked list',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.phoneCall,
            title: 'Emergency Contacts',
            subtitle: 'Add trusted emergency contacts',
            iconColor: AppColors.rose600,
            onTap: () {},
          ),

          const SizedBox(height: 8),

          // Notifications section
          _SectionHeader(title: 'Notifications'),
          _SettingsItem(
            icon: LucideIcons.bell,
            title: 'Push Notifications',
            subtitle: 'Manage alerts and alerts',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.messageSquare,
            title: 'Message Notifications',
            subtitle: 'Control message alerts',
            onTap: () {},
          ),

          const SizedBox(height: 8),

          // App section
          _SectionHeader(title: 'App'),
          _SettingsItem(
            icon: LucideIcons.smartphone,
            title: 'Download Lalao App',
            subtitle: 'Get the latest Lalao Android app',
            iconColor: AppColors.indigo600,
            trailing: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.indigo50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'APK',
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  color: AppColors.indigo600,
                ),
              ),
            ),
            onTap: () => _showDownloadModal(context),
          ),
          _SettingsItem(
            icon: LucideIcons.info,
            title: 'About Lalao',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),
          _SettingsItem(
            icon: LucideIcons.fileText,
            title: 'Terms & Privacy',
            subtitle: 'Read our policies',
            onTap: () {},
          ),

          const SizedBox(height: 8),

          // Sign out
          Padding(
            padding: const EdgeInsets.all(20),
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

          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showDownloadModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _DownloadModal(),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.zinc50,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: AppColors.zinc400,
          letterSpacing: 0.8,
        ),
      ),
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color? iconColor;
  final Widget? trailing;
  final VoidCallback? onTap;

  const _SettingsItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(color: AppColors.zinc100, width: 0.5),
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color:
                      (iconColor ?? AppColors.zinc600).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon,
                    size: 18, color: iconColor ?? AppColors.zinc600),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.zinc900,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.zinc500,
                      ),
                    ),
                  ],
                ),
              ),
              trailing ??
                  const Icon(LucideIcons.chevronRight,
                      color: AppColors.zinc300, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _DownloadModal extends ConsumerWidget {
  const _DownloadModal();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle bar
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.zinc200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 28),

          // Android icon
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.indigo600, AppColors.indigo700],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: AppColors.indigo600.withOpacity(0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(LucideIcons.smartphone,
                color: Colors.white, size: 38),
          ),

          const SizedBox(height: 20),
          const Text(
            'Download Lalao for Android',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: AppColors.zinc900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Get the latest version of Lalao for Android.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.zinc500,
              height: 1.5,
            ),
          ),

          const SizedBox(height: 6),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.zinc100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Version 1.0.0',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.zinc500,
              ),
            ),
          ),

          const SizedBox(height: 28),

          // Download button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () async {
                final repo = ref.read(verificationRepositoryProvider);
                final url = await repo.fetchApkUrl();
                if (url != null) {
                  final uri = Uri.parse(url);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                }
              },
              icon: const Icon(LucideIcons.download, size: 18),
              label: const Text(
                'Download APK',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.zinc900,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Maybe Later',
              style: TextStyle(color: AppColors.zinc400),
            ),
          ),
        ],
      ),
    );
  }
}
