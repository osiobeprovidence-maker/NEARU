import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/rally_model.dart';
import '../models/cycle_model.dart';
import '../models/message_model.dart';

class ConvexService {
  final String deploymentUrl;

  ConvexService({
    this.deploymentUrl = 'https://rare-rooster-878.eu-west-1.convex.cloud',
  });

  /// Execute a Convex HTTP Query
  Future<dynamic> query(String path, [Map<String, dynamic>? args]) async {
    try {
      final uri = Uri.parse('$deploymentUrl/api/query');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'path': path,
          'args': args ?? {},
        }),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['value'];
      }
    } catch (e) {
      // Fallback handled in feature providers
    }
    return null;
  }

  /// Execute a Convex HTTP Mutation
  Future<dynamic> mutation(String path, [Map<String, dynamic>? args]) async {
    try {
      final uri = Uri.parse('$deploymentUrl/api/mutation');
      final response = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'path': path,
          'args': args ?? {},
        }),
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['value'];
      }
    } catch (e) {
      // Fallback
    }
    return null;
  }

  /// Fetch active rallies list
  Future<List<RallyModel>> fetchActiveRallies() async {
    final res = await query('rallies:listActiveRallies');
    if (res is List) {
      return res.map((e) => RallyModel.fromJson(e as Map<String, dynamic>)).toList();
    }

    // Default sample data fallback matching Lalao schema
    return [
      RallyModel(
        id: 'r1',
        title: 'Saturday 5km Morning Jog in Yaba',
        description: 'Looking for 3-4 running buddies to hit the road from Sabo to Unilag gate tomorrow at 6:30 AM.',
        type: RallyType.join,
        location: 'Yaba, Lagos',
        creatorId: 'u1',
        creatorName: 'Amina Yusuf',
        creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        isCreatorNINVerified: true,
        participantCount: 4,
        category: 'Fitness',
        timestamp: DateTime.now().millisecondsSinceEpoch - 3600000,
      ),
      RallyModel(
        id: 'r2',
        title: 'Need a Generator for 2 Hours (Sabo Area)',
        description: 'Power outage during a critical work deadline. Willing to pay fuel costs!',
        type: RallyType.ask,
        location: 'Sabo, Yaba',
        creatorId: 'u2',
        creatorName: 'Emeka Okonkwo',
        creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        isCreatorNINVerified: true,
        participantCount: 2,
        category: 'Utility',
        timestamp: DateTime.now().millisecondsSinceEpoch - 7200000,
      ),
      RallyModel(
        id: 'r3',
        title: 'Offering Free UI/UX Portfolio Review Sessions',
        description: 'I have 2 hours free this weekend to review junior designers portfolios.',
        type: RallyType.help,
        location: 'Lekki Phase 1',
        creatorId: 'u3',
        creatorName: 'Tunde Bakare',
        creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        isCreatorNINVerified: true,
        participantCount: 8,
        category: 'Mentorship',
        timestamp: DateTime.now().millisecondsSinceEpoch - 14400000,
      ),
    ];
  }

  /// Fetch cycles (stories)
  Future<List<CycleModel>> fetchCycles() async {
    final res = await query('cycles:listActive');
    if (res is List) {
      return res.map((e) => CycleModel.fromJson(e as Map<String, dynamic>)).toList();
    }

    return [
      CycleModel(
        id: 'c1',
        userId: 'u1',
        userName: 'Amina Y.',
        userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        imageUrls: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'],
        timestamp: DateTime.now().millisecondsSinceEpoch - 3600000,
      ),
      CycleModel(
        id: 'c2',
        userId: 'u2',
        userName: 'Emeka O.',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        imageUrls: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'],
        timestamp: DateTime.now().millisecondsSinceEpoch - 7200000,
      ),
      CycleModel(
        id: 'c3',
        userId: 'u3',
        userName: 'Tunde B.',
        userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        imageUrls: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=800'],
        timestamp: DateTime.now().millisecondsSinceEpoch - 14400000,
      ),
    ];
  }

  /// Fetch conversations for user
  Future<List<ConversationModel>> fetchConversations() async {
    final res = await query('messages:listConversations');
    if (res is List) {
      return res.map((e) => ConversationModel.fromJson(e as Map<String, dynamic>)).toList();
    }

    return [
      ConversationModel(
        id: 'conv1',
        otherUserId: 'u1',
        otherUserName: 'Amina Yusuf',
        otherUserAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
        lastMessageText: 'Are we still meeting for the Yaba morning jog?',
        timestamp: DateTime.now().millisecondsSinceEpoch - 3600000,
        unreadCount: 2,
      ),
      ConversationModel(
        id: 'conv2',
        otherUserId: 'u2',
        otherUserName: 'Emeka Okonkwo',
        otherUserAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        lastMessageText: 'Thanks for assisting with the generator yesterday!',
        timestamp: DateTime.now().millisecondsSinceEpoch - 86400000,
        unreadCount: 0,
      ),
    ];
  }

  /// Fetch messages for conversation
  Future<List<MessageModel>> fetchMessages(String conversationId) async {
    final res = await query('messages:list', {'conversationId': conversationId});
    if (res is List) {
      return res.map((e) => MessageModel.fromJson(e as Map<String, dynamic>)).toList();
    }

    return [
      MessageModel(
        id: 'm1',
        senderId: 'u1',
        text: 'Hey! Are we still meeting for the Yaba morning jog?',
        timestamp: DateTime.now().millisecondsSinceEpoch - 3600000,
      ),
    ];
  }
}
