import { User, UserModelDocument } from "./user.model";

export class UserRepository {
  async findById(id: string): Promise<UserModelDocument | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<UserModelDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select(
      "+passwordHash"
    );
  }

  async create(data: Partial<UserModelDocument>): Promise<UserModelDocument> {
    return User.create(data);
  }

  async updateById(
    id: string,
    data: Partial<UserModelDocument>
  ): Promise<UserModelDocument | null> {
    return User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }
}