import { User, UserModelDocument } from "./user.model";

export class UsersRepository {
  async findAll(): Promise<UserModelDocument[]> {
    return User.find({ status: { $ne: "DELETED" } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });
  }

  async findById(id: string): Promise<UserModelDocument | null> {
    return User.findOne({ _id: id, status: { $ne: "DELETED" } }).select(
      "-passwordHash"
    );
  }

  async findByEmail(email: string): Promise<UserModelDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
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
    }).select("-passwordHash");
  }
}
