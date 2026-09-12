class CycleModel {
  final String id;
  final String userId;
  final String userName;
  final String userAvatar;
  final List<String> imageUrls;
  final int timestamp;

  CycleModel({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.imageUrls,
    required this.timestamp,
  });

  factory CycleModel.fromJson(Map<String, dynamic> json) {
    return CycleModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['userId'] ?? '',
      userName: json['userName'] ?? '',
      userAvatar: json['userAvatar'] ?? '',
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
      timestamp: json['timestamp'] ?? 0,
    );
  }
}
