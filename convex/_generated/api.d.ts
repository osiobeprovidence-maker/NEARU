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
import type * as chatRequests from "../chatRequests.js";
import type * as eventHub from "../eventHub.js";
import type * as follows from "../follows.js";
import type * as lib_auth from "../lib/auth.js";
import type * as messages from "../messages.js";
import type * as messagingHelpers from "../messagingHelpers.js";
import type * as notifications from "../notifications.js";
import type * as rallies from "../rallies.js";
import type * as users from "../users.js";
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
  chatRequests: typeof chatRequests;
  eventHub: typeof eventHub;
  follows: typeof follows;
  "lib/auth": typeof lib_auth;
  messages: typeof messages;
  messagingHelpers: typeof messagingHelpers;
  notifications: typeof notifications;
  rallies: typeof rallies;
  users: typeof users;
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
