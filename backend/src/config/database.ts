import mongoose from "mongoose";

export async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);

    console.log("🍃 MongoDB connectée avec succès.");
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error);
    process.exit(1);
  }
}