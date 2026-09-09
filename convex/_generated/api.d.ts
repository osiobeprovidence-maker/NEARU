/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as adminHelpers from "../adminHelpers.js";
import type * as ads from "../ads.js";
import type * as blueCheck from "../blueCheck.js";
import type * as chatRequests from "../chatRequests.js";
import type * as cycles from "../cycles.js";
import type * as eventHub from "../eventHub.js";
import type * as follows from "../follows.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as media from "../media.js";
import type * as messages from "../messages.js";
import type * as messagingHelpers from "../messagingHelpers.js";
import type * as notifications from "../notifications.js";
import type * as pages from "../pages.js";
import type * as push from "../push.js";
import type * as rallies from "../rallies.js";
import type * as releases from "../releases.js";
import type * as users from "../users.js";
import type * as verificationWorkflow from "../verificationWorkflow.js";
import type * as verifications from "../verifications.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  adminHelpers: typeof adminHelpers;
  ads: typeof ads;
  blueCheck: typeof blueCheck;
  chatRequests: typeof chatRequests;
  cycles: typeof cycles;
  eventHub: typeof eventHub;
  follows: typeof follows;
  friends: typeof friends;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  media: typeof media;
  messages: typeof messages;
  messagingHelpers: typeof messagingHelpers;
  notifications: typeof notifications;
  pages: typeof pages;
  push: typeof push;
  rallies: typeof rallies;
  releases: typeof releases;
  users: typeof users;
  verificationWorkflow: typeof verificationWorkflow;
  verifications: typeof verifications;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
