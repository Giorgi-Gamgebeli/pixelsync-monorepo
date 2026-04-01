import { Injectable } from '@nestjs/common';

@Injectable()
export class CallStateService {
  private readonly activeCalls = new Map<string, string>();

  isActive(userId: string) {
    return this.activeCalls.has(userId);
  }

  getCallId(userId: string) {
    return this.activeCalls.get(userId);
  }

  setCall(userId: string, callId: string) {
    this.activeCalls.set(userId, callId);
  }

  clearCall(userId: string, callId?: string) {
    const currentCallId = this.activeCalls.get(userId);
    if (callId && currentCallId !== callId) return;
    this.activeCalls.delete(userId);
  }
}
