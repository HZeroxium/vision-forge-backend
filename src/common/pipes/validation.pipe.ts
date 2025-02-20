// common/pipes/validation.pipe.ts

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (
      !value ||
      (metadata.metatype &&
        this.shouldValidate(metadata.metatype) &&
        !this.validate(value))
    ) {
      throw new BadRequestException('Validation failed');
    }
    return value;
  }

  private shouldValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private validate(value: any): boolean {
    // Extend with custom validation logic if needed
    return true;
  }
}
