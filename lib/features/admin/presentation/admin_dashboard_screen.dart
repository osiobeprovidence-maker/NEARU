import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../services/auth_service.dart';

// --- Providers ---

final _adminTabProvider = StateProvider<int>((ref) => 0);

// Mock admin stats
class AdminStats {
  final int totalUsers;
  final int activeRallies;
  final int pendingVerifications;
  final int totalPages;

  const AdminStats({
    required this.totalUsers,
    required this.activeRallies,
    required this.pendingVerifications,
    required this.totalPages,
  });
}

final adminStatsProvider = Provider<AdminStats>((_) => const AdminStats(
      totalUsers: 1248,
      activeRallies: 94,
      pendingVerifications: 17,
      totalPages: 36,
    ));

// --- Screen ---

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  static const _tabs = ['Overview', 'Users', 'Rallies', 'Pages'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final currentTab = ref.watch(_adminTabProvider);

    // Guard: only admin/super_admin
    if (user?.role != 'admin' && user?.role != 'super_admin') {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Admin Dashboard'),
          leading: IconButton(
            icon: const Icon(LucideIcons.arrowLeft),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.shieldOff,
                  size: 48, color: AppColors.zinc300),
              SizedBox(height: 16),
              Text(
                'Access Restricted',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: AppColors.zinc900,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'You need admin privileges to access this area.',
                style: TextStyle(color: AppColors.zinc500),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        backgroundColor: AppColors.zinc900,
        foregroundColor: Colors.white,
        title: Row(
          children: [
            const Icon(LucideIcons.layoutDashboard, size: 18),
            const SizedBox(width: 8),
            const Text(
              'Admin CRM',
              style: TextStyle(
                fontWeight: FontWeight.w900,
                letterSpacing: -0.3,
              ),
            ),
            const SizedBox(width: 8),
            if (user?.role == 'super_admin')
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.amber500.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                      color: AppColors.amber500.withOpacity(0.4)),
                ),
                child: const Text(
                  'SUPER ADMIN',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    color: AppColors.amber500,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
        bottom: TabBar(
          controller: _DummyTabController(
            length: _tabs.length,
            index: currentTab,
            onTap: (i) => ref.read(_adminTabProvider.notifier).state = i,
          ),
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.zinc400,
          indicatorColor: AppColors.indigo500,
          tabs: _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: IndexedStack(
        index: currentTab,
        children: const [
          _OverviewTab(),
          _UsersTab(),
          _RalliesTab(),
          _PagesTab(),
        ],
      ),
    );
  }
}

// Shim TabController for direct Riverpod state
class _DummyTabController extends TabController {
  final void Function(int) onTap;

  _DummyTabController({
    required int length,
    required int index,
    required this.onTap,
  }) : super(length: length, initialIndex: index, vsync: _VSync());

  @override
  void animateTo(int value, {Duration? duration, Curve curve = Curves.ease}) {
    onTap(value);
    super.animateTo(value, duration: duration, curve: curve);
  }
}

class _VSync extends TickerProvider {
  @override
  Ticker createTicker(TickerCallback onTick) => Ticker(onTick);
}

// --- Overview Tab ---

class _OverviewTab extends ConsumerWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stats = ref.watch(adminStatsProvider);

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Platform Overview',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: AppColors.zinc900,
          ),
        ),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.3,
          children: [
            _StatCard(
              label: 'Total Users',
              value: '${stats.totalUsers}',
              icon: LucideIcons.users,
              color: AppColors.indigo600,
              bg: AppColors.indigo50,
            ),
            _StatCard(
              label: 'Active Rallies',
              value: '${stats.activeRallies}',
              icon: LucideIcons.zap,
              color: AppColors.emerald600,
              bg: AppColors.emerald50,
            ),
            _StatCard(
              label: 'Pending Verif.',
              value: '${stats.pendingVerifications}',
              icon: LucideIcons.shieldAlert,
              color: AppColors.amber500,
              bg: AppColors.amber50,
            ),
            _StatCard(
              label: 'Total Pages',
              value: '${stats.totalPages}',
              icon: LucideIcons.building2,
              color: AppColors.rose600,
              bg: AppColors.rose50,
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          'Recent Activity',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.zinc900,
          ),
        ),
        const SizedBox(height: 12),
        ..._mockActivity.map((a) => _ActivityItem(
              icon: a['icon'] as IconData,
              text: a['text'] as String,
              time: a['time'] as String,
              color: a['color'] as Color,
            )),
      ],
    );
  }
}

