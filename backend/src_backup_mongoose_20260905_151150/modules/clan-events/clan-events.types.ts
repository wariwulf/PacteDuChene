export type ClanEventType =
  | "COLLECTE"
  | "COMBAT"
  | "CEREMONIE"
  | "REUNION"
  | "SORTIE"
  | "AUTRE";

export type ClanEventStatus =
  | "PUBLISHED"
  | "CANCELLED"
  | "COMPLETED";

export type ParticipationStatus =
  | "ACCEPTED"
  | "MAYBE"
  | "DECLINED";

export interface ClanEventInput {
  eventId: string;
  title: string;
  description?: string;
  type?: ClanEventType;
  startsAt: Date;
  endsAt?: Date;
  location?: string;
  discordChannel?: string;
  status?: ClanEventStatus;
}

export interface ClanEventData extends ClanEventInput {
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParticipationData {
  eventId: string;
  memberId: string;
  status: ParticipationStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
