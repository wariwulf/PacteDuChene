export interface DiscordOAuthUser {
  id: string;
  username: string;
}

export type DiscordOAuthErrorCode =
  | "suspended"
  | "not-linked"
  | "failed";

export class DiscordOAuthError extends Error {
  constructor(public readonly code: DiscordOAuthErrorCode) {
    super(code);
  }
}
