import { Injectable, Logger } from '@nestjs/common';

export type DisconnectHook = (
  userId: string,
  isLastConnection: boolean,
) => void | Promise<void>;

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);
  private onDisconnectHooks: DisconnectHook[] = [];

  addOnDisconnectHook(hook: DisconnectHook) {
    this.onDisconnectHooks.push(hook);
  }

  async runDisconnectHooks(userId: string, isLastConnection: boolean) {
    for (const hook of this.onDisconnectHooks) {
      try {
        await hook(userId, isLastConnection);
      } catch (error) {
        this.logger.error(error, 'Error in socket disconnect hook');
      }
    }
  }
}
