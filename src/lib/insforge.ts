import { createClient } from "@insforge/sdk";

export const insforge = createClient({
  baseUrl: "https://s9trwscg.ap-southeast.insforge.app",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MjYwOTd9.zkyUCsCMhdGrPO2hkr9Ju7JWRdTezNO3GDOjNyiT4M4",
});

export const db = insforge.database;
