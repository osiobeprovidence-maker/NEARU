import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/rally_model.dart';
import '../../../services/convex_service.dart';
import '../../feed/presentation/home_feed_screen.dart';

class RallyDetailScreen extends ConsumerWidget {
  final String rallyId;

  const RallyDetailScreen({super.key, required this.rallyId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ralliesAsync = ref.watch(ralliesStreamProvider);

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Rally Details'),
      ),
      body: ralliesAsync.when(
        data: (rallies) {
          final rally = rallies.firstWhere(
            (r) => r.id == rallyId,
            orElse: () => RallyModel(
              id: rallyId,
              title: 'Saturday 5km Morning Jog in Yaba',
              description: 'Looking for 3-4 running buddies to hit the road from Sabo to Unilag gate tomorrow at 6:30 AM.',
              type: RallyType.join,
              location: 'Yaba, Lagos',
              creatorId: 'u1',
              creatorName: 'Amina Yusuf',
              creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              isCreatorNINVerified: true,
              participantCount: 4,
              category: 'Fitness',
              timestamp: DateTime.now().millisecondsSinceEpoch,
            ),
          );

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Creator Header
                Row(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: NetworkImage(rally.creatorAvatar),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                rally.creatorName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.zinc900,
                                ),
                              ),
                              if (rally.isCreatorNINVerified) ...[
                                const SizedBox(width: 4),
                                const Icon(LucideIcons.checkCircle2, size: 16, color: AppColors.emerald600),
                              ],
                            ],
                          ),
                          Text(
                            rally.location,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: AppColors.zinc500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Title
                Text(
                  rally.title,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.6,
                    color: AppColors.zinc900,
                  ),
                ),
                const SizedBox(height: 12),

                // Description Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Text(
                      rally.description,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.zinc700,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Attendees & Join Button
                ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Joined RALLY! Creator notified.')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(52),
                  ),
                  icon: const Icon(LucideIcons.userPlus, size: 18),
                  label: const Text('Join This RALLY'),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
