import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessagService } from './direct-messag.service';

describe('DirectMessagService', () => {
  let service: DirectMessagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DirectMessagService],
    }).compile();

    service = module.get<DirectMessagService>(DirectMessagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
