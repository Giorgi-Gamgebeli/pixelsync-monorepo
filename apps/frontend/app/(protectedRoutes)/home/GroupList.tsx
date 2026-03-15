import { getGroupChats } from "@/app/_dataAccessLayer/groupActions";
import GroupListClient from "./GroupListClient";

async function GroupList() {
  const result = await getGroupChats();
  const groups = Array.isArray(result) ? result : [];

  return <GroupListClient groups={groups} />;
}

export default GroupList;
