import GroupChatView from "./GroupChatView";

type Params = {
  params: Promise<{
    groupId: string;
  }>;
};

async function Page({ params }: Params) {
  const { groupId } = await params;
  return <GroupChatView groupId={Number(groupId)} />;
}

export default Page;
