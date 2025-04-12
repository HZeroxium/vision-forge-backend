// modules/users/dto/user-pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-reponse.dto';

export class PaginationMeta {
  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  sortOrder: 'asc' | 'desc';

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class UsersPaginationDto {
  @ApiProperty({ type: [UserResponseDto] })
  data: UserResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;

  constructor(partial: Partial<UsersPaginationDto>) {
    Object.assign(this, partial);
  }
}
