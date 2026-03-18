import { redirect } from "next/navigation";

type Params = {
  params: Promise<{
    groupId: string;
  }>;
};

async function Page({ params }: Params) {
  const { groupId } = await params;
  redirect(`/home?group=${groupId}`);
}

export default Page;
