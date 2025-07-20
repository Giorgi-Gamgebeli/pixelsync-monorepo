import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.directMessage.deleteMany();
  await prisma.user.deleteMany();

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "john@test.com",
        password:
          "$2b$12$Gb3bsH/caOkqwXHbbwZTX.MBNoe6aEl5wLIeP6b5NUybuBme6iKiG", // password123
        name: "john_doe",
        userName: "john_doe",
        status: "ONLINE",
        image:
          "https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//bob.jpeg",
        emailVerified: new Date(),
      },
    }),

    prisma.user.create({
      data: {
        email: "jane@test.com",
        password:
          "$2b$12$Gb3bsH/caOkqwXHbbwZTX.MBNoe6aEl5wLIeP6b5NUybuBme6iKiG",
        name: "jane_doe",
        userName: "jane_doe",
        status: "ONLINE",
        image:
          "https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//jane.jpeg",
        emailVerified: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@test.com",
        password:
          "$2b$12$Gb3bsH/caOkqwXHbbwZTX.MBNoe6aEl5wLIeP6b5NUybuBme6iKiG",
        name: "bob_smith",
        userName: "bob_smith",
        status: "OFFLINE",
        image:
          "https://pgqopytnbkjovvnwtvun.supabase.co/storage/v1/object/public/pixelsync-bucket//john.jpeg",
        emailVerified: new Date(),
      },
    }),
  ]);
  await prisma.user.updateMany({
    where: { email: "adminaccount@gmail.com" },
    data: {},
  });

  // // Make them friends with each other
  await Promise.all([
    prisma.user.update({
      where: { id: users[0].id },
      data: {
        friends: {
          connect: [{ id: users[1].id }, { id: users[2].id }],
        },
      },
    }),
    prisma.user.update({
      where: { id: users[1].id },
      data: {
        friends: {
          connect: [{ id: users[0].id }, { id: users[2].id }],
        },
      },
    }),
    // prisma.user.update({
    //   where: { id: users[2].id },
    //   data: {
    //     friends: {
    //       connect: [{ id: users[1].id }],
    //     },
    //   },
    // }),
  ]);

  await Promise.all([
    prisma.directMessage.create({
      data: {
        content: "Hey Jane, how are you?",
        senderId: users[0].id,
        receiverId: users[1].id,
      },
    }),
    prisma.directMessage.create({
      data: {
        content: "I'm good John, thanks for asking!",
        senderId: users[1].id,
        receiverId: users[0].id,
      },
    }),
    prisma.directMessage.create({
      data: {
        content: "Hey Bob, are you there?",
        senderId: users[0].id,
        receiverId: users[2].id,
      },
    }),
    // Additional messages
    prisma.directMessage.create({
      data: {
        content: "Hey, want to grab lunch?",
        senderId: users[1].id,
        receiverId: users[2].id,
      },
    }),
    prisma.directMessage.create({
      data: {
        content: "Sure, where should we meet?",
        senderId: users[2].id,
        receiverId: users[1].id,
      },
    }),
    prisma.directMessage.create({
      data: {
        content: "How about that new place downtown?",
        senderId: users[1].id,
        receiverId: users[2].id,
      },
    }),
  ]);

  console.log("Database has been seeded! 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
