/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as _utils from "../_utils.js";
import type * as call from "../call.js";
import type * as conversation from "../conversation.js";
import type * as conversations from "../conversations.js";
import type * as encryption from "../encryption.js";
import type * as files from "../files.js";
import type * as friend from "../friend.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as linkPreviews from "../linkPreviews.js";
import type * as mentions from "../mentions.js";
import type * as message from "../message.js";
import type * as messages from "../messages.js";
import type * as notificationSettings from "../notificationSettings.js";
import type * as presence from "../presence.js";
import type * as reactions from "../reactions.js";
import type * as request from "../request.js";
import type * as requests from "../requests.js";
import type * as rooms from "../rooms.js";
import type * as search from "../search.js";
import type * as stories from "../stories.js";
import type * as user from "../user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  _utils: typeof _utils;
  call: typeof call;
  conversation: typeof conversation;
  conversations: typeof conversations;
  encryption: typeof encryption;
  files: typeof files;
  friend: typeof friend;
  friends: typeof friends;
  http: typeof http;
  linkPreviews: typeof linkPreviews;
  mentions: typeof mentions;
  message: typeof message;
  messages: typeof messages;
  notificationSettings: typeof notificationSettings;
  presence: typeof presence;
  reactions: typeof reactions;
  request: typeof request;
  requests: typeof requests;
  rooms: typeof rooms;
  search: typeof search;
  stories: typeof stories;
  user: typeof user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
