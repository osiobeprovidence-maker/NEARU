import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/rally_model.dart';
import '../../../services/convex_service.dart';
import '../../../services/auth_service.dart';
import '../../cycles/presentation/cycles_strip.dart';

final ralliesStreamProvider = FutureProvider<List<RallyModel>>((ref) async {
  final convexService = ref.watch(convexServiceProvider);
  return await convexService.fetchActiveRallies();
});

class HomeFeedScreen extends ConsumerStatefulWidget {
  const HomeFeedScreen({super.key});

  @override
  ConsumerState<HomeFeedScreen> createState() => _HomeFeedScreenState();
}

class _HomeFeedScreenState extends ConsumerState<HomeFeedScreen> {
  String _selectedFilter = 'ALL';

  @override
  Widget build(BuildContext context) {
    final ralliesAsync = ref.watch(ralliesStreamProvider);
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.zinc900,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Center(
                child: Text(
                  'l',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Text(
              'lalao',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
              ),
            ),
          ],
        ),
        actions: [
          if (user != null && user.isAdmin)
            IconButton(
              icon: const Icon(LucideIcons.layoutDashboard, size: 20),
              onPressed: () => context.push('/admin'),
              tooltip: 'Admin CRM',
            ),
          IconButton(
            icon: const Icon(LucideIcons.search, size: 20),
            onPressed: () => context.go('/explore'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.refresh(ralliesStreamProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 12),
          children: [
            // Cycle / Story Avatar Bar
            const CyclesStrip(),
            const SizedBox(height: 16),

            // Category Filter Pills (ALL, ASK, HELP, JOIN)
            _buildFilterBar(),
            const SizedBox(height: 16),

            // Rally Feed List
            ralliesAsync.when(
              data: (rallies) {
                final filtered = _selectedFilter == 'ALL'
                    ? rallies
                    : rallies.where((r) => r.typeLabel == _selectedFilter).toList();

                if (filtered.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(
                      child: Text(
                        'No RALLYS found in this category.',
                        style: TextStyle(fontSize: 13, color: AppColors.zinc500),
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, idx) {
                    final rally = filtered[idx];
                    return _buildRallyCard(context, rally);
                  },
                );
              },
              loading: () => const Center(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
              error: (err, stack) => Padding(
                padding: const EdgeInsets.all(32),
                child: Text('Error loading feed: $err'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    final filters = ['ALL', 'ASK', 'HELP', 'JOIN'];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: filters.map((filter) {
          final isSelected = _selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              selected: isSelected,
              label: Text(filter),
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w800,
                color: isSelected ? Colors.white : AppColors.zinc700,
              ),
              selectedColor: AppColors.zinc900,
              backgroundColor: AppColors.white,
              onSelected: (val) {
                if (val) {
                  setState(() {
                    _selectedFilter = filter;
                  });
                }
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildRallyCard(BuildContext context, RallyModel rally) {
    Color badgeBg = AppColors.indigo50;
    Color badgeText = AppColors.indigo600;

    if (rally.type == RallyType.ask) {
      badgeBg = AppColors.rose50;
      badgeText = AppColors.rose600;
    } else if (rally.type == RallyType.help) {
      badgeBg = AppColors.emerald50;
      badgeText = AppColors.emerald600;
    }

    return GestureDetector(
      onTap: () => context.push('/rally/${rally.id}'),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Creator Avatar + Badge
              Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundImage: NetworkImage(rally.creatorAvatar),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              rally.creatorName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: AppColors.zinc900,
                              ),
                            ),
                            if (rally.isCreatorNINVerified) ...[
                              const SizedBox(width: 4),
                              const Icon(LucideIcons.checkCircle2, size: 14, color: AppColors.emerald600),
                            ],
                          ],
                        ),
                        Text(
                          rally.location,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: AppColors.zinc400,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      rally.typeLabel,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: badgeText,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Title & Description
              Text(
                rally.title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.4,
                  color: AppColors.zinc900,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                rally.description,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: AppColors.zinc600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),

              // Footer: Participants & Action button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.users, size: 14, color: AppColors.zinc400),
                      const SizedBox(width: 4),
                      Text(
                        '${rally.participantCount} joined',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppColors.zinc500,
                        ),
                      ),
                    ],
                  ),
                  const Text(
                    'Tap to view →',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: AppColors.zinc900,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
