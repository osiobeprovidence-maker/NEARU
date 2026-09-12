class UserModel {
  final String id;
  final String name;
  final String username;
  final String avatar;
  final String? firebaseUid;
  final String? email;
  final String? phone;
  final String? bio;
  final String? location;
  final bool isNINVerified;
  final bool isBlueVerified;
  final String? accountType; // 'personal' | 'organization' | 'business'
  final String? organizationName;
  final List<String> interests;
  final List<String> publicInterests;
  final String? coverImage;
  final String? role; // 'super_admin' | 'admin' | 'moderator' | 'user'
  final bool onboardingCompleted;

  UserModel({
    required this.id,
    required this.name,
    required this.username,
    required this.avatar,
    this.firebaseUid,
    this.email,
    this.phone,
    this.bio,
    this.location,
    this.isNINVerified = false,
    this.isBlueVerified = false,
    this.accountType = 'personal',
    this.organizationName,
    this.interests = const [],
    this.publicInterests = const [],
    this.coverImage,
    this.role = 'user',
    this.onboardingCompleted = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? 'Lalao User',
      username: json['username'] ?? '',
      avatar: json['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      firebaseUid: json['firebaseUid'],
      email: json['email'],
      phone: json['phone'],
      bio: json['bio'],
      location: json['location'] ?? 'Nigeria',
      isNINVerified: json['isNINVerified'] ?? false,
      isBlueVerified: json['isBlueVerified'] ?? json['isVerified'] ?? false,
      accountType: json['accountType'] ?? 'personal',
      organizationName: json['organizationName'],
      interests: List<String>.from(json['interests'] ?? []),
      publicInterests: List<String>.from(json['publicInterests'] ?? []),
      coverImage: json['coverImage'],
      role: json['role'] ?? 'user',
      onboardingCompleted: json['onboardingCompleted'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'username': username,
      'avatar': avatar,
      'firebaseUid': firebaseUid,
      'email': email,
      'phone': phone,
      'bio': bio,
      'location': location,
      'isNINVerified': isNINVerified,
      'isBlueVerified': isBlueVerified,
      'accountType': accountType,
      'organizationName': organizationName,
      'interests': interests,
      'publicInterests': publicInterests,
      'coverImage': coverImage,
      'role': role,
      'onboardingCompleted': onboardingCompleted,
    };
  }

  bool get isAdmin => role == 'super_admin' || role == 'admin' || email == 'osiobeprovidence@gmail.com';
}
