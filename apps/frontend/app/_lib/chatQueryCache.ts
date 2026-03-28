import { QueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";

function setChatMessage<TPage extends { messages: Array<{ id: string }> }>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  message: TPage["messages"][number],
) {
  queryClient.setQueryData<TPage>(queryKey, (prev) => {
    if (!prev) return prev;

    const messages = [...prev.messages];
    const byIdIndex = messages.findIndex((m) => m.id === message.id);
    if (byIdIndex !== -1) {
      messages[byIdIndex] = message;
      return { ...prev, messages };
    }

    messages.push(message);
    return { ...prev, messages };
  });
}

export { setChatMessage };
