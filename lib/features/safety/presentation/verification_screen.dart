import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../providers/verification_repository_provider.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

class VerificationScreen extends ConsumerStatefulWidget {
  const VerificationScreen({super.key});

  @override
  ConsumerState<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends ConsumerState<VerificationScreen> {
  // Repository reference
  late final VerificationRepository _repo;

  int _step = 0;
  // Controllers remain unchanged
  final _ninController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    // Initialize repository from provider
    _repo = ref.read(verificationRepositoryProvider);
  }

  @override
  void dispose() {
    _ninController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _nextStep() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      // Small delay for UI effect
      await Future.delayed(const Duration(milliseconds: 800));

      if (_step == 0) {
        // Verify NIN via backend
        final success = await _repo.verifyNIN(_ninController.text.trim());
        if (!success) throw 'NIN verification failed.';
      } else if (_step == 1) {
        // Send OTP to phone
        final sent = await _repo.sendPhoneOtp(_phoneController.text.trim());
        if (!sent) throw 'Failed to send OTP to phone.';
      } else if (_step == 2) {
        // Verify OTP
        final verified = await _repo.verifyPhoneOtp(
          _phoneController.text.trim(),
          _otpController.text.trim(),
        );
        if (!verified) throw 'OTP verification failed.';
      }

      if (_step < 3) {
        setState(() {
          _loading = false;
          _step++;
        });
      } else {
        // Completed all steps
        context.pop();
      }
    } catch (e) {
      setState(() {
        _loading = false;
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Identity Verification'),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => context.pop(),
        ),
      ),
      body: Column(
        children: [
          // Step indicator
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Row(
              children: List.generate(4, (i) {
                final isActive = i <= _step;
                return Expanded(
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: isActive
                              ? AppColors.emerald600
                              : AppColors.zinc200,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: isActive && i < _step
                              ? const Icon(LucideIcons.check,
                                  color: Colors.white, size: 14)
                              : Text(
                                  '${i + 1}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: isActive
                                        ? Colors.white
                                        : AppColors.zinc400,
                                  ),
                                ),
                        ),
                      ),
                      if (i < 3)
                        Expanded(
                          child: Container(
                            height: 2,
                            color: i < _step
                                ? AppColors.emerald600
                                : AppColors.zinc200,
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildStep(),
              ),
            ),
          ),

          // CTA
          Padding(
            padding: const EdgeInsets.all(20),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _nextStep,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.emerald600,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(
                        _step == 2 ? 'Complete Verification' : 'Continue',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _StepCard(
          key: const ValueKey(0),
          icon: LucideIcons.idCard,
          title: 'NIN Number',
          description: 'Enter your 11-digit National Identification Number (NIN) to verify your identity.',
          child: TextFormField(
            controller: _ninController,
            keyboardType: TextInputType.number,
            maxLength: 11,
            decoration: const InputDecoration(
              hintText: 'Enter your NIN (11 digits)',
              prefixIcon: Icon(LucideIcons.hash, color: AppColors.zinc400),
              counterText: '',
            ),
          ),
        );
      case 1:
        return _StepCard(
          key: const ValueKey(1),
          icon: LucideIcons.phone,
          title: 'Phone Verification',
          description: 'We will send a verification code to your phone number.',
          child: TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              hintText: '+234 800 000 0000',
              prefixIcon: Icon(LucideIcons.phoneCall, color: AppColors.zinc400),
            ),
          ),
        );
      case 2:
        return _StepCard(
          key: const ValueKey(2),
          icon: LucideIcons.shieldCheck,
          title: 'Enter OTP',
          description: 'Enter the verification code sent to your phone.',
          child: TextFormField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              hintText: '6‑digit code',
              prefixIcon: Icon(LucideIcons.key, color: AppColors.zinc400),
            ),
          ),
        );
      case 3:
        return _StepCard(
          key: const ValueKey(3),
          icon: LucideIcons.shieldCheck,
          title: 'Verification Complete',
          description: 'Your identity has been successfully verified.',
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.emerald50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.emerald100),
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.checkCircle, color: AppColors.emerald600),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Identity verified successfully',
                    style: TextStyle(
                      color: AppColors.emerald700,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _StepCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Widget child;

  const _StepCard({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.emerald50,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(icon, color: AppColors.emerald600, size: 28),
        ),
        const SizedBox(height: 16),
        Text(
          title,
          style: const TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w900,
            color: AppColors.zinc900,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          description,
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.zinc500,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        child,
      ],
    );
  }
}
