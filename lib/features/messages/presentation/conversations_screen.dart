import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/message_model.dart';
import '../../../services/convex_service.dart';

final conversationsProvider = FutureProvider<List<ConversationModel>>((ref) async {
  final convexService = ref.watch(convexServiceProvider);
  return await convexService.fetchConversations();
});

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final convsAsync = ref.watch(conversationsProvider);

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.userPlus, size: 20),
            onPressed: () {},
          ),
        ],
      ),
      body: convsAsync.when(
        data: (chats) {
          if (chats.isEmpty) {
            return const Center(
              child: Text('No conversations yet', style: TextStyle(color: AppColors.zinc500)),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: chats.length,
            separatorBuilder: (_, __) => const Divider(height: 1, color: AppColors.zinc200),
            itemBuilder: (context, idx) {
              final chat = chats[idx];
              final unread = chat.unreadCount;

              return ListTile(
                onTap: () => context.push('/chat/${chat.id}', extra: chat),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                leading: CircleAvatar(
                  radius: 24,
                  backgroundImage: NetworkImage(chat.otherUserAvatar),
                ),
                title: Text(
                  chat.otherUserName,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.zinc900),
                ),
                subtitle: Text(
                  chat.lastMessageText,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: unread > 0 ? FontWeight.w700 : FontWeight.w500,
                    color: unread > 0 ? AppColors.zinc900 : AppColors.zinc500,
                  ),
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatTime(chat.timestamp),
                      style: const TextStyle(fontSize: 11, color: AppColors.zinc400),
                    ),
                    if (unread > 0) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: AppColors.indigo600,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '$unread',
                          style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  String _formatTime(int timestamp) {
    // Simple format for mockup
    final dt = DateTime.fromMillisecondsSinceEpoch(timestamp);
    final now = DateTime.now();
    if (dt.day == now.day && dt.month == now.month && dt.year == now.year) {
      return '${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
    }
    return 'Yesterday';
  }
}
