import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../constants/app_colors.dart';

class LalaoAppShell extends StatelessWidget {
  final String currentPath;
  final Widget child;

  const LalaoAppShell({
    super.key,
    required this.currentPath,
    required this.child,
  });

  int _calculateSelectedIndex() {
    if (currentPath.startsWith('/explore')) return 1;
    if (currentPath.startsWith('/messages')) return 2;
    if (currentPath.startsWith('/notifications')) return 3;
    if (currentPath.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/');
        break;
      case 1:
        context.go('/explore');
        break;
      case 2:
        context.go('/messages');
        break;
      case 3:
        context.go('/notifications');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedIndex = _calculateSelectedIndex();

    return Scaffold(
      body: child,
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/rally/create'),
        backgroundColor: AppColors.zinc900,
        foregroundColor: AppColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: const Icon(LucideIcons.plus, size: 26),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.zinc200, width: 0.8)),
        ),
        child: BottomNavigationBar(
          currentIndex: selectedIndex,
          onTap: (idx) => _onItemTapped(idx, context),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.home),
              activeIcon: Icon(LucideIcons.home, color: AppColors.zinc900),
              label: 'Feed',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.compass),
              activeIcon: Icon(LucideIcons.compass, color: AppColors.zinc900),
              label: 'Explore',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.messageSquare),
              activeIcon: Icon(LucideIcons.messageSquare, color: AppColors.zinc900),
              label: 'Messages',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.bell),
              activeIcon: Icon(LucideIcons.bell, color: AppColors.zinc900),
              label: 'Alerts',
            ),
            BottomNavigationBarItem(
              icon: Icon(LucideIcons.user),
              activeIcon: Icon(LucideIcons.user, color: AppColors.zinc900),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
