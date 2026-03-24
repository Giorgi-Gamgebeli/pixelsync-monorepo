import DMChatView from "@/app/(protectedRoutes)/home/[friendID]/DMChatView";

type Params = {
  params: Promise<{
    friendID: string;
  }>;
};

async function Page({ params }: Params) {
  const { friendID } = await params;
  return <DMChatView friendId={friendID} />;
}

export default Page;