const _mockActivity = [
  {
    'icon': LucideIcons.userCheck,
    'text': 'New user verified: @chiamaka_nweke',
    'time': '2m ago',
    'color': AppColors.emerald600,
  },
  {
    'icon': LucideIcons.zap,
    'text': 'Rally created: "Help moving furniture — VI"',
    'time': '8m ago',
    'color': AppColors.indigo600,
  },
  {
    'icon': LucideIcons.flag,
    'text': 'Report filed on post #3821',
    'time': '14m ago',
    'color': AppColors.rose600,
  },
  {
    'icon': LucideIcons.building2,
    'text': 'New page created: Lekki Food Hub',
    'time': '22m ago',
    'color': AppColors.amber500,
  },
];

class _ActivityItem extends StatelessWidget {
  final IconData icon;
  final String text;
  final String time;
  final Color color;

  const _ActivityItem({
    required this.icon,
    required this.text,
    required this.time,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.zinc100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 16, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.zinc800,
              ),
            ),
          ),
          Text(
            time,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.zinc400,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color bg;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.bg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.zinc100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color: AppColors.zinc900,
              letterSpacing: -1,
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.zinc500,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// --- Users Tab ---

class _UsersTab extends StatelessWidget {
  const _UsersTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Search bar
        TextField(
          decoration: const InputDecoration(
            hintText: 'Search users...',
            prefixIcon:
                Icon(LucideIcons.search, color: AppColors.zinc400, size: 18),
          ),
        ),
        const SizedBox(height: 16),
        ..._mockUsers.map((u) => _UserRow(
              name: u['name'] as String,
              username: u['username'] as String,
              role: u['role'] as String,
              verified: u['verified'] as bool,
            )),
      ],
    );
  }
}

const _mockUsers = [
  {
    'name': 'Providence Osiobe',
    'username': 'osiobeprovidence',
    'role': 'super_admin',
    'verified': true,
  },
  {
    'name': 'Chiamaka Nweke',
    'username': 'chiamaka_n',
    'role': 'user',
    'verified': true,
  },
  {
    'name': 'Emeka Obi',
    'username': 'emeka.obi',
    'role': 'user',
    'verified': false,
  },
  {
    'name': 'Aisha Bello',
    'username': 'aishab',
    'role': 'admin',
    'verified': true,
  },
  {
    'name': 'Tunde Adebayo',
    'username': 'tunde_a',
    'role': 'user',
    'verified': false,
  },
];

class _UserRow extends StatelessWidget {
  final String name;
  final String username;
  final String role;
  final bool verified;

  const _UserRow({
    required this.name,
    required this.username,
    required this.role,
    required this.verified,
  });

  @override
  Widget build(BuildContext context) {
    final roleColor = role == 'super_admin'
        ? AppColors.amber500
        : role == 'admin'
            ? AppColors.indigo600
            : AppColors.zinc400;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.zinc100),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppColors.zinc100,
            child: Text(
              name[0].toUpperCase(),
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                color: AppColors.zinc600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.zinc900,
                      ),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 4),
                      const Icon(LucideIcons.shieldCheck,
                          size: 13, color: AppColors.emerald600),
                    ],
                  ],
                ),
                Text(
                  '@$username',
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.zinc400),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: roleColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              role.replaceAll('_', ' ').toUpperCase(),
              style: TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w900,
                color: roleColor,
                letterSpacing: 0.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// --- Rallies Tab ---

