import bcrypt from "bcryptjs";
import type { AppLoadContext } from "@remix-run/cloudflare";
import { getDB, generateId, getCurrentTimestamp } from "./db.server.cloudflare";

/**
 * Hashes a plaintext password using bcrypt with a salt factor of 10.
 *
 * @param password - The plaintext password to hash
 * @returns The bcrypt hash of `password`
 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Determines whether a plaintext password matches a bcrypt hashed password.
 *
 * @param password - The plaintext password to verify.
 * @param hashedPassword - The bcrypt hash to verify against.
 * @returns `true` if `password` matches `hashedPassword`, `false` otherwise.
 */
export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Create a new user account by hashing the provided password and inserting the user record into the database.
 *
 * @param param0 - Object containing the registration fields.
 * @param param0.email - User's email address.
 * @param param0.username - Chosen username.
 * @param param0.password - Plaintext password to be hashed before storage.
 * @param context - AppLoadContext used to obtain a database instance.
 * @returns The newly created user's `id`, `email`, and `username`.
 */
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

/**
 * Authenticate a user by email and password and return their basic profile on success.
 *
 * @returns The user's `id`, `email`, and `username` if authentication succeeds; `null` if no user with the given email exists or the password is incorrect.
 */
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