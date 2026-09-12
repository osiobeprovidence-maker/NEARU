import 'package:flutter/material.dart';
import 'widgets/video_player_item.dart';

class EndlessVideoScreen extends StatefulWidget {
  final List<Map<String, dynamic>> videos;
  final int initialIndex;

  const EndlessVideoScreen({
    super.key,
    required this.videos,
    this.initialIndex = 0,
  });

  @override
  State<EndlessVideoScreen> createState() => _EndlessVideoScreenState();
}

class _EndlessVideoScreenState extends State<EndlessVideoScreen> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, widget.videos.isEmpty ? 0 : widget.videos.length - 1);
    _pageController = PageController(initialPage: _currentIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.videos.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black),
        body: const Center(
          child: Text(
            'No videos available',
            style: TextStyle(color: Colors.white, fontSize: 16),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: PageView.builder(
        controller: _pageController,
        scrollDirection: Axis.vertical,
        itemCount: widget.videos.length,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        itemBuilder: (context, index) {
          return VideoPlayerItem(
            video: widget.videos[index],
            isCurrent: index == _currentIndex,
          );
        },
      ),
    );
  }
}
