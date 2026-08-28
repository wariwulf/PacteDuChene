import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import routes from "./routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import paxDeiRoutes from "./modules/paxdei/paxdei.routes";
import loreRoutes from "./modules/lore/lore.routes";
import discordRoutes from "./modules/discord/discord.routes";
import shopsRoutes from "./modules/shops/shops.routes";
import usersRoutes from "./modules/users/users.routes";
import clanRoutes from "./modules/clan/clan.routes";
import clanEventsRoutes from "./modules/clan-events/clan-events.routes";

const app = express();

app.use(cookieParser());

const allowedOrigins = [
  "http://localhost:3000",
  "https://lepacteduchene.fr",
  "https://www.lepacteduchene.fr",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origine non autorisée par le CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// Routes générales
app.use("/api", routes);

// Modules
app.use("/api/users", usersRoutes);
app.use("/api/clan", clanRoutes);
app.use("/api/clan-events", clanEventsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/paxdei", paxDeiRoutes);
app.use("/api/lore", loreRoutes);
app.use("/api/discord", discordRoutes);
app.use("/api/shops", shopsRoutes);

export default app;
