import { Request, Response } from "express";
import { paxDeiService } from "./paxdei.service";

function getParam(
  value: string | string[] | undefined
): string {
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
      console.error(
        "Pax Dei - getCharacters:",
        error
      );

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
          message:
            "Identifiant du personnage requis",
        });
      }

      const character =
        await paxDeiService.getCharacter(id);

      return res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error(
        "Pax Dei - getCharacter:",
        error
      );

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
        await paxDeiService.createCharacter(
          req.body
        );

      return res.status(201).json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error(
        "Pax Dei - createCharacter:",
        error
      );

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
          message:
            "Identifiant du personnage requis",
        });
      }

      const character =
        await paxDeiService.updateCharacter(
          id,
          req.body
        );

      return res.json({
        success: true,
        data: character,
      });
    } catch (error) {
      console.error(
        "Pax Dei - updateCharacter:",
        error
      );

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
          message:
            "Identifiant du personnage requis",
        });
      }

      await paxDeiService.deleteCharacter(id);

      return res.json({
        success: true,
        message: "Personnage supprimé",
      });
    } catch (error) {
      console.error(
        "Pax Dei - deleteCharacter:",
        error
      );

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