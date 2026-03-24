import GroupChatView from "@/app/(protectedRoutes)/home/group/[groupId]/GroupChatView";

type Params = {
  params: Promise<{
    groupId: string;
  }>;
};

async function Page({ params }: Params) {
  const { groupId } = await params;
  const parsedGroupId = Number(groupId);

  return <GroupChatView groupId={parsedGroupId} />;
}

export default Page;
