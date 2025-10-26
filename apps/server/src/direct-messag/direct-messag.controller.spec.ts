import { Test, TestingModule } from '@nestjs/testing';
import { DirectMessagController } from './direct-messag.controller';
import { DirectMessagService } from './direct-messag.service';

describe('DirectMessagController', () => {
  let controller: DirectMessagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectMessagController],
      providers: [DirectMessagService],
    }).compile();

    controller = module.get<DirectMessagController>(DirectMessagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
