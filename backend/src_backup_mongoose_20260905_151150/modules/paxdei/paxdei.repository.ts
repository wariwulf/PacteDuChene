import { PaxDeiCharacter } from "./paxdei.model";
import { PaxDeiCharacterInput } from "./paxdei.types";

export class PaxDeiRepository {
  async findByMemberId(memberId: string) {
    return PaxDeiCharacter.find({ memberId }).sort({
      isMainCharacter: -1,
      characterName: 1,
    });
  }

  async findById(id: string) {
    return PaxDeiCharacter.findById(id);
  }

  async create(data: PaxDeiCharacterInput) {
    return PaxDeiCharacter.create(data);
  }

  async update(
    id: string,
    data: Partial<PaxDeiCharacterInput>
  ) {
    return PaxDeiCharacter.findByIdAndUpdate(
      id,
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async delete(id: string) {
    return PaxDeiCharacter.findByIdAndDelete(id);
  }

  async clearMainCharacter(
    memberId: string,
    exceptId?: string
  ) {
    const filter: Record<string, unknown> = {
      memberId,
      isMainCharacter: true,
    };

    if (exceptId) {
      filter._id = { $ne: exceptId };
    }

    await PaxDeiCharacter.updateMany(
      filter,
      { $set: { isMainCharacter: false } }
    );
  }
}

export const paxDeiRepository =
  new PaxDeiRepository();
