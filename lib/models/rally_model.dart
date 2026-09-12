
enum RallyType { ask, help, join, offer, community }

class RallyModel {
  final String id;
  final String title;
  final String description;
  final RallyType type;
  final String location;
  final String creatorId;
  final String creatorName;
  final String creatorAvatar;
  final bool isCreatorNINVerified;
  final int participantCount;
  final String? image;
  final String category;
  final int timestamp;

  RallyModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.location,
    required this.creatorId,
    required this.creatorName,
    required this.creatorAvatar,
    this.isCreatorNINVerified = false,
    this.participantCount = 1,
    this.image,
    required this.category,
    required this.timestamp,
  });

  factory RallyModel.fromJson(Map<String, dynamic> json) {
    RallyType parsedType = RallyType.join;
    final typeStr = (json['type'] ?? 'JOIN').toString().toUpperCase();
    if (typeStr == 'ASK') parsedType = RallyType.ask;
    if (typeStr == 'HELP') parsedType = RallyType.help;
    if (typeStr == 'OFFER') parsedType = RallyType.offer;
    if (typeStr == 'COMMUNITY') parsedType = RallyType.community;

    return RallyModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? 'Rally Title',
      description: json['description'] ?? '',
      type: parsedType,
      location: json['location'] ?? 'Nearby',
      creatorId: json['creatorId'] ?? json['userId'] ?? '',
      creatorName: json['creatorName'] ?? json['userName'] ?? 'Lalao Neighbor',
      creatorAvatar: json['creatorAvatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      isCreatorNINVerified: json['isCreatorNINVerified'] ?? json['isVerified'] ?? false,
      participantCount: json['participantCount'] ?? json['attendees']?.length ?? 1,
      image: json['image'] ?? json['mediaUrl'],
      category: json['category'] ?? 'General',
      timestamp: json['timestamp'] ?? json['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  String get typeLabel {
    switch (type) {
      case RallyType.ask:
        return 'ASK';
      case RallyType.help:
        return 'HELP';
      case RallyType.join:
        return 'JOIN';
      case RallyType.offer:
        return 'OFFER';
      case RallyType.community:
        return 'COMMUNITY';
    }
  }
}
