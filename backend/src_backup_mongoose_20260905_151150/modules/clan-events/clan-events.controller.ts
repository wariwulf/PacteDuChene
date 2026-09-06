import type { Response } from "express";

import type { AuthenticatedRequest } from "../../middleware/auth.middleware";

import { clanEventsService } from "./clan-events.service";

import type {
  ClanEventStatus,
  ClanEventType,
  ParticipationStatus,
} from "./clan-events.types";

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Express peut exposer un paramètre de route sous la forme :
 *
 * string | string[] | undefined
 *
 * Le reste de notre application travaille avec des identifiants
 * simples de type string.
 */
function getParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

/**
 * Récupère l'identifiant du membre authentifié.
 *
 * Les routes de ce module passent par requireAuth, mais
 * AuthenticatedRequest conserve user comme propriété optionnelle.
 */
function getUserId(
  req: AuthenticatedRequest
): string {
  if (!req.user?.id) {
    throw new Error("Authentification requise.");
  }

  return req.user.id;
}

/**
 * Convertit une valeur en Date.
 *
 * Retourne undefined lorsque la valeur est absente ou invalide.
 */
function toDate(
  value: unknown
): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : value;
  }

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date;
}

/**
 * Récupère le message d'une erreur de manière uniforme.
 */
function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

/**
 * ============================================================
 * ESPACE MEMBRE
 * ============================================================
 */

/**
 * GET /upcoming
 *
 * Récupère les prochains événements du Pacte avec la
 * participation du membre connecté.
 */
export async function listUpcoming(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const memberId = getUserId(req);

    const data =
      await clanEventsService.getUpcoming(
        memberId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Erreur récupération événements à venir :",
      error
    );

    return res.status(500).json({
      success: false,
      message: getErrorMessage(
        error,
        "Impossible de charger les événements."
      ),
    });
  }
}

/**
 * GET /:eventId
 *
 * Récupère un événement précis ainsi que la participation
 * du membre connecté.
 */
export async function getEvent(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId =
      getParam(req.params.eventId);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de l'événement manquant.",
      });
    }

    const memberId = getUserId(req);

    const data =
      await clanEventsService.getEvent(
        eventId,
        memberId
      );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    const message = getErrorMessage(
      error,
      "Impossible de charger l'événement."
    );

    const status =
      message === "Événement introuvable."
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * POST /:eventId/participation
 *
 * Enregistre ou modifie la participation du membre.
 */
export async function setParticipation(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId =
      getParam(req.params.eventId);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de l'événement manquant.",
      });
    }

    const memberId = getUserId(req);

    const status =
      req.body?.status as ParticipationStatus;

    if (!status) {
      return res.status(400).json({
        success: false,
        message:
          "Le statut de participation est obligatoire.",
      });
    }

    const participation =
      await clanEventsService.setParticipation(
        eventId,
        memberId,
        status
      );

    return res.status(200).json({
      success: true,
      data: participation,
    });
  } catch (error) {
    console.error(
      "Erreur enregistrement participation :",
      error
    );

    return res.status(400).json({
      success: false,
      message: getErrorMessage(
        error,
        "Impossible d'enregistrer votre participation."
      ),
    });
  }
}

/**
 * DELETE /:eventId/participation
 *
 * Supprime la participation du membre connecté.
 */
export async function removeParticipation(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId =
      getParam(req.params.eventId);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de l'événement manquant.",
      });
    }

    const memberId = getUserId(req);

    await clanEventsService.removeParticipation(
      eventId,
      memberId
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Erreur suppression participation :",
      error
    );

    const message = getErrorMessage(
      error,
      "Impossible de retirer votre participation."
    );

    const status =
      message === "Événement introuvable."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * ============================================================
 * ADMINISTRATION
 * ============================================================
 */

/**
 * GET /admin/all
 *
 * Liste tous les événements.
 */
export async function listAdmin(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const events =
      await clanEventsService.listAll();

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error(
      "Erreur liste administrative des événements :",
      error
    );

    return res.status(500).json({
      success: false,
      message: getErrorMessage(
        error,
        "Impossible de charger les événements."
      ),
    });
  }
}

/**
 * POST /admin
 *
 * Création d'un événement.
 */
