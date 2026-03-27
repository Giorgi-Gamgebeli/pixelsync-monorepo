"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import { createProject } from "@/app/_dataAccessLayer/actions";

export default function CreateProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await createProject(name);

    if (result && "error" in result) {
      setError(result.error);
      setIsSubmitting(false);
    } else if (result && result.success) {
      router.push(`/project/${result.success.id}`);
    } else {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary flex flex-1 items-center justify-center p-6">
      <div className="border-border bg-secondary w-full max-w-md rounded-2xl border p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="bg-brand-500/10 text-brand-400 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
            <Icon icon="mdi:folder-plus" className="text-3xl" />
          </div>
          <h1 className="text-2xl font-semibold text-white">
            Create New Project
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            A project contains your Web Design boards, chats, and members.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Project Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Awesome Website"
              className="border-border bg-surface focus:border-brand-500 focus:ring-brand-500 w-full rounded-xl border px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:ring-1 focus:outline-none"
              required
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-border hover:bg-surface flex-1 rounded-xl border bg-transparent px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="bg-brand-500 hover:bg-brand-600 disabled:hover:bg-brand-500 flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin text-lg" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
