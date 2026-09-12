import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/constants/app_colors.dart';
import 'video_comment_sheet.dart';

class VideoPlayerItem extends StatefulWidget {
  final Map<String, dynamic> video;
  final bool isCurrent;

  const VideoPlayerItem({
    super.key,
    required this.video,
    required this.isCurrent,
  });

  @override
  State<VideoPlayerItem> createState() => _VideoPlayerItemState();
}

class _VideoPlayerItemState extends State<VideoPlayerItem>
    with SingleTickerProviderStateMixin {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _isPlaying = true;
  bool _isMuted = false;
  bool _isLiked = false;
  int _likesCount = 0;
  bool _isFollowing = false;
  bool _isBookmarked = false;
  bool _showHeartAnim = false;
  Offset _heartAnimPos = Offset.zero;

  late AnimationController _discAnimController;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.video['isLiked'] ?? false;
    _likesCount = widget.video['likesCount'] ?? 0;

    _discAnimController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();

    _initializeVideo();
  }

  void _initializeVideo() {
    final mediaUrl = widget.video['mediaUrl'] ?? widget.video['mediaUrls']?[0] ?? '';
    if (mediaUrl.toString().isEmpty) return;

    _controller = VideoPlayerController.networkUrl(Uri.parse(mediaUrl))
      ..initialize().then((_) {
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
          _controller?.setLooping(true);
          if (widget.isCurrent) {
            _controller?.play();
          }
        }
      });
  }

  @override
  void didUpdateWidget(covariant VideoPlayerItem oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isCurrent != oldWidget.isCurrent) {
      if (widget.isCurrent) {
        _controller?.play();
        setState(() => _isPlaying = true);
      } else {
        _controller?.pause();
        setState(() => _isPlaying = false);
      }
    }
  }

  @override
  void dispose() {
    _discAnimController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null || !_isInitialized) return;
    if (_controller!.value.isPlaying) {
      _controller!.pause();
      setState(() => _isPlaying = false);
    } else {
      _controller!.play();
      setState(() => _isPlaying = true);
    }
  }

  void _toggleMute() {
    if (_controller == null) return;
    setState(() {
      _isMuted = !_isMuted;
      _controller!.setVolume(_isMuted ? 0 : 1.0);
    });
  }

  void _onDoubleTap(TapDownDetails details) {
    setState(() {
      _heartAnimPos = details.localPosition;
      _showHeartAnim = true;
      if (!_isLiked) {
        _isLiked = true;
        _likesCount++;
      }
    });

    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) {
        setState(() => _showHeartAnim = false);
      }
    });
  }

  void _toggleLike() {
    setState(() {
      _isLiked = !_isLiked;
      _likesCount = _isLiked ? _likesCount + 1 : (_likesCount > 0 ? _likesCount - 1 : 0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final creator = widget.video['creator'] ?? {};
    final title = widget.video['title'] ?? '';
    final description = widget.video['description'] ?? '';
    final location = widget.video['locationLabel'] ?? '';

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // Video Player Background
          GestureDetector(
            onTap: _togglePlay,
            onDoubleTapDown: _onDoubleTap,
            child: Container(
              color: Colors.black,
              child: _isInitialized && _controller != null
                  ? AspectRatio(
                      aspectRatio: _controller!.value.aspectRatio,
                      child: VideoPlayer(_controller!),
                    )
                  : const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.indigo500,
                        strokeWidth: 2,
                      ),
                    ),
            ),
          ),

          // Play/Pause Overlay Icon
          if (!_isPlaying)
            const Center(
              child: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black38,
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.play, size: 40, color: Colors.white),
              ),
            ),

          // Double Tap Heart Burst
          if (_showHeartAnim)
            Positioned(
              left: _heartAnimPos.dx - 36,
              top: _heartAnimPos.dy - 36,
              child: const Icon(
                LucideIcons.heart,
                size: 72,
                color: AppColors.rose500,
              ),
            ),

          // Top Mute Control & Back Button
          Positioned(
            top: MediaQuery.of(context).padding.top + 8,
            left: 16,
            right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: const Icon(LucideIcons.chevronLeft, color: Colors.white, size: 28),
                  onPressed: () => Navigator.pop(context),
                ),
                IconButton(
                  icon: Icon(
                    _isMuted ? LucideIcons.volumeX : LucideIcons.volume2,
                    color: Colors.white,
                    size: 24,
                  ),
                  onPressed: _toggleMute,
                ),
              ],
            ),
          ),

          // Right Action Sidebar
          Positioned(
            right: 16,
            bottom: 100,
            child: Column(
              children: [
                // Creator Avatar with Follow Button
                Stack(
                  alignment: Alignment.bottomCenter,
                  clipBehavior: Clip.none,
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundImage: NetworkImage(creator['avatar'] ??
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'),
                    ),
                    Positioned(
                      bottom: -8,
                      child: GestureDetector(
                        onTap: () => setState(() => _isFollowing = !_isFollowing),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: _isFollowing ? AppColors.zinc800 : AppColors.rose500,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _isFollowing ? LucideIcons.check : LucideIcons.plus,
                            size: 12,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Like Button
                IconButton(
                  icon: Icon(
                    LucideIcons.heart,
                    size: 30,
                    color: _isLiked ? AppColors.rose500 : Colors.white,
                  ),
                  onPressed: _toggleLike,
                ),
                Text(
                  '$_likesCount',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // Comment Button
                IconButton(
                  icon: const Icon(LucideIcons.messageCircle, size: 28, color: Colors.white),
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      backgroundColor: Colors.transparent,
                      builder: (ctx) => VideoCommentSheet(
                        videoId: widget.video['_id'] ?? '',
                        videoTitle: title,
                        commentsCount: widget.video['commentsCount'] ?? 0,
                      ),
                    );
                  },
                ),
                Text(
                  '${widget.video['commentsCount'] ?? 0}',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),

                // Bookmark Button
                IconButton(
                  icon: Icon(
                    LucideIcons.bookmark,
                    size: 26,
                    color: _isBookmarked ? AppColors.amber500 : Colors.white,
                  ),
                  onPressed: () => setState(() => _isBookmarked = !_isBookmarked),
                ),
                const SizedBox(height: 16),

                // Share Button
                IconButton(
                  icon: const Icon(LucideIcons.share2, size: 26, color: Colors.white),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Video link copied to clipboard!')),
                    );
                  },
                ),
                const SizedBox(height: 20),

                // Rotating Vinyl Audio Disc
                RotationTransition(
                  turns: _discAnimController,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: const BoxDecoration(
                      color: AppColors.zinc900,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(LucideIcons.music2, size: 16, color: AppColors.indigo400),
                  ),
                ),
              ],
            ),
          ),

          // Bottom Caption & Creator Info Overlay
          Positioned(
            left: 16,
            right: 80,
            bottom: 32,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  creator['name'] ?? 'Creator',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 12,
                    ),
                  ),
                ],
                if (location.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin, size: 12, color: AppColors.rose400),
                      const SizedBox(width: 4),
                      Text(
                        location,
                        style: const TextStyle(color: AppColors.rose300, fontSize: 11),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 8),
                const Row(
                  children: [
                    Icon(LucideIcons.music2, size: 14, color: AppColors.indigo300),
                    SizedBox(width: 6),
                    Text(
                      'Original Sound - Lalao Creator',
                      style: TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Bottom Video Progress Bar
          if (_isInitialized && _controller != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: VideoProgressIndicator(
                _controller!,
                allowScrubbing: true,
                colors: const VideoProgressColors(
                  playedColor: AppColors.indigo500,
                  bufferedColor: Colors.white24,
                  backgroundColor: Colors.white10,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
