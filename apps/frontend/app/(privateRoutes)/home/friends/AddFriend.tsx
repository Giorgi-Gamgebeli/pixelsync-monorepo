"use client";

import { AddFriendSchema } from "@repo/zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useSocketContext } from "@/app/_context/SocketContext";

function AddFriend() {
  const { sendFriendRequest } = useSocketContext();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    watch,
    reset,
    clearErrors,
    setError,
  } = useForm<z.infer<typeof AddFriendSchema>>({
    resolver: zodResolver(AddFriendSchema),
    defaultValues: {
      userName: "",
    },
  });

  const userNameValue = watch("userName");

  async function onSubmit(values: z.infer<typeof AddFriendSchema>) {
    setSuccessMessage(null);

    const result = await sendFriendRequest(values.userName);
    if (!result.success) {
      setError("userName", { message: result.error });
      return;
    }

    clearErrors("userName");
    reset({ userName: "" });
    setSuccessMessage("Friend request sent.");
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
            className="border-border bg-surface focus:border-brand-500 w-full rounded-lg border py-3 pr-40 pl-4 text-sm text-white transition-colors outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting}
            {...register("userName", {
              onChange: () => setSuccessMessage(null),
            })}
          />
          <button
            type="submit"
            disabled={!userNameValue || isSubmitting}
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
        {successMessage && (
          <p className="mt-2 flex items-center gap-1 text-sm text-green-400">
            <Icon icon="mdi:check-circle" className="text-base" />
            {successMessage}
          </p>
        )}
      </form>
    </div>
  );
}

export default AddFriend;
