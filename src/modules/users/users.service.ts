// modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { UsersPaginationDto } from './dto/user-pagination.dto';
import { UserResponseDto } from './dto/user-reponse.dto';
import { UserMapper } from './mappers/user.mapper';
import { IUserRepository } from './domain/repositories/user.repository.interface';
import { UserEntity } from './domain/entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly userMapper: UserMapper,
  ) {}

  /**
   * Retrieves a paginated list of users.
   *
   * @param page - The page number to retrieve (default is 1).
   * @param limit - The number of users per page (default is 10).
   * @param order - The order of users by 'asc' or 'desc' (default is 'asc').
   * @returns A promise that resolves to a UsersPaginationDto containing paginated users and metadata.
   */
  async findAll(
    page: number = 1,
    limit: number = 10,
    order: 'asc' | 'desc' = 'asc',
  ): Promise<UsersPaginationDto> {
    this.logger.log(
      `Finding all users - page: ${page}, limit: ${limit}, order: ${order}`,
    );

    // Convert page and limit to integers
    page = parseInt(page.toString(), 10);
    limit = parseInt(limit.toString(), 10);

    const { users, totalCount } = await this.userRepository.findAll(
      page,
      limit,
      order,
    );

    // Use the mapper to transform the entities to DTOs
    return this.userMapper.mapToPaginationDto(
      users,
      totalCount,
      page,
      limit,
      order,
    );
  }

  /**
   * Finds a user by its ID.
   *
   * @param id The ID of the user to find.
   * @returns The user with the given ID.
   * @throws {NotFoundException} If the user is not found.
   */
  async findById(id: string): Promise<UserResponseDto> {
    this.logger.log(`Finding user by id: ${id}`);

    const user = await this.userRepository.findById(id);

    if (!user) {
      this.logger.warn(`User with ID ${id} not found`);
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Use the mapper to transform the entity to DTO
    return this.userMapper.mapEntityToDto(user);
  }

  /**
   * Finds a user by their email address.
   *
   * @param email The email address of the user to find.
   * @returns A promise that resolves to the user with the given email, or null if not found.
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Creates a new user.
   *
   * @param createUserDto The details of the new user.
   * @returns The newly created user entity.
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    // Generate hash for non-empty passwords only
    const hashedPassword = createUserDto.password
      ? await bcrypt.hash(createUserDto.password, 10)
      : ''; // Empty hash for OAuth users

    return this.userRepository.create(createUserDto, hashedPassword);
  }

  /**
   * Updates a user.
   *
   * @param id The ID of the user to update.
   * @param updateUserDto The details to update.
   * @returns The updated user entity.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    let hashedPassword: string | undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.userRepository.update(id, updateUserDto, hashedPassword);
  }

  /**
   * Deletes a user.
   *
   * @param id The ID of the user to delete.
   * @returns The deleted user entity.
   */
  async delete(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return this.userRepository.softDelete(id);
  }

  /**
   * Sets a password reset token for a user.
   *
   * @param email The email address of the user to set the token for.
   * @returns The password reset token.
   */
  async setResetToken(email: string): Promise<string> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.setResetToken(email, token, expires);
    return token;
  }

  /**
   * Resets a user's password.
   *
   * @param token The password reset token received via email.
   * @param newPassword The new password to set.
   * @returns The updated user entity.
   * @throws {NotFoundException} If the token is invalid or expired.
   */
  async resetPassword(token: string, newPassword: string): Promise<UserEntity> {
    const user = await this.userRepository.findByResetToken(token);
    if (!user) throw new NotFoundException('Invalid or expired token');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.userRepository.resetPassword(user.id, hashedPassword);
  }

  /**
   * Changes a user's password.
   *
   * @param userId - The ID of the user whose password is being changed.
   * @param oldPassword - The current password of the user.
   * @param newPassword - The new password to set.
   * @returns A promise that resolves to the updated user entity.
   * @throws {UnauthorizedException} If the old password is incorrect.
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedPassword: string = await bcrypt.hash(newPassword, 10);
    return this.userRepository.resetPassword(userId, hashedPassword);
  }
}
