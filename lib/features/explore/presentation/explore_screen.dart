import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/constants/app_colors.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  double _radiusKm = 10.0;
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Explore & Map'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Search Input
              TextField(
                controller: _searchController,
                decoration: const InputDecoration(
                  hintText: 'Search RALLYS, people, or places...',
                  prefixIcon: Icon(LucideIcons.search, size: 20, color: AppColors.zinc400),
                ),
              ),
              const SizedBox(height: 16),

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

              // Simulated Map Preview Card
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.zinc200,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: AppColors.zinc300),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.mapPin, size: 48, color: AppColors.indigo600),
                          SizedBox(height: 12),
                          Text(
                            'Map View (GPS Active)',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: AppColors.zinc900,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Showing active RALLYS near Lagos, Nigeria',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.zinc600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
