// modules/users/infrastructure/repositories/prisma-user.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UserEntity } from '../../domain/entities/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { Role, User } from '@prisma/client';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  private readonly logger = new Logger(PrismaUserRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapPrismaUserToEntity(prismaUser: User): UserEntity {
    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email,
      password: prismaUser.password,
      name: prismaUser.name,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt,
      passwordResetToken: prismaUser.passwordResetToken,
      passwordResetExpires: prismaUser.passwordResetExpires,
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' = 'asc',
  ): Promise<{ users: UserEntity[]; totalCount: number }> {
    const skip = (page - 1) * limit;

    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { id: order },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      users: users.map((user) => this.mapPrismaUserToEntity(user)),
      totalCount,
    };
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  async create(
    data: CreateUserDto,
    hashedPassword: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || Role.USER,
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async update(
    id: string,
    data: UpdateUserDto,
    hashedPassword?: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        password: hashedPassword || undefined,
        name: data.name,
        role: data.role,
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async softDelete(id: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async setResetToken(
    email: string,
    token: string,
    expires: Date,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async resetPassword(id: string, hashedPassword: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  async findByResetToken(token: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }
}
