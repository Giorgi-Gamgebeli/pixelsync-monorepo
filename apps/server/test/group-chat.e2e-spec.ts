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

describe('GroupChat Gateway (e2e)', () => {
  let app: INestApplication;
  let port: number;

  const memberships: Record<number, string[]> = {};

  const mockUsersService = {
    updateStatus: jest.fn().mockResolvedValue({}),
    getFriendIds: jest.fn().mockResolvedValue([]),
    areFriends: jest.fn().mockResolvedValue(false),
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
    for (const key of Object.keys(memberships)) {
      delete memberships[key as unknown as number];
    }
  });

  it('should join group rooms on connection', async () => {
    addGroupMembers(1, 'user-1');
    addGroupMembers(2, 'user-1');

    const token = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });

    const socket = await connectAndWaitReady(port, token, 'user-1');

    expect(mockUsersService.getGroupIds).toHaveBeenCalledWith('user-1');
    expect(socket.connected).toBe(true);

    socket.close();
  });

  it('should send and receive messages between group members', async () => {
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

    const sender = await connectAndWaitReady(port, token1, 'user-1');
    const receiver = await connectAndWaitReady(port, token2, 'user-2');

    const receivedMessage = new Promise<any>((resolve) => {
      receiver.on('group:receive', (msg) => resolve(msg));
    });

    const echoedMessage = new Promise<any>((resolve) => {
      sender.on('group:receive', (msg) => resolve(msg));
    });

    sender.emit('group:send', {
      groupId: 1,
      content: 'Hello group!',
    });

    const [received, echoed] = await Promise.all([
      receivedMessage,
      echoedMessage,
    ]);

    expect(received.content).toBe('Hello group!');
    expect(received.senderId).toBe('user-1');
    expect(received.groupId).toBe(1);
    expect(received.isEdited).toBe(false);
    expect(received.sender.userName).toBe('UserOne');
    expect(echoed.content).toBe('Hello group!');

    sender.close();
    receiver.close();
  });

  it('should reject messages from non-members', async () => {
    addGroupMembers(1, 'user-2');
    // user-1 is NOT a member

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const nonMember = await connectAndWaitReady(port, token1, 'user-1');
    const member = await connectAndWaitReady(port, token2, 'user-2');

    let memberGotMessage = false;
    member.on('group:receive', () => {
      memberGotMessage = true;
    });

    nonMember.emit('group:send', {
      groupId: 1,
      content: 'Should not arrive',
    });

    await new Promise((r) => setTimeout(r, 300));

    expect(memberGotMessage).toBe(false);
    expect(mockGroupChatService.createMessage).not.toHaveBeenCalled();

    nonMember.close();
    member.close();
  });

  it('should reject empty messages', async () => {
    addGroupMembers(1, 'user-1', 'user-2');

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const sender = await connectAndWaitReady(port, token1, 'user-1');
    const receiver = await connectAndWaitReady(port, token2, 'user-2');

    let receiverGotMessage = false;
    receiver.on('group:receive', () => {
      receiverGotMessage = true;
    });

    // Empty string
    sender.emit('group:send', { groupId: 1, content: '' });
    // Whitespace only
    sender.emit('group:send', { groupId: 1, content: '   ' });

    await new Promise((r) => setTimeout(r, 300));

    expect(receiverGotMessage).toBe(false);
    expect(mockGroupChatService.createMessage).not.toHaveBeenCalled();

    sender.close();
    receiver.close();
  });

  it('should reject group:join from non-members', async () => {
    addGroupMembers(1, 'user-2');
    // user-1 is NOT a member

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const nonMember = await connectAndWaitReady(port, token1, 'user-1');
    const member = await connectAndWaitReady(port, token2, 'user-2');

    // Non-member tries to join the group room
    nonMember.emit('group:join', { groupId: 1 });
    await new Promise((r) => setTimeout(r, 200));

    // Now a real member sends a message
    let nonMemberGotMessage = false;
    nonMember.on('group:receive', () => {
      nonMemberGotMessage = true;
    });

    member.emit('group:send', { groupId: 1, content: 'Secret message' });
    await new Promise((r) => setTimeout(r, 300));

    // Non-member should NOT have received it (join was rejected)
    expect(nonMemberGotMessage).toBe(false);

    nonMember.close();
    member.close();
  });

  it('should broadcast typing indicators to group members', async () => {
    addGroupMembers(1, 'user-1', 'user-2');

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const typer = await connectAndWaitReady(port, token1, 'user-1');
    const observer = await connectAndWaitReady(port, token2, 'user-2');

    const typingEvent = new Promise<any>((resolve) => {
      observer.on('group:typing', (data) => resolve(data));
    });

    typer.emit('group:typing', { groupId: 1, isTyping: true });

    const typing = await typingEvent;
    expect(typing.groupId).toBe(1);
    expect(typing.userId).toBe('user-1');
    expect(typing.isTyping).toBe(true);

    typer.close();
    observer.close();
  });

  it('should NOT send typing indicator back to the typer', async () => {
    addGroupMembers(1, 'user-1', 'user-2');

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });

    const typer = await connectAndWaitReady(port, token1, 'user-1');

    let typerGotOwnTyping = false;
    typer.on('group:typing', () => {
      typerGotOwnTyping = true;
    });

    typer.emit('group:typing', { groupId: 1, isTyping: true });
    await new Promise((r) => setTimeout(r, 300));

    expect(typerGotOwnTyping).toBe(false);

    typer.close();
  });

  it('should persist group messages in background', async () => {
    addGroupMembers(1, 'user-1', 'user-2');

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
      userName: 'UserOne',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const sender = await connectAndWaitReady(port, token1, 'user-1');
    const receiver = await connectAndWaitReady(port, token2, 'user-2');

    const receivedMessage = new Promise<any>((resolve) => {
      receiver.on('group:receive', (msg) => resolve(msg));
    });

    sender.emit('group:send', { groupId: 1, content: 'Persist test' });
    await receivedMessage;

    await new Promise((r) => setTimeout(r, 100));

    expect(mockGroupChatService.createMessage).toHaveBeenCalledWith(
      1,
      'user-1',
      'Persist test',
    );

    sender.close();
    receiver.close();
  });

  it('should not include id in broadcast payload', async () => {
    addGroupMembers(1, 'user-1', 'user-2');

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
      userName: 'UserOne',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const sender = await connectAndWaitReady(port, token1, 'user-1');
    const receiver = await connectAndWaitReady(port, token2, 'user-2');

    const receivedMessage = new Promise<any>((resolve) => {
      receiver.on('group:receive', (msg) => resolve(msg));
    });

    sender.emit('group:send', { groupId: 1, content: 'No id check' });
    const received = await receivedMessage;

    // id should not be present (or at least not negative)
    expect(received.id).toBeUndefined();
    expect(received.createdAt).toBeDefined();
    expect(received.updatedAt).toBeDefined();

    sender.close();
    receiver.close();
  });

  it('should reject typing from non-members', async () => {
    addGroupMembers(1, 'user-2');
    // user-1 is NOT a member

    const token1 = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });
    const token2 = await createSessionToken({
      sub: 'user-2',
      email: 'user2@test.com',
    });

    const nonMember = await connectAndWaitReady(port, token1, 'user-1');
    const member = await connectAndWaitReady(port, token2, 'user-2');

    let memberGotTyping = false;
    member.on('group:typing', () => {
      memberGotTyping = true;
    });

    nonMember.emit('group:typing', { groupId: 1, isTyping: true });
    await new Promise((r) => setTimeout(r, 300));

    expect(memberGotTyping).toBe(false);

    nonMember.close();
    member.close();
  });
});
