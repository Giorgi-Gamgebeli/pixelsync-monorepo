"use client";

import { addFriend } from "@/app/_dataAccessLayer/userActions";
import { AddFriendSchema } from "@repo/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@iconify/react/dist/iconify.js";

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
    <div className="max-w-xl">
      <h2 className="text-lg font-semibold text-white">Add Friend</h2>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        You can add friends with their username.
      </p>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="relative">
          <input
            placeholder="Enter a username"
            className="w-full rounded-lg border border-border bg-surface py-3 pr-40 pl-4 text-sm text-white outline-none transition-colors placeholder:text-gray-500 focus:border-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            {...register("userName")}
          />
          <button
            type="submit"
            disabled={!userNameValue || isPending}
            className="bg-brand-500 hover:bg-brand-600 disabled:bg-brand-500/30 absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </div>
        {errors.userName?.message && (
          <p className="mt-2 flex items-center gap-1 text-sm text-red-400">
            <Icon icon="mdi:alert-circle" className="text-base" />
            {errors.userName.message}
          </p>
        )}
      </form>
    </div>
  );
}

export default AddFriend;
