import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';
import 'endless_video_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  double _radiusKm = 10.0;
  final _searchController = TextEditingController();

  final List<Map<String, dynamic>> _sampleVideos = [
    {
      '_id': 'v1',
      'title': 'High Energy Community Rally in Victoria Island! 🔥',
      'description': 'Over 200 members showed up for today\'s tech & sports rally! Check out the vibes!',
      'mediaUrl': 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-partying-and-having-fun-40439-large.mp4',
      'likesCount': 342,
      'commentsCount': 28,
      'isLiked': true,
      'locationLabel': 'Victoria Island, Lagos',
      'creator': {
        '_id': 'u1',
        'name': 'Tunde Bakare',
        'username': 'tundebakare',
        'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        'isVerified': true,
      },
    },
    {
      '_id': 'v2',
      'title': 'Afrobeats & Dance Jam at Lekki Phase 1 🎵',
      'description': 'Weekend workout session with live music and local food popups!',
      'mediaUrl': 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-dancing-in-a-nightclub-40441-large.mp4',
      'likesCount': 512,
      'commentsCount': 42,
      'isLiked': false,
      'locationLabel': 'Lekki Phase 1, Lagos',
      'creator': {
        '_id': 'u2',
        'name': 'Amara Okafor',
        'username': 'amara_c',
        'avatar': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
      },
    },
    {
      '_id': 'v3',
      'title': 'Sunset Beach Run & Chill 🌅',
      'description': 'Tarkwa Bay clean up & beach volleyball rally recap!',
      'mediaUrl': 'https://assets.mixkit.co/videos/preview/mixkit-people-running-on-the-beach-at-sunset-40438-large.mp4',
      'likesCount': 189,
      'commentsCount': 12,
      'isLiked': false,
      'locationLabel': 'Tarkwa Bay, Lagos',
      'creator': {
        '_id': 'u3',
        'name': 'Chidi Vance',
        'username': 'chidivance',
        'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      },
    },
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openEndlessVideoViewer(int index) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EndlessVideoScreen(
          videos: _sampleVideos,
          initialIndex: index,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Explore & Videos'),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Search Input
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: 'Search RALLYS, videos, or people...',
                prefixIcon: Icon(LucideIcons.search, size: 20, color: AppColors.zinc400),
              ),
            ),
            const SizedBox(height: 20),

            // Trending Videos Feed Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.play, size: 20, color: AppColors.indigo600),
                    SizedBox(width: 8),
                    Text(
                      'Trending Videos',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        color: AppColors.zinc900,
                      ),
                    ),
                  ],
                ),
                TextButton(
                  onPressed: () => _openEndlessVideoViewer(0),
                  child: const Text('View All Feed'),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Horizontal Video Reel Cards
            SizedBox(
              height: 220,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _sampleVideos.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (context, index) {
                  final video = _sampleVideos[index];
                  return GestureDetector(
                    onTap: () => _openEndlessVideoViewer(index),
                    child: Container(
                      width: 140,
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: const [
                          BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 3)),
                        ],
                      ),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // Thumbnail Image / Backdrop
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              video['creator']?['avatar'] ?? '',
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(color: AppColors.zinc800),
                            ),
                          ),
                          Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Colors.black.withOpacity(0.8)],
                              ),
                            ),
                          ),

                          // Play Icon Center
                          const Center(
                            child: CircleAvatar(
                              radius: 20,
                              backgroundColor: Colors.black45,
                              child: Icon(LucideIcons.play, size: 20, color: Colors.white),
                            ),
                          ),

                          // Bottom Card Details
                          Positioned(
                            left: 10,
                            right: 10,
                            bottom: 10,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  video['title'] ?? '',
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(LucideIcons.heart, size: 12, color: AppColors.rose500),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${video['likesCount']}',
                                      style: const TextStyle(color: Colors.white70, fontSize: 10),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),

            // Radius Selector Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Discovery Radius',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppColors.zinc900,
                          ),
                        ),
                        Text(
                          '${_radiusKm.toInt()} km',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w900,
                            color: AppColors.indigo600,
                          ),
                        ),
                      ],
                    ),
                    Slider(
                      value: _radiusKm,
                      min: 1.0,
                      max: 50.0,
                      divisions: 49,
                      activeColor: AppColors.zinc900,
                      onChanged: (val) {
                        setState(() {
                          _radiusKm = val;
                        });
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Map Preview Card
            Container(
              height: 180,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.zinc200,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.zinc300),
              ),
              child: const Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.mapPin, size: 40, color: AppColors.indigo600),
                  SizedBox(height: 8),
                  Text(
                    'Map View (GPS Active)',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: AppColors.zinc900,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Showing active RALLYS & videos near Lagos, Nigeria',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.zinc600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
