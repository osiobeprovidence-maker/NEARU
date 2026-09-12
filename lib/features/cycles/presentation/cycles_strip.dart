import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/cycle_model.dart';
import '../../../services/convex_service.dart';

final cyclesStreamProvider = FutureProvider<List<CycleModel>>((ref) async {
  final convexService = ref.watch(convexServiceProvider);
  return await convexService.fetchCycles();
});

class CyclesStrip extends ConsumerWidget {
  const CyclesStrip({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cyclesAsync = ref.watch(cyclesStreamProvider);

    return SizedBox(
      height: 90,
      child: cyclesAsync.when(
        data: (cycles) {
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: cycles.length + 1, // +1 for the "Add Story" button
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, idx) {
              if (idx == 0) {
                return _buildAddStory(context);
              }

              final cycle = cycles[idx - 1];
              return _buildCycleAvatar(context, cycle);
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildAddStory(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: AppColors.zinc300,
              width: 2,
            ),
          ),
          child: const Padding(
            padding: EdgeInsets.all(2),
            child: CircleAvatar(
              backgroundColor: AppColors.zinc100,
              child: Icon(LucideIcons.plus, color: AppColors.zinc900, size: 22),
            ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Your Story',
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AppColors.zinc800,
          ),
        ),
      ],
    );
  }

  Widget _buildCycleAvatar(BuildContext context, CycleModel cycle) {
    return GestureDetector(
      onTap: () => context.push('/story/${cycle.userId}', extra: cycle),
      child: Column(
        children: [
          Container(
            width: 58,
            height: 58,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.emerald500,
                width: 2,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(2),
              child: CircleAvatar(
                backgroundImage: NetworkImage(cycle.userAvatar),
                backgroundColor: AppColors.zinc100,
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            cycle.userName,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppColors.zinc800,
            ),
          ),
        ],
      ),
    );
  }
}
