"use client";

import { changeHeading, changeIcon } from "@/app/_redux/layoutSlice";
import { UserStatus } from "@/types";
import { DirectMessage } from "@prisma/client";
import { Session } from "next-auth";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

type MessagesProps = {
  messages: DirectMessage[] | undefined;
  session: Session | null;
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

  useEffect(() => {
    dispatch(changeHeading("Direct Messages"));
    dispatch(changeIcon("mdi:message-bubble"));
  }, []);
  return <div></div>;
}

export default Messages;
