// modules/publisher/dto/update-publisher.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { PublishVideoDto } from './publish-video.dto';

export class UpdatePublisherDto extends PartialType(PublishVideoDto) {}
