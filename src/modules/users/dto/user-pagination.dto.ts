// modules/users/dto/user-pagination.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-reponse.dto';

export class UsersPaginationDto {
  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  order: 'asc' | 'desc';

  @ApiProperty({ type: [UserResponseDto] })
  users: UserResponseDto[];
}
