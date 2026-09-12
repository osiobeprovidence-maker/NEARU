import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/rally_model.dart';

class CreateRallyScreen extends StatefulWidget {
  const CreateRallyScreen({super.key});

  @override
  State<CreateRallyScreen> createState() => _CreateRallyScreenState();
}

class _CreateRallyScreenState extends State<CreateRallyScreen> {
  RallyType _selectedType = RallyType.join;
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _locationController = TextEditingController(text: 'Yaba, Lagos');

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc50,
      appBar: AppBar(
        title: const Text('Create a RALLY'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Type Selector (ASK, HELP, JOIN)
              Row(
                children: [
                  _buildTypeChip('ASK', RallyType.ask, AppColors.rose600),
                  const SizedBox(width: 8),
                  _buildTypeChip('HELP', RallyType.help, AppColors.emerald600),
                  const SizedBox(width: 8),
                  _buildTypeChip('JOIN', RallyType.join, AppColors.indigo600),
                ],
              ),
              const SizedBox(height: 24),

              // Title
              TextField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Rally Headline / Title',
                  hintText: 'e.g., Football match this Saturday afternoon',
                ),
              ),
              const SizedBox(height: 16),

              // Description
              TextField(
                controller: _descController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Details / Expectations',
                  hintText: 'Share exact location details, timing, or items needed...',
                ),
              ),
              const SizedBox(height: 16),

              // Location
              TextField(
                controller: _locationController,
                decoration: const InputDecoration(
                  labelText: 'Neighborhood / Location',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ),
              const SizedBox(height: 32),

              // Submit Button
              ElevatedButton(
                onPressed: () {
                  if (_titleController.text.trim().isEmpty) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('RALLY published successfully!')),
                  );
                  context.pop();
                },
                child: const Text('Publish RALLY'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTypeChip(String label, RallyType type, Color color) {
    final isSelected = _selectedType == type;

    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedType = type;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: isSelected ? color : AppColors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? color : AppColors.zinc200,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w900,
                color: isSelected ? Colors.white : AppColors.zinc900,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
