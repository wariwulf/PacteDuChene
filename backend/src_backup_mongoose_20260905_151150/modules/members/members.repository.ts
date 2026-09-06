import { User } from "../users/user.model";
import type { UserRole } from "../../common/constants/roles";

export class MemberRepository {
  async findAll() {
    return User.find({
      status: { $ne: "DELETED" },
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    return User.findOne({
      _id: id,
      status: { $ne: "DELETED" },
    }).select("-passwordHash");
  }

  async findByRole(role: UserRole) {
    return User.find({
      role,
      status: { $ne: "DELETED" },
    })
      .select("-passwordHash")
      .sort({ createdAt: -1 });
  }
}