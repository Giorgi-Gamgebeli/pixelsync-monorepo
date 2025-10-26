"use client";

import { changeHeading, changeIcon } from "@/app/_redux/layoutSlice";
import { UserStatus } from "@repo/types";
import { DirectMessage } from "@prisma/client";
import { Session } from "next-auth";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import Message from "./Message";
import z from "zod";

type MessagesProps = {
  messages: DirectMessage[] | undefined;
  session: Session;
  friend:
    | {
        id: string;
        status: UserStatus;
        userName: string | null;
        image: string | null;
      }
    | undefined;
};

function Messages({ messages, friend, session }: MessagesProps) {
  const dispatch = useDispatch();
  console.log(session);

  useEffect(() => {
    dispatch(changeHeading("Direct Messages"));
    dispatch(changeIcon("mdi:message-bubble"));

    async function doFetch() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/direct-message`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        },
      );
      const data = await res.json();
      console.log(data, "dataaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }

    doFetch();
  }, []);

  // async function onSubmit(values: z.infer<typeof AddFriendSchema>) {
  //   const actionError = await addFriend(values);
  //   // if (actionError?.error)
  //   //   setError("userName", { message: actionError.error });
  // }

  return (
    <div className="flex h-full w-full flex-col justify-end gap-5 px-10 py-5">
      {messages ? (
        messages.map((m, i) => <Message key={i} text={m.content} />)
      ) : (
        <p>Start Texting Your Friend</p>
      )}
      <input
        name="messsage"
        type="text"
        placeholder="Send message"
        className="w-full rounded-xl border-2 border-gray-300 bg-white p-4"
      />
    </div>
  );
}

export default Messages;
