import { redirect } from "next/navigation";

type Params = {
  params: Promise<{
    friendID: string;
  }>;
};

async function Page({ params }: Params) {
  const { friendID } = await params;
  redirect(`/home?dm=${friendID}`);
}

export default Page;
