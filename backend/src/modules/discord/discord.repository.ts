import { DiscordLink, IDiscordLink } from "./discord.model";

export async function findByMemberId(
  memberId: string
): Promise<IDiscordLink | null> {
  return DiscordLink.findOne({ memberId }).exec();
}

export async function findByDiscordId(
  discordId: string
): Promise<IDiscordLink | null> {
  return DiscordLink.findOne({ discordId }).exec();
}

export async function findAllLinks(): Promise<IDiscordLink[]> {
  return DiscordLink.find().exec();
}

export async function createLink(data: {
  memberId: string;
  discordId: string;
  discordUsername?: string;
}): Promise<IDiscordLink> {
  return DiscordLink.create(data);
}

export async function updateLink(
  memberId: string,
  data: {
    discordId?: string;
    discordUsername?: string;
  }
): Promise<IDiscordLink | null> {
  return DiscordLink.findOneAndUpdate(
    { memberId },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  ).exec();
}

export async function deleteLink(
  memberId: string
): Promise<IDiscordLink | null> {
  return DiscordLink.findOneAndDelete({ memberId }).exec();
}
