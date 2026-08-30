import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../modules/users/user.model";
import { UserRole } from "../common/constants/roles";

const discordId = process.env.PACTE_OWNER_DISCORD_ID?.trim();
const mongoUri = process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim();

if (!discordId) throw new Error("PACTE_OWNER_DISCORD_ID manquant.");
if (!mongoUri) throw new Error("MONGO_URI/MONGODB_URI manquant.");

await mongoose.connect(mongoUri);
try {
  const user = await User.findOne({ "discord.discordId": discordId });
  if (!user) throw new Error(`Aucun utilisateur lié au Discord ${discordId}.`);

  user.role = UserRole.OWNER;
  await user.save();

  console.log(`OWNER attribué à ${user.profile.username} (${user._id})`);
} finally {
  await mongoose.disconnect();
}
