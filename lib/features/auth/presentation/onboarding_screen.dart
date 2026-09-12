import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../services/auth_service.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  int _currentStep = 0;
  final List<String> _selectedInterests = ['Fitness', 'Tech', 'Networking'];

  final List<String> _availableInterests = [
    'Fitness',
    'Tech',
    'Networking',
    'Gaming',
    'Events',
    'Food',
    'Sports',
    'Music',
    'Mentorship',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Complete Profile'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Step Progress Bar
              Row(
                children: List.generate(3, (idx) {
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(
                        color: idx <= _currentStep
                            ? AppColors.zinc900
                            : AppColors.zinc200,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 32),

              // Step 1: Interests
              if (_currentStep == 0) ...[
                const Text(
                  'What are you interested in?',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.zinc900,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pick tags to discover relevant RALLYS in your area.',
                  style: TextStyle(fontSize: 13, color: AppColors.zinc500),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 8,
                  runSpacing: 10,
                  children: _availableInterests.map((interest) {
                    final isSelected = _selectedInterests.contains(interest);
                    return FilterChip(
                      selected: isSelected,
                      label: Text(interest),
                      labelStyle: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : AppColors.zinc800,
                      ),
                      backgroundColor: AppColors.zinc100,
                      selectedColor: AppColors.zinc900,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _selectedInterests.add(interest);
                          } else {
                            _selectedInterests.remove(interest);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ],

              // Step 2: Verification info
              if (_currentStep == 1) ...[
                const Text(
                  'Identity Verification (NIN)',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.zinc900,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'lalao requires identity verification for trusted community interactions.',
                  style: TextStyle(fontSize: 13, color: AppColors.zinc500),
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.emerald50,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.emerald100),
                  ),
                  child: Row(
                    children: const [
                      Icon(Icons.shield_outlined, color: AppColors.emerald600, size: 28),
                      SizedBox(width: 14),
                      Expanded(
                        child: Text(
                          'Verified neighbors gain trust badges and priority response placement.',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.emerald700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const Spacer(),

              // Next / Finish button
              ElevatedButton(
                onPressed: () {
                  if (_currentStep < 1) {
                    setState(() {
                      _currentStep++;
                    });
                  } else {
                    ref.read(authProvider.notifier).completeOnboarding();
                    context.go('/');
                  }
                },
                child: Text(_currentStep == 1 ? 'Finish & Explore' : 'Continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
