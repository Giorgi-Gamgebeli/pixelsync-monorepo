const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
};

export const getMessages = async (userId: number) => {
  console.log("Fetching messages for user:", userId);
  try {
    const response = await fetch(
      `${API_URL}/api/messages/conversations/${userId}`,
    );
    return handleResponse(response);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
  }
};

export const getUsers = async () => {
  console.log("Fetching users from:", `${API_URL}/api/users`);
  try {
    const response = await fetch(`${API_URL}/api/users`);
    return handleResponse(response);
  } catch (error) {
    console.error("Failed to fetch users:", error);
  }
};
