import { Test, TestingModule } from '@nestjs/testing';
import { ScriptGenService } from './script-gen.service';

describe('ScriptGenService', () => {
  let service: ScriptGenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScriptGenService],
    }).compile();

    service = module.get<ScriptGenService>(ScriptGenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
