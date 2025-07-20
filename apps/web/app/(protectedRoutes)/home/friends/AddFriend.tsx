"use client";

import { addFriend } from "@/app/_dataAcessLayer/userActions";
import { AddFriendSchema } from "@/app/_schemas/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

function AddFriend() {
  const [isPending, startTransition] = useTransition();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setError,
  } = useForm<z.infer<typeof AddFriendSchema>>({
    resolver: zodResolver(AddFriendSchema),
    defaultValues: {
      userName: "",
    },
  });

  const userNameValue = watch("userName");

  async function onSubmit(values: z.infer<typeof AddFriendSchema>) {
    startTransition(async () => {
      const actionError = await addFriend(values);
      if (actionError?.error)
        setError("userName", { message: actionError.error });
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-4xl">Add Friend</h2>
      <p>You can add friends with their username.</p>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="relative">
          <input
            placeholder="Search"
            className="w-full rounded-xl border border-gray-300 bg-gray-200 px-5 py-5 disabled:cursor-not-allowed disabled:bg-gray-300"
            disabled={isPending}
            {...register("userName")}
            onKeyDown={(e) => e.key == "Enter" && handleSubmit(onSubmit)}
          />
          <button
            type="submit"
            disabled={!userNameValue || isPending}
            className="hover:bg-brand-600 bg-brand-500 absolute top-1/2 right-5 -translate-y-1/2 cursor-pointer rounded-xl px-4 py-2 text-xl text-gray-800 transition-all duration-300 disabled:cursor-not-allowed"
          >
            Send friend request
          </button>
        </div>
        <p className="text-red-600">{errors.userName?.message}</p>
      </form>
    </div>
  );
}

export default AddFriend;
