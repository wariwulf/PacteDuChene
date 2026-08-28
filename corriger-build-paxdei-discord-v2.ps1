$ErrorActionPreference = "Stop"

$root = Get-Location
$backend = Join-Path $root "backend"
$paxdei = Join-Path $backend "src/modules/paxdei"
$discord = Join-Path $backend "src/modules/discord"

if (-not (Test-Path $backend)) { throw "backend introuvable" }
if (-not (Test-Path $paxdei)) { throw "module Pax Dei introuvable" }

Write-Host "Correction du module Pax Dei et Discord..." -ForegroundColor Green

@'
export interface PaxDeiCharacterInput {
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  mainProfession?: string;
  secondaryProfessions?: string[];
  isMainCharacter?: boolean;
}

export interface PaxDeiCharacterData extends PaxDeiCharacterInput {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaxDeiMarketListing {
  id?: string;
  itemId?: string;
  itemName: string;
  world?: string;
  region?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  seller?: string;
}

export interface PaxDeiWorld {
  id?: string;
  name: string;
  region?: string;
}

export interface PaxDeiProvider {
  getMarketListings?(
    params?: Record<string, string>
  ): Promise<PaxDeiMarketListing[]>;

  getWorlds?(): Promise<PaxDeiWorld[]>;
}
'@ | Set-Content (Join-Path $paxdei "paxdei.types.ts") -Encoding UTF8

@'
import mongoose, { Document, Schema } from "mongoose";
import { PaxDeiCharacterData } from "./paxdei.types";

export interface PaxDeiCharacterDocument
  extends Document,
    PaxDeiCharacterData {}

const PaxDeiCharacterSchema =
  new Schema<PaxDeiCharacterDocument>(
    {
      memberId: {
        type: String,
        required: true,
        index: true,
        trim: true,
      },

      characterName: {
        type: String,
        required: true,
        trim: true,
      },

      avatarId: {
        type: String,
        trim: true,
        default: "",
      },

      world: {
        type: String,
        trim: true,
        default: "",
      },

      province: {
        type: String,
        trim: true,
        default: "",
      },

      region: {
        type: String,
        trim: true,
        default: "",
      },

      clan: {
        type: String,
        trim: true,
        default: "",
      },

      mainProfession: {
        type: String,
        trim: true,
        default: "",
      },

      secondaryProfessions: {
        type: [String],
        default: [],
      },

      isMainCharacter: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
  );

PaxDeiCharacterSchema.index({
  memberId: 1,
  characterName: 1,
});

export const PaxDeiCharacter =
  mongoose.model<PaxDeiCharacterDocument>(
    "PaxDeiCharacter",
    PaxDeiCharacterSchema
  );
'@ | Set-Content (Join-Path $paxdei "paxdei.model.ts") -Encoding UTF8

@'
import { Request, Response } from "express";
import { paxDeiService } from "./paxdei.service";

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export class PaxDeiController {
  async getCharacters(req: Request, res: Response) {
    try {
      const memberId = getParam(req.params.memberId);

      if (!memberId) {
        return res.status(400).json({
          success: false,
          message: "memberId requis",
        });
      }

      const characters =
        await paxDeiService.getCharacters(memberId);

      return res.json({
        success: true,
        data: characters,
      });
    } catch (error) {
      console.error("Pax Dei - getCharacters:", error);

      return res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Erreur serveur",
      });
    }
  }

  async getCharacter(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Identifiant du personnage requis",
        });
      }

      const character =
        await paxDeiService.getCharacter(id);

      return res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error("Pax Dei - getCharacter:", error);

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Personnage introuvable",
      });
    }
  }

  async createCharacter(req: Request, res: Response) {
    try {
      const character =
        await paxDeiService.createCharacter(req.body);

      return res.status(201).json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error("Pax Dei - createCharacter:", error);

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Impossible de créer le personnage",
      });
    }
  }

  async updateCharacter(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Identifiant du personnage requis",
        });
      }

      const character =
        await paxDeiService.updateCharacter(id, req.body);

      return res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error("Pax Dei - updateCharacter:", error);

      return res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le personnage",
      });
    }
  }

  async deleteCharacter(req: Request, res: Response) {
    try {
      const id = getParam(req.params.id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Identifiant du personnage requis",
        });
      }

      await paxDeiService.deleteCharacter(id);

      return res.json({
        success: true,
        message: "Personnage supprime",
      });
    } catch (error) {
      console.error("Pax Dei - deleteCharacter:", error);

      return res.status(404).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Personnage introuvable",
      });
    }
  }
}

export const paxDeiController =
  new PaxDeiController();
'@ | Set-Content (Join-Path $paxdei "paxdei.controller.ts") -Encoding UTF8

if (Test-Path $discord) {
    $discordIndex = Join-Path $discord "index.ts"

    if (Test-Path $discordIndex) {
@'
export { default as discordRoutes } from "./discord.routes";
export { DiscordLink } from "./discord.model";
export type {
  DiscordLinkInput,
  DiscordLinkResponse
} from "./discord.types";
'@ | Set-Content $discordIndex -Encoding UTF8
    }
}

Write-Host "Fichiers corriges. Lancement du build..." -ForegroundColor Cyan

Push-Location $backend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Le build echoue encore." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}
finally {
    Pop-Location
}

Write-Host "BUILD BACKEND REUSSI !" -ForegroundColor Green
