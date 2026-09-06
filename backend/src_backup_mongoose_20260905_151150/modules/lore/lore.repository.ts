import { Lore } from "./lore.model";
import { CreateLoreData } from "./lore.types";

export class LoreRepository {
  async findAll(includeDisabled = false) {
    return Lore.find(includeDisabled ? {} : { enabled: true }).sort({ order: 1, title: 1 });
  }
  async findByLoreId(loreId: string) { return Lore.findOne({ loreId }); }
  async create(data: CreateLoreData) { return Lore.create(data); }
  async update(loreId: string, data: Partial<CreateLoreData>) {
    return Lore.findOneAndUpdate({ loreId }, data, { new: true, runValidators: true });
  }
  async delete(loreId: string) { return Lore.findOneAndDelete({ loreId }); }
}
export const loreRepository = new LoreRepository();
