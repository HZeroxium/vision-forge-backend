import { Test, TestingModule } from '@nestjs/testing';
import { ScriptGenController } from './script-gen.controller';
import { ScriptGenService } from './script-gen.service';

describe('ScriptGenController', () => {
  let controller: ScriptGenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScriptGenController],
      providers: [ScriptGenService],
    }).compile();

    controller = module.get<ScriptGenController>(ScriptGenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
