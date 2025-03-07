import { Test, TestingModule } from '@nestjs/testing';
import { MediaGenController } from './media-gen.controller';
import { MediaGenService } from './media-gen.service';

describe('MediaGenController', () => {
  let controller: MediaGenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MediaGenController],
      providers: [MediaGenService],
    }).compile();

    controller = module.get<MediaGenController>(MediaGenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
