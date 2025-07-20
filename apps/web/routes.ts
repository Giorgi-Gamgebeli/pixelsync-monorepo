// Array of routes which are accesable to public

export const publicRoutes = ["/", "/service", "/privacy"];

// Array of routes which are nesseary for authentication

export const authRoutes = [
  "/auth/signin",
  "/auth/signup",
  "/auth/reset-password",
  "/auth/new-verification",
  "/auth/new-password",
];

// Auth prefix

export const apiAuthPrefix = "/api/auth";

// Route thats user being redirected to

export const DEFAULT_LOGIN_REDIRECT = "/home/friends";
