import ClientIcon from "@/app/_components/ClientIcon";

function Page() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="bg-surface mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
        <ClientIcon
          icon="mdi:chat-outline"
          className="text-3xl text-gray-500"
        />
      </div>
      <p className="text-sm font-medium text-white">Welcome to PixelSync</p>
      <p className="mt-1 text-xs text-gray-500">
        Select a conversation to start chatting
      </p>
    </div>
  );
}

export default Page;
