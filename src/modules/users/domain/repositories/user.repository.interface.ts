// modules/users/domain/repositories/user.repository.interface.ts
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';

export interface IUserRepository {
  findAll(
    page: number,
    limit: number,
    order: 'asc' | 'desc',
  ): Promise<{
    users: UserEntity[];
    totalCount: number;
  }>;

  findById(id: string): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  create(data: CreateUserDto, hashedPassword: string): Promise<UserEntity>;

  update(
    id: string,
    data: UpdateUserDto,
    hashedPassword?: string,
  ): Promise<UserEntity>;

  softDelete(id: string): Promise<UserEntity>;

  setResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<UserEntity>;

  resetPassword(id: string, hashedPassword: string): Promise<UserEntity>;

  findByResetToken(token: string): Promise<UserEntity | null>;
}
