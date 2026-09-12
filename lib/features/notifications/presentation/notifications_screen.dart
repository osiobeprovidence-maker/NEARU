import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifications = [
      {
        'title': 'Amina joined your RALLY',
        'desc': 'Saturday 5km Morning Jog in Yaba',
        'icon': LucideIcons.users,
        'color': AppColors.indigo600,
        'time': '10 mins ago',
      },
      {
        'title': 'NIN Identity Verified',
        'desc': 'Your National ID has been verified. Verified badge active.',
        'icon': LucideIcons.checkCircle2,
        'color': AppColors.emerald600,
        'time': '2 hours ago',
      },
    ];

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, idx) {
          final notif = notifications[idx];
          return Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(12),
              leading: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (notif['color'] as Color).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  notif['icon'] as IconData,
                  color: notif['color'] as Color,
                  size: 22,
                ),
              ),
              title: Text(
                notif['title'] as String,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.zinc900),
              ),
              subtitle: Text(
                notif['desc'] as String,
                style: const TextStyle(fontSize: 12, color: AppColors.zinc500),
              ),
              trailing: Text(
                notif['time'] as String,
                style: const TextStyle(fontSize: 10, color: AppColors.zinc400),
              ),
            ),
          );
        },
      ),
    );
  }
}
