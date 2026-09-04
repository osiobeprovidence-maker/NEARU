"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import webpush from "web-push";

// Default VAPID keypair — can be overridden via environment variables
const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  "BAWBNIsZ2WbXzOVVIaAKbq1Gg-gMM9dHZxgeAcHUxi2GRr6LQIv603aKpPqplfu7KIy6N0kO1YkoBfi1iSJZc6Q";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "Rt7Za9tBoh5C9KUco-7AqPYtcNv99lYQjPNpL85PL9E";

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:support@usenearu.com";

// Configure web-push with VAPID credentials
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * Internal action to dispatch a real Web Push notification to all active devices
 * registered to the recipient user.
 */
export const sendPushNotification = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    type: v.string(),
    url: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const context = await ctx.runQuery(internal.notifications.getUserPushContext, {
        userId: args.userId,
      });

      if (!context || !context.subscriptions || context.subscriptions.length === 0) {
        return { sent: 0, reason: "no_subscriptions" };
      }

      // Check server-side user notification preferences
      const settings = context.notificationSettings;
      if (settings) {
        if (settings.pushEnabled === false) {
          return { sent: 0, reason: "push_disabled" };
        }

        // Check category-level preferences
        if (
          (args.type === "new_message" || args.type === "message_request") &&
          settings.chatMessages === false
        ) {
          return { sent: 0, reason: "chat_messages_disabled" };
        }

        if (
          (args.type === "rally_nearby" || args.type === "rally_invite" || args.type === "rally_match") &&
          settings.rallyMatches === false
        ) {
          return { sent: 0, reason: "rally_matches_disabled" };
        }

        if (args.type === "activity_reminder" && settings.activityReminders === false) {
          return { sent: 0, reason: "activity_reminders_disabled" };
        }

        if (args.type === "safety_alert" && settings.safetyAlerts === false) {
          return { sent: 0, reason: "safety_alerts_disabled" };
        }
      }

      const icon =
        args.icon ||
        context.brandIconUrl ||
        "/icon-192.png";

      const payload = JSON.stringify({
        title: args.title,
        body: args.body,
        icon,
        badge: "/icon-192.png",
        url: args.url || "/",
        tag: `${args.type}:${args.url || "root"}`,
        timestamp: Date.now(),
      });

      let sentCount = 0;
      const sendPromises = context.subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24 hours
            urgency: args.type === "new_message" ? "high" : "normal",
          });
          sentCount++;
        } catch (err: any) {
          // If subscription has expired or is gone, remove it from DB
          if (err.statusCode === 404 || err.statusCode === 410) {
            await ctx.runMutation(internal.notifications.removeSubscriptionById, {
              id: sub._id,
            });
          } else {
            console.error(
              `[webpush] Failed to send push to ${sub.endpoint.slice(0, 35)}...`,
              err.message || err
            );
          }
        }
      });

      await Promise.all(sendPromises);
      return { sent: sentCount };
    } catch (err: any) {
      console.error("[push:sendPushNotification] Error:", err.message || err);
      return { sent: 0, error: err.message || err };
    }
  },
});
