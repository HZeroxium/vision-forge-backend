// modules/users/mappers/user.mapper.ts
import { Injectable } from '@nestjs/common';
import { UserEntity } from '../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user-reponse.dto';
import { UsersPaginationDto } from '../dto/user-pagination.dto';

/**
 * Mapper class for transforming User entities to DTOs
 *
 * This implements the Mapper pattern, which separates domain objects
 * from presentation objects, enhancing maintainability and reducing
 * tight coupling between layers.
 */
@Injectable()
export class UserMapper {
  /**
   * Maps a User entity to a UserResponseDto
   *
   * @param user The User entity to map
   * @returns The mapped UserResponseDto
   */
  mapEntityToDto(user: UserEntity | any): UserResponseDto {
    return new UserResponseDto({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  /**
   * Maps an array of User entities to UserResponseDto array
   *
   * @param users Array of User entities
   * @returns Array of UserResponseDto objects
   */
  mapEntitiesToDtos(users: UserEntity[] | any[]): UserResponseDto[] {
    return users.map((user) => this.mapEntityToDto(user));
  }

  /**
   * Creates a pagination DTO with mapped user entities
   *
   * @param users The user entities to map
   * @param totalCount Total count of users
   * @param page Current page
   * @param limit Items per page
   * @param order Sort order
   * @returns UsersPaginationDto with mapped users
   */
  mapToPaginationDto(
    users: UserEntity[] | any[],
    totalCount: number,
    page: number,
    limit: number,
    order: 'asc' | 'desc',
  ): UsersPaginationDto {
    const mappedUsers = this.mapEntitiesToDtos(users);
    const totalPages = Math.ceil(totalCount / limit);

    return new UsersPaginationDto({
      data: mappedUsers,
      meta: {
        totalItems: totalCount,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
        sortOrder: order,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  }
}
