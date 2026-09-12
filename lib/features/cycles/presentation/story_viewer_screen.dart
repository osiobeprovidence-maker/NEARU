import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../models/cycle_model.dart';
import '../../../core/constants/app_colors.dart';

class StoryViewerScreen extends StatefulWidget {
  final CycleModel cycle;

  const StoryViewerScreen({super.key, required this.cycle});

  @override
  State<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends State<StoryViewerScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 5),
    )..addListener(() {
        setState(() {});
      })
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _nextStory();
        }
      });
    
    if (widget.cycle.imageUrls.isNotEmpty) {
      _animController.forward();
    }
  }

  void _nextStory() {
    if (_currentIndex < widget.cycle.imageUrls.length - 1) {
      setState(() {
        _currentIndex++;
      });
      _animController.reset();
      _animController.forward();
    } else {
      context.pop();
    }
  }

  void _prevStory() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
      });
      _animController.reset();
      _animController.forward();
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.cycle.imageUrls.isEmpty) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: Text('No stories', style: TextStyle(color: Colors.white)),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: GestureDetector(
          onTapDown: (details) {
            final double screenWidth = MediaQuery.of(context).size.width;
            final double tapPosition = details.globalPosition.dx;
            if (tapPosition < screenWidth / 3) {
              _prevStory();
            } else {
              _nextStory();
            }
          },
          onLongPressDown: (_) => _animController.stop(),
          onLongPressUp: (_) => _animController.forward(),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Image
              Image.network(
                widget.cycle.imageUrls[_currentIndex],
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return const Center(child: CircularProgressIndicator(color: Colors.white));
                },
              ),

              // UI Overlay
              Column(
                children: [
                  // Progress Bars
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 16.0),
                    child: Row(
                      children: List.generate(widget.cycle.imageUrls.length, (index) {
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2.0),
                            child: LinearProgressIndicator(
                              value: _getProgressValue(index),
                              backgroundColor: Colors.white.withOpacity(0.3),
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                              minHeight: 2,
                            ),
                          ),
                        );
                      }),
                    ),
                  ),

                  // Header User Info
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundImage: NetworkImage(widget.cycle.userAvatar),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          widget.cycle.userName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(LucideIcons.x, color: Colors.white),
                          onPressed: () => context.pop(),
                        ),
                      ],
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

  double _getProgressValue(int index) {
    if (index < _currentIndex) {
      return 1.0;
    } else if (index == _currentIndex) {
      return _animController.value;
    } else {
      return 0.0;
    }
  }
}
