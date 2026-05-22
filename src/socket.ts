import { io } from "socket.io-client";

// In development we should connect to the same host but via current URL.
// Since Vite runs on port 3000 now due to our custom server setup, we can use empty string or window.location.origin
const URL = typeof window !== 'undefined' ? window.location.origin : '';
export const socket = io(URL, { autoConnect: false });
