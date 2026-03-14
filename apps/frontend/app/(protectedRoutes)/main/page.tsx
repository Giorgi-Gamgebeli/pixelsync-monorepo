import { redirect } from "next/navigation";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

function Page() {
  redirect(DEFAULT_LOGIN_REDIRECT);
}

export default Page;
