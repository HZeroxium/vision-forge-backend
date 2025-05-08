// modules/users/domain/entities/user.entity.ts
import { Role } from '@prisma/client';

export class UserEntity {
  id: string;
  email: string;
  password: string;
  name: string | null;
  description: string | null; // Added field for user self-description
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  isPasswordResetTokenValid(): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return false;
    }
    return this.passwordResetExpires > new Date();
  }
}
