import dotenv from "dotenv";
import { connectDatabase } from "./config/database";

dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`
🌳========================================🌳
   Pacte du Chêne - Backend démarré
   Port : ${PORT}
🌳========================================🌳
`);
  });
}

bootstrap();