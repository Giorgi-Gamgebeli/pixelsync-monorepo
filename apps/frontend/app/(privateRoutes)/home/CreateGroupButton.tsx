"use client";

import { useState } from "react";
import ClientIcon from "@/app/_components/ClientIcon";
import CreateGroupModal from "@/app/_components/CreateGroupModal";

function CreateGroupButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-5 w-5 items-center justify-center rounded text-gray-500 transition-colors hover:text-gray-300"
        title="New Group"
      >
        <ClientIcon icon="mdi:plus" className="text-sm" />
      </button>
      <CreateGroupModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default CreateGroupButton;
