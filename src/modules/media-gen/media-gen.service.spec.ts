import { Test, TestingModule } from '@nestjs/testing';
import { MediaGenService } from './media-gen.service';

describe('MediaGenService', () => {
  let service: MediaGenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediaGenService],
    }).compile();

    service = module.get<MediaGenService>(MediaGenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
