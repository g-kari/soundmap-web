import bcrypt from "bcryptjs";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { getDB, generateId, getCurrentTimestamp } from "./db.server.cloudflare";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export async function register(
  {
    email,
    username,
    password,
  }: {
    email: string;
    username: string;
    password: string;
  },
  context: AppLoadContext
) {
  const hashedPassword = await hashPassword(password);
  const db = getDB(context);
  const userId = generateId();
  const timestamp = getCurrentTimestamp();

  await db
    .prepare(
      "INSERT INTO users (id, email, username, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(userId, email, username, hashedPassword, timestamp, timestamp)
    .run();

  return { id: userId, email, username };
}

export async function login(
  {
    email,
    password,
  }: {
    email: string;
    password: string;
  },
  context: AppLoadContext
) {
  const db = getDB(context);
  const user = await db
    .prepare("SELECT id, email, username, password FROM users WHERE email = ?")
    .bind(email)
    .first<{ id: string; email: string; username: string; password: string }>();

  if (!user) {
    return null;
  }

  const isCorrectPassword = await verifyPassword(password, user.password);

  if (!isCorrectPassword) {
    return null;
  }

  return { id: user.id, email: user.email, username: user.username };
}
