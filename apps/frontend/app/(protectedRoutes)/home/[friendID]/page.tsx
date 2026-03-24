import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DMChatView from "@/app/(protectedRoutes)/home/[friendID]/DMChatView";
import { getCachedDMChatPageData } from "./getCachedDMChatPageData";

type Params = {
  params: Promise<{
    friendID: string;
  }>;
};

async function Page({ params }: Params) {
  const { friendID } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const data = await getCachedDMChatPageData(friendID, session.user.id);

  return (
    <DMChatView friendId={friendID} session={session} initialData={data} />
  );
}

export default Page;
