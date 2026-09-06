import {
  GameEvent,
} from "./events.types";

import {
  QuestsService,
} from "../quests/quests.service";

export class EventsService {
  constructor(
    private readonly questsService =
      new QuestsService()
  ) {}

  async dispatch(
    event: GameEvent
  ): Promise<void> {
    console.log(
      `[EVENT] ${event.type} - user=${event.userId} target=${event.targetId ?? "none"}`
    );

    await this.questsService.handleGameEvent(
      event
    );
  }
}

export const eventsService =
  new EventsService();