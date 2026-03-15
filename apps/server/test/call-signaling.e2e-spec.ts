import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { encode } from '@auth/core/jwt';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { DirectMessageService } from '../src/direct-message/direct-message.service';
import { GroupChatService } from '../src/group-chat/group-chat.service';

const SECRET = process.env.NEXTAUTH_SECRET!;
const SALT = 'authjs.session-token';

async function createSessionToken(payload: Record<string, unknown>) {
  return encode({ token: payload, secret: SECRET, salt: SALT });
}

async function connectAndWaitReady(
  port: number,
  sessionToken: string,
  userId: string,
): Promise<Socket> {
  const socket = io(`http://localhost:${port}`, {
    transports: ['websocket'],
    auth: { token: sessionToken, salt: SALT },
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('user:status', (data: { userId: string; status: string }) => {
      if (data.userId === userId && data.status === 'ONLINE') resolve();
    });
    socket.on('connect_error', (err) => reject(err));
    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });

  return socket;
}

function waitForEvent<T = any>(
  socket: Socket,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout waiting for ${event}`)),
      timeoutMs,
    );
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

describe('Call Signaling (e2e)', () => {
  let app: INestApplication;
  let port: number;

  const friendships: Record<string, string[]> = {};
  const memberships: Record<number, string[]> = {};

  const mockUsersService = {
    updateStatus: jest.fn().mockResolvedValue({}),
    getFriendIds: jest.fn().mockImplementation((userId: string) => {
      return Promise.resolve(friendships[userId] || []);
    }),
    areFriends: jest.fn().mockImplementation((userA: string, userB: string) => {
      const friends = friendships[userA] || [];
      return Promise.resolve(friends.includes(userB));
    }),
    getGroupIds: jest.fn().mockImplementation((userId: string) => {
      const groups = Object.entries(memberships)
        .filter(([, members]) => members.includes(userId))
        .map(([groupId]) => parseInt(groupId));
      return Promise.resolve(groups);
    }),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDirectMessageService = {
    create: jest.fn().mockResolvedValue({}),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUnreadCounts: jest.fn().mockResolvedValue({}),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  };

  const mockGroupChatService = {
    isMember: jest
      .fn()
      .mockImplementation((groupId: number, userId: string) => {
        const members = memberships[groupId] || [];
        return Promise.resolve(members.includes(userId));
      }),
    createMessage: jest.fn().mockResolvedValue({}),
    getMemberIds: jest.fn().mockImplementation((groupId: number) => {
      return Promise.resolve(memberships[groupId] || []);
    }),
    create: jest.fn(),
    getMessages: jest.fn().mockResolvedValue([]),
  };

  function makeFriends(...userIds: string[]) {
    for (const id of userIds) {
      friendships[id] = userIds.filter((u) => u !== id);
    }
  }

  function addGroupMembers(groupId: number, ...userIds: string[]) {
    memberships[groupId] = [...(memberships[groupId] || []), ...userIds];
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(DirectMessageService)
      .useValue(mockDirectMessageService)
      .overrideProvider(GroupChatService)
      .useValue(mockGroupChatService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
    const url = await app.getUrl();
    port = parseInt(new URL(url).port, 10);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    for (const key of Object.keys(friendships)) {
      delete friendships[key];
    }
    for (const key of Object.keys(memberships)) {
      delete memberships[key as unknown as number];
    }
  });

  // ── 1-on-1 Call Tests ──

  describe('1-on-1 calls', () => {
    it('should send call:incoming to the receiver when caller initiates', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');

      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });

      const data = await incoming;
      expect(data.callerId).toBe('caller');
      expect(data.callerName).toBe('CallerName');
      expect(data.callType).toBe('audio');
      expect(data.callId).toBeDefined();

      caller.close();
      callee.close();
    });

    it('should reject call:initiate between non-friends', async () => {
      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const error = waitForEvent(caller, 'call:error');

      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });

      const data = await error;
      expect(data.message).toBe('Not friends');

      caller.close();
      callee.close();
    });

    it('should relay call:accepted back to caller on accept', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');

      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'video',
      });

      const incomingData = await incoming;

      const accepted = waitForEvent(caller, 'call:accepted');
      callee.emit('call:accept', { callId: incomingData.callId });

      const acceptedData = await accepted;
      expect(acceptedData.callId).toBe(incomingData.callId);
      expect(acceptedData.userId).toBe('callee');

      caller.close();
      callee.close();
    });

    it('should relay call:declined back to caller on decline', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');

      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });

      const incomingData = await incoming;

      const declined = waitForEvent(caller, 'call:declined');
      callee.emit('call:decline', { callId: incomingData.callId });

      const declinedData = await declined;
      expect(declinedData.callId).toBe(incomingData.callId);
      expect(declinedData.userId).toBe('callee');

      caller.close();
      callee.close();
    });

    it('should relay call:ended on hangup', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });
      const incomingData = await incoming;

      // Callee accepts
      const accepted = waitForEvent(caller, 'call:accepted');
      callee.emit('call:accept', { callId: incomingData.callId });
      await accepted;

      // Caller hangs up
      const ended = waitForEvent(callee, 'call:ended');
      caller.emit('call:hangup', { callId: incomingData.callId });

      const endedData = await ended;
      expect(endedData.callId).toBe(incomingData.callId);
      expect(endedData.reason).toBe('hangup');

      caller.close();
      callee.close();
    });

    it('should prevent a user from being in two calls at once', async () => {
      makeFriends('caller', 'callee', 'third');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });
      const thirdToken = await createSessionToken({
        sub: 'third',
        email: 'third@test.com',
        userName: 'Third',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');
      const third = await connectAndWaitReady(port, thirdToken, 'third');

      // First call
      const incoming = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });
      await incoming;

      // Caller tries a second call
      const error = waitForEvent(caller, 'call:error');
      caller.emit('call:initiate', {
        receiverId: 'third',
        callType: 'audio',
      });

      const errorData = await error;
      expect(errorData.message).toBe('Already in a call');

      // Third tries to call the callee who's ringing
      const error2 = waitForEvent(third, 'call:error');
      third.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });

      const errorData2 = await error2;
      expect(errorData2.message).toBe('User is already in a call');

      caller.close();
      callee.close();
      third.close();
    });

    it('should relay WebRTC offer/answer/ice-candidate between peers', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });
      const incomingData = await incoming;
      const callId = incomingData.callId;

      // Accept
      const accepted = waitForEvent(caller, 'call:accepted');
      callee.emit('call:accept', { callId });
      await accepted;

      // Offer from caller → callee
      const offerReceived = waitForEvent(callee, 'call:offer');
      caller.emit('call:offer', {
        callId,
        toUserId: 'callee',
        offer: { type: 'offer', sdp: 'fake-sdp-offer' },
      });
      const offerData = await offerReceived;
      expect(offerData.fromUserId).toBe('caller');
      expect(offerData.offer.sdp).toBe('fake-sdp-offer');

      // Answer from callee → caller
      const answerReceived = waitForEvent(caller, 'call:answer');
      callee.emit('call:answer', {
        callId,
        toUserId: 'caller',
        answer: { type: 'answer', sdp: 'fake-sdp-answer' },
      });
      const answerData = await answerReceived;
      expect(answerData.fromUserId).toBe('callee');
      expect(answerData.answer.sdp).toBe('fake-sdp-answer');

      // ICE candidate from caller → callee
      const iceReceived = waitForEvent(callee, 'call:ice-candidate');
      caller.emit('call:ice-candidate', {
        callId,
        toUserId: 'callee',
        candidate: {
          candidate: 'fake-candidate',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      });
      const iceData = await iceReceived;
      expect(iceData.fromUserId).toBe('caller');
      expect(iceData.candidate.candidate).toBe('fake-candidate');

      caller.close();
      callee.close();
    });

    it('should relay media state changes', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'video',
      });
      const incomingData = await incoming;

      const accepted = waitForEvent(caller, 'call:accepted');
      callee.emit('call:accept', { callId: incomingData.callId });
      await accepted;

      const mediaState = waitForEvent(callee, 'call:media-state');
      caller.emit('call:media-state', {
        callId: incomingData.callId,
        audioEnabled: false,
        videoEnabled: true,
      });

      const data = await mediaState;
      expect(data.userId).toBe('caller');
      expect(data.audioEnabled).toBe(false);
      expect(data.videoEnabled).toBe(true);

      caller.close();
      callee.close();
    });

    it('should clean up call state on disconnect', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      const incoming = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });
      const incomingData = await incoming;

      const accepted = waitForEvent(caller, 'call:accepted');
      callee.emit('call:accept', { callId: incomingData.callId });
      await accepted;

      // Caller disconnects abruptly
      const ended = waitForEvent(callee, 'call:ended');
      caller.close();

      const endedData = await ended;
      expect(endedData.callId).toBe(incomingData.callId);
      expect(endedData.reason).toBe('disconnect');

      callee.close();
    });

    it('should allow a new call after previous call ends', async () => {
      makeFriends('caller', 'callee');

      const callerToken = await createSessionToken({
        sub: 'caller',
        email: 'caller@test.com',
        userName: 'CallerName',
      });
      const calleeToken = await createSessionToken({
        sub: 'callee',
        email: 'callee@test.com',
      });

      const caller = await connectAndWaitReady(port, callerToken, 'caller');
      const callee = await connectAndWaitReady(port, calleeToken, 'callee');

      // First call: initiate and decline
      const incoming1 = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'audio',
      });
      const data1 = await incoming1;

      const declined = waitForEvent(caller, 'call:declined');
      callee.emit('call:decline', { callId: data1.callId });
      await declined;

      // Second call should work
      const incoming2 = waitForEvent(callee, 'call:incoming');
      caller.emit('call:initiate', {
        receiverId: 'callee',
        callType: 'video',
      });
      const data2 = await incoming2;
      expect(data2.callType).toBe('video');
      expect(data2.callId).not.toBe(data1.callId);

      caller.close();
      callee.close();
    });
  });

  // ── Group Call Tests ──

  describe('group calls', () => {
    it('should let a member join a group call and receive call:group-active', async () => {
      addGroupMembers(1, 'user-1', 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');

      const active = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });

      const data = await active;
      expect(data.callId).toBeDefined();
      expect(data.participants).toEqual([]);

      user1.close();
    });

    it('should reject group call join from non-member', async () => {
      addGroupMembers(1, 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');

      const error = waitForEvent(user1, 'call:error');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });

      const data = await error;
      expect(data.message).toBe('Not a group member');

      user1.close();
    });

    it('should notify existing participants when a new user joins', async () => {
      addGroupMembers(1, 'user-1', 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });
      const token2 = await createSessionToken({
        sub: 'user-2',
        email: 'user2@test.com',
        userName: 'UserTwo',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');
      const user2 = await connectAndWaitReady(port, token2, 'user-2');

      // User1 joins first
      const active1 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active1;

      // User2 joins — user1 should get notified
      const joined = waitForEvent(user1, 'call:group-joined');
      const active2 = waitForEvent(user2, 'call:group-active');
      user2.emit('call:group-join', { groupId: 1, callType: 'audio' });

      const [joinedData, activeData] = await Promise.all([joined, active2]);

      expect(joinedData.userId).toBe('user-2');
      expect(joinedData.userName).toBe('UserTwo');
      expect(activeData.participants).toEqual([
        { userId: 'user-1', userName: 'UserOne' },
      ]);

      user1.close();
      user2.close();
    });

    it('should notify remaining participants when someone leaves', async () => {
      addGroupMembers(1, 'user-1', 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });
      const token2 = await createSessionToken({
        sub: 'user-2',
        email: 'user2@test.com',
        userName: 'UserTwo',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');
      const user2 = await connectAndWaitReady(port, token2, 'user-2');

      // Both join
      const active1 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      const activeData1 = await active1;

      const active2 = waitForEvent(user2, 'call:group-active');
      user2.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active2;

      // User2 leaves
      const left = waitForEvent(user1, 'call:group-left');
      user2.emit('call:group-leave', { callId: activeData1.callId });

      const leftData = await left;
      expect(leftData.userId).toBe('user-2');
      expect(leftData.callId).toBe(activeData1.callId);

      user1.close();
      user2.close();
    });

    it('should clean up group call on disconnect', async () => {
      addGroupMembers(1, 'user-1', 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });
      const token2 = await createSessionToken({
        sub: 'user-2',
        email: 'user2@test.com',
        userName: 'UserTwo',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');
      const user2 = await connectAndWaitReady(port, token2, 'user-2');

      // Both join
      const active1 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active1;

      const active2 = waitForEvent(user2, 'call:group-active');
      user2.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active2;

      // User2 disconnects abruptly
      const left = waitForEvent(user1, 'call:group-left');
      user2.close();

      const leftData = await left;
      expect(leftData.userId).toBe('user-2');

      user1.close();
    });

    it('should relay offer/answer/ice between group call participants', async () => {
      addGroupMembers(1, 'user-1', 'user-2');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });
      const token2 = await createSessionToken({
        sub: 'user-2',
        email: 'user2@test.com',
        userName: 'UserTwo',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');
      const user2 = await connectAndWaitReady(port, token2, 'user-2');

      // Both join
      const active1 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      const activeData = await active1;
      const callId = activeData.callId;

      const active2 = waitForEvent(user2, 'call:group-active');
      user2.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active2;

      // User2 sends offer to user1
      const offerReceived = waitForEvent(user1, 'call:offer');
      user2.emit('call:offer', {
        callId,
        toUserId: 'user-1',
        offer: { type: 'offer', sdp: 'group-sdp-offer' },
      });
      const offerData = await offerReceived;
      expect(offerData.fromUserId).toBe('user-2');
      expect(offerData.offer.sdp).toBe('group-sdp-offer');

      // User1 sends answer to user2
      const answerReceived = waitForEvent(user2, 'call:answer');
      user1.emit('call:answer', {
        callId,
        toUserId: 'user-2',
        answer: { type: 'answer', sdp: 'group-sdp-answer' },
      });
      const answerData = await answerReceived;
      expect(answerData.fromUserId).toBe('user-1');
      expect(answerData.answer.sdp).toBe('group-sdp-answer');

      user1.close();
      user2.close();
    });

    it('should prevent joining a call when already in one', async () => {
      addGroupMembers(1, 'user-1');
      addGroupMembers(2, 'user-1');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');

      // Join first group call
      const active = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      await active;

      // Try to join second group call
      const error = waitForEvent(user1, 'call:error');
      user1.emit('call:group-join', { groupId: 2, callType: 'audio' });

      const data = await error;
      expect(data.message).toBe('Already in a call');

      user1.close();
    });

    it('should allow joining group call after leaving previous one', async () => {
      addGroupMembers(1, 'user-1');
      addGroupMembers(2, 'user-1');

      const token1 = await createSessionToken({
        sub: 'user-1',
        email: 'user1@test.com',
        userName: 'UserOne',
      });

      const user1 = await connectAndWaitReady(port, token1, 'user-1');

      // Join first group call
      const active1 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 1, callType: 'audio' });
      const data1 = await active1;

      // Leave first
      user1.emit('call:group-leave', { callId: data1.callId });
      await new Promise((r) => setTimeout(r, 100));

      // Join second group call should work
      const active2 = waitForEvent(user1, 'call:group-active');
      user1.emit('call:group-join', { groupId: 2, callType: 'video' });
      const data2 = await active2;
      expect(data2.callId).toBeDefined();
      expect(data2.callId).not.toBe(data1.callId);

      user1.close();
    });
  });
});