export async function createAdmin(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const body = req.body ?? {};

    const eventId =
      String(body.eventId ?? "").trim();

    const title =
      String(body.title ?? "").trim();

    const description =
      String(body.description ?? "").trim();

    const startsAt =
      toDate(body.startsAt);

    const endsAt =
      body.endsAt !== undefined &&
      body.endsAt !== null &&
      body.endsAt !== ""
        ? toDate(body.endsAt)
        : undefined;

    /**
     * Validation explicite de la date de début.
     *
     * On évite ainsi de transmettre undefined au service
     * alors que ClanEventData exige un Date.
     */
    if (!startsAt) {
      return res.status(400).json({
        success: false,
        message:
          "La date de début est obligatoire et doit être valide.",
      });
    }

    if (
      body.endsAt !== undefined &&
      body.endsAt !== null &&
      body.endsAt !== "" &&
      !endsAt
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La date de fin est invalide.",
      });
    }

    const event =
      await clanEventsService.create(
        {
          eventId,
          title,
          description,
          type:
            (body.type ??
              "AUTRE") as ClanEventType,
          startsAt,
          endsAt,
          location:
            String(body.location ?? "").trim(),
          discordChannel:
            String(
              body.discordChannel ?? ""
            ).trim(),
          status:
            (body.status ??
              "PUBLISHED") as ClanEventStatus,
        },
        getUserId(req)
      );

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(
      "Erreur création événement :",
      error
    );

    return res.status(400).json({
      success: false,
      message: getErrorMessage(
        error,
        "Impossible de créer l'événement."
      ),
    });
  }
}

/**
 * PATCH /admin/:eventId
 *
 * Modification partielle d'un événement.
 */
export async function updateAdmin(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId =
      getParam(req.params.eventId);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de l'événement manquant.",
      });
    }

    const body = req.body ?? {};

    const data: Record<string, unknown> = {};

    /**
     * On ne transmet que les propriétés réellement
     * présentes dans la requête.
     */

    if (body.title !== undefined) {
      data.title =
        String(body.title).trim();
    }

    if (body.description !== undefined) {
      data.description =
        String(body.description).trim();
    }

    if (body.type !== undefined) {
      data.type =
        body.type as ClanEventType;
    }

    if (body.startsAt !== undefined) {
      const startsAt =
        toDate(body.startsAt);

      if (!startsAt) {
        return res.status(400).json({
          success: false,
          message:
            "La date de début est invalide.",
        });
      }

      data.startsAt = startsAt;
    }

    if (body.endsAt !== undefined) {
      if (
        body.endsAt === null ||
        body.endsAt === ""
      ) {
        data.endsAt = undefined;
      } else {
        const endsAt =
          toDate(body.endsAt);

        if (!endsAt) {
          return res.status(400).json({
            success: false,
            message:
              "La date de fin est invalide.",
          });
        }

        data.endsAt = endsAt;
      }
    }

    if (body.location !== undefined) {
      data.location =
        String(body.location).trim();
    }

    if (
      body.discordChannel !== undefined
    ) {
      data.discordChannel =
        String(
          body.discordChannel
        ).trim();
    }

    if (body.status !== undefined) {
      data.status =
        body.status as ClanEventStatus;
    }

    const event =
      await clanEventsService.update(
        eventId,
        data
      );

    if (!event) {
      return res.status(404).json({
        success: false,
        message:
          "Événement introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(
      "Erreur modification événement :",
      error
    );

    const message = getErrorMessage(
      error,
      "Impossible de modifier l'événement."
    );

    const status =
      message === "Événement introuvable."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}

/**
 * DELETE /admin/:eventId
 *
 * Supprime un événement et ses participations.
 */
export async function deleteAdmin(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const eventId =
      getParam(req.params.eventId);

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant de l'événement manquant.",
      });
    }

    const event =
      await clanEventsService.remove(
        eventId
      );

    return res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(
      "Erreur suppression événement :",
      error
    );

    const message = getErrorMessage(
      error,
      "Impossible de supprimer l'événement."
    );

    const status =
      message === "Événement introuvable."
        ? 404
        : 400;

    return res.status(status).json({
      success: false,
      message,
    });
  }
}