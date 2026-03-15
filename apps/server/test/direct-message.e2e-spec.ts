import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { encode } from '@auth/core/jwt';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { DirectMessageService } from '../src/direct-message/direct-message.service';

const SECRET = process.env.NEXTAUTH_SECRET!;
const SALT = 'authjs.session-token';

async function createSessionToken(payload: Record<string, unknown>) {
  return encode({ token: payload, secret: SECRET, salt: SALT });
}

/**
 * Connects a socket and waits for handleConnection to fully complete
 * by listening for the user:status ONLINE event.
 */
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

describe('DirectMessage Gateway (e2e)', () => {
  let app: INestApplication;
  let port: number;

  const mockUsersService = {
    updateStatus: jest.fn().mockResolvedValue({}),
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockDirectMessageService = {
    create: jest.fn().mockImplementation((body) =>
      Promise.resolve({
        id: 1,
        content: body.content,
        senderId: body.senderId,
        receiverId: body.receiverId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      }),
    ),
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUnreadCounts: jest.fn().mockResolvedValue({}),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .overrideProvider(DirectMessageService)
      .useValue(mockDirectMessageService)
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
  });

  it('should reject unauthenticated connections', async () => {
    const socket = io(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    const reason = await new Promise<string>((resolve) => {
      socket.on('disconnect', (r) => resolve(r));
    });

    expect(reason).toBe('io server disconnect');
    socket.close();
  });

  it('should accept authenticated connections and set user online', async () => {
    const token = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
      name: 'User One',
    });

    const socket = await connectAndWaitReady(port, token, 'user-1');
    expect(socket.connected).toBe(true);
    expect(mockUsersService.updateStatus).toHaveBeenCalledWith({
      userId: 'user-1',
      status: 'ONLINE',
    });

    socket.close();
  });

  it('should send and receive messages between two users', async () => {
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

    const receivedMessage = new Promise<any>((resolve) => {
      receiver.on('dm:receive', (msg) => resolve(msg));
    });

    const echoedMessage = new Promise<any>((resolve) => {
      sender.on('dm:receive', (msg) => resolve(msg));
    });

    sender.emit('dm:send', {
      receiverId: 'user-2',
      content: 'Hello from e2e!',
      senderId: 'user-1',
    });

    const [received, echoed] = await Promise.all([
      receivedMessage,
      echoedMessage,
    ]);

    expect(received.content).toBe('Hello from e2e!');
    expect(received.senderId).toBe('user-1');
    expect(received.receiverId).toBe('user-2');
    expect(echoed.content).toBe('Hello from e2e!');

    expect(mockDirectMessageService.create).toHaveBeenCalledWith({
      receiverId: 'user-2',
      content: 'Hello from e2e!',
      senderId: 'user-1',
    });

    sender.close();
    receiver.close();
  });

  it('should broadcast typing indicators', async () => {
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

    const typingEvent = new Promise<any>((resolve) => {
      receiver.on('dm:typing', (data) => resolve(data));
    });

    sender.emit('dm:typing', { receiverId: 'user-2', isTyping: true });

    const typing = await typingEvent;
    expect(typing.userId).toBe('user-1');
    expect(typing.isTyping).toBe(true);

    sender.close();
    receiver.close();
  });

  it('should emit online/offline status events', async () => {
    const listenerToken = await createSessionToken({
      sub: 'listener',
      email: 'listener@test.com',
    });
    const listener = await connectAndWaitReady(port, listenerToken, 'listener');

    const onlineEvent = new Promise<any>((resolve) => {
      listener.on('user:status', (data) => {
        if (data.userId === 'new-user' && data.status === 'ONLINE')
          resolve(data);
      });
    });

    const newToken = await createSessionToken({
      sub: 'new-user',
      email: 'new@test.com',
    });
    const newSocket = await connectAndWaitReady(port, newToken, 'new-user');
    const online = await onlineEvent;
    expect(online).toEqual({ userId: 'new-user', status: 'ONLINE' });

    const offlineEvent = new Promise<any>((resolve) => {
      listener.on('user:status', (data) => {
        if (data.userId === 'new-user' && data.status === 'OFFLINE')
          resolve(data);
      });
    });

    newSocket.close();
    const offline = await offlineEvent;
    expect(offline).toEqual({ userId: 'new-user', status: 'OFFLINE' });

    listener.close();
  });

  it('should send unread counts on connection', async () => {
    mockDirectMessageService.getUnreadCounts.mockResolvedValueOnce({
      'user-A': 3,
      'user-B': 1,
    });

    const token = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });

    const socket = io(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token, salt: SALT },
    });

    const unread = await new Promise<any>((resolve, reject) => {
      socket.on('dm:unread', (counts) => resolve(counts));
      socket.on('connect_error', (err) => reject(err));
      setTimeout(() => reject(new Error('Timeout waiting for dm:unread')), 5000);
    });

    expect(unread).toEqual({ 'user-A': 3, 'user-B': 1 });
    expect(mockDirectMessageService.getUnreadCounts).toHaveBeenCalledWith('user-1');

    socket.close();
  });

  it('should mark messages as read via dm:read', async () => {
    const token = await createSessionToken({
      sub: 'user-1',
      email: 'user1@test.com',
    });

    const socket = await connectAndWaitReady(port, token, 'user-1');

    socket.emit('dm:read', { senderId: 'user-2' });

    // Give the server a moment to process the event
    await new Promise((r) => setTimeout(r, 100));

    expect(mockDirectMessageService.markAsRead).toHaveBeenCalledWith(
      'user-2',
      'user-1',
    );

    socket.close();
  });

  it('should persist messages in background after emitting', async () => {
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

    const receivedMessage = new Promise<any>((resolve) => {
      receiver.on('dm:receive', (msg) => resolve(msg));
    });

    sender.emit('dm:send', {
      receiverId: 'user-2',
      content: 'Persist test',
      senderId: 'user-1',
    });

    const received = await receivedMessage;

    // Message should arrive immediately with correct fields
    expect(received.content).toBe('Persist test');
    expect(received.senderId).toBe('user-1');
    expect(received.isRead).toBe(false);
    expect(received.createdAt).toBeDefined();

    // Give background persist a moment
    await new Promise((r) => setTimeout(r, 100));

    // DB create should have been called in background
    expect(mockDirectMessageService.create).toHaveBeenCalledWith({
      receiverId: 'user-2',
      content: 'Persist test',
      senderId: 'user-1',
    });

    sender.close();
    receiver.close();
  });
});
