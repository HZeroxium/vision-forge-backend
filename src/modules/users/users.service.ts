// modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role, User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { UsersPaginationDto } from './dto/user-pagination.dto';
import { UserResponseDto } from './dto/user-reponse.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all users in the database.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' = 'asc',
  ): Promise<UsersPaginationDto> {
    // Convert page and limit to integers
    page = parseInt(page.toString(), 10);
    limit = parseInt(limit.toString(), 10);
    const skip = (page - 1) * limit;

    const [users, totalCount] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { id: order },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      users,
      order,
    };
  }

  /**
   * Finds a user by its ID.
   *
   * @param id The ID of the user to find.
   * @returns The user with the given ID.
   * @throws {NotFoundException} If the user is not found.
   */
  async findById(id: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return new UserResponseDto(user);
  }

  /**
   * Finds a user by their email address.
   *
   * @param email The email address of the user to find.
   * @returns A promise that resolves to the user with the given email, or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email, deletedAt: null } });
  }

  /**
   * Creates a new user.
   *
   * @param createUserDto The details of the new user.
   * @returns The newly created user.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        role: createUserDto.role || Role.USER,
      },
    });
  }

  /**
   * Updates a user.
   *
   * @param id The ID of the user to update.
   * @param updateUserDto The details to update.
   * @returns The updated user.
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }
    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        password: hashedPassword,
        name: updateUserDto.name,
        role: updateUserDto.role,
      },
    });
  }

  /**
   * Deletes a user.
   *
   * @param id The ID of the user to delete.
   * @returns The deleted user.
   */
  async delete(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Sets a password reset token for a user.
   *
   * @param email The email address of the user to set the token for.
   * @returns The password reset token.
   */
  async setResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await this.prisma.user.update({
      where: { email },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });
    return token;
  }

  /**
   * Resets a user's password.
   *
   * @param token The password reset token received via email.
   * @param newPassword The new password to set.
   * @returns The updated user.
   * @throws {NotFoundException} If the token is invalid or expired.
   */
  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) throw new NotFoundException('Invalid or expired token');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Changes a user's password.
   *
   * @param userId - The ID of the user whose password is being changed.
   * @param oldPassword - The current password of the user.
   * @param newPassword - The new password to set.
   * @returns A promise that resolves to the updated user.
   * @throws {UnauthorizedException} If the old password is incorrect.
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Old password is incorrect');
    }
    const hashedPassword: string = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}
