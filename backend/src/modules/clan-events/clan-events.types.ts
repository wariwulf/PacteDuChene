export type ClanEventType =
  | "COLLECTE" | "COMBAT" | "CEREMONIE" | "REUNION" | "SORTIE" | "AUTRE";

export type ClanEventMode = "INSTANT" | "LONG";
export type ClanEventStatus = "PUBLISHED" | "CANCELLED" | "COMPLETED" | "ARCHIVED";
export type ParticipationStatus = "ACCEPTED" | "MAYBE" | "DECLINED";
export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export interface EventObjectiveData {
  objectiveId: string;
  title: string;
  description?: string;
  required: boolean;
}

export interface EventRewardData {
  rewardId: string;
  currencyId: "solidus" | "argent" | "bronze" | "xp";
  amount: number;
  label?: string;
}

export interface ParticipationOptionsData {
  accepted: boolean;
  declined: boolean;
  maybe: boolean;
  attempts: boolean;
  maxAttempts?: number;
}

export interface RecurrenceData {
  enabled: boolean;
  frequency?: RecurrenceFrequency;
  interval?: number;
  weekdays?: number[]; // 0 = dimanche ... 6 = samedi
  monthDay?: number;
  nthWeek?: 1 | 2 | 3 | 4 | 5;
  nthWeekday?: number;
  until?: Date;
}

export interface ClanEventInput {
  eventId: string;
  title: string;
  description?: string;
  type?: ClanEventType;
  mode?: ClanEventMode;
  startsAt: Date;
  endsAt?: Date;
  durationMinutes?: number;
  location?: string;
  discordChannel?: string;
  imageUrl?: string;
  objectives?: EventObjectiveData[];
  rewards?: EventRewardData[];
  participationOptions?: ParticipationOptionsData;
  reminderMinutes?: number;
  recurrence?: RecurrenceData;
  seriesId?: string;
  occurrenceNumber?: number;
  status?: ClanEventStatus;
}

export interface ClanEventData extends ClanEventInput {
  createdBy?: string;
  discordGuildId?: string;
  discordChannelId?: string;
  discordMessageId?: string;
  discordReminderMessageId?: string;
  discordReminderThreadId?: string;
  reminderSentAt?: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  cleanupAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  discordSyncAt?: Date;
}

export type CreateClanEventData = Omit<ClanEventData, "eventId"> & {
  eventId?: string;
};

export interface ParticipationData {
  eventId: string;
  memberId: string;
  status: ParticipationStatus;
  attemptsUsed?: number;
  createdAt?: Date;
  updatedAt?: Date;
  discordSyncAt?: Date;
}

export interface ClanEventBotAction {
  action: "PUBLISH" | "REMIND" | "CLEANUP";
  event?: unknown;
  eventId: string;
  channelId?: string;
  messageId?: string;
  reminderMessageId?: string;
}