class _RalliesTab extends StatelessWidget {
  const _RalliesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Active Rallies',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.zinc900,
          ),
        ),
        const SizedBox(height: 12),
        ..._mockRallies.map((r) => _AdminRallyRow(
              title: r['title'] as String,
              type: r['type'] as String,
              location: r['location'] as String,
              attendees: r['attendees'] as int,
            )),
      ],
    );
  }
}

const _mockRallies = [
  {
    'title': 'Help moving furniture — VI',
    'type': 'HELP',
    'location': 'Victoria Island',
    'attendees': 3,
  },
  {
    'title': 'ASK: Good mechanic in Ikeja?',
    'type': 'ASK',
    'location': 'Ikeja',
    'attendees': 8,
  },
  {
    'title': 'JOIN: Lagos Tech Meetup',
    'type': 'JOIN',
    'location': 'Yaba',
    'attendees': 47,
  },
];

class _AdminRallyRow extends StatelessWidget {
  final String title;
  final String type;
  final String location;
  final int attendees;

  const _AdminRallyRow({
    required this.title,
    required this.type,
    required this.location,
    required this.attendees,
  });

  @override
  Widget build(BuildContext context) {
    final typeColor = type == 'ASK'
        ? AppColors.rose600
        : type == 'HELP'
            ? AppColors.emerald600
            : AppColors.indigo600;
    final typeBg = type == 'ASK'
        ? AppColors.rose50
        : type == 'HELP'
            ? AppColors.emerald50
            : AppColors.indigo50;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.zinc100),
      ),
      child: Row(
        children: [
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: typeBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              type,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: typeColor,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.zinc900,
                  ),
                ),
                Row(
                  children: [
                    const Icon(LucideIcons.mapPin,
                        size: 11, color: AppColors.zinc400),
                    const SizedBox(width: 3),
                    Text(
                      location,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.zinc400),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Row(
            children: [
              const Icon(LucideIcons.users,
                  size: 13, color: AppColors.zinc400),
              const SizedBox(width: 4),
              Text(
                '$attendees',
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// --- Pages Tab ---

class _PagesTab extends StatelessWidget {
  const _PagesTab();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        const Text(
          'Organization Pages',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.zinc900,
          ),
        ),
        const SizedBox(height: 12),
        ..._mockPages.map((p) => _AdminPageRow(
              name: p['name'] as String,
              category: p['category'] as String,
              followers: p['followers'] as int,
              verified: p['verified'] as bool,
            )),
      ],
    );
  }
}

const _mockPages = [
  {
    'name': 'Lekki Food Hub',
    'category': 'Food & Restaurants',
    'followers': 1240,
    'verified': true,
  },
  {
    'name': 'Lagos Tech Community',
    'category': 'Technology',
    'followers': 5600,
    'verified': true,
  },
  {
    'name': 'Abuja Fitness Club',
    'category': 'Health & Wellness',
    'followers': 890,
    'verified': false,
  },
];

class _AdminPageRow extends StatelessWidget {
  final String name;
  final String category;
  final int followers;
  final bool verified;

  const _AdminPageRow({
    required this.name,
    required this.category,
    required this.followers,
    required this.verified,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.zinc100),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.zinc100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(LucideIcons.building2,
                color: AppColors.zinc400, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.zinc900,
                      ),
                    ),
                    if (verified) ...[
                      const SizedBox(width: 4),
                      const Icon(LucideIcons.badgeCheck,
                          size: 13, color: AppColors.indigo600),
                    ],
                  ],
                ),
                Text(
                  category,
                  style: const TextStyle(
                      fontSize: 12, color: AppColors.zinc400),
                ),
              ],
            ),
          ),
          Text(
            '${followers >= 1000 ? '${(followers / 1000).toStringAsFixed(1)}K' : followers} followers',
            style: const TextStyle(
                fontSize: 11, color: AppColors.zinc500, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
