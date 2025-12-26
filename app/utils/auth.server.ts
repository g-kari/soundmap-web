import bcrypt from "bcryptjs";
import { prisma } from "./db.server";

/**
 * Hashes a plaintext password using bcrypt with 10 salt rounds.
 *
 * @param password - The plaintext password to hash
 * @returns The bcrypt hash of `password`
 */
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

/**
 * Check whether a plaintext password matches a bcrypt hash.
 *
 * @param password - The plaintext password to verify.
 * @param hashedPassword - The bcrypt hashed password to compare against.
 * @returns `true` if `password` matches `hashedPassword`, `false` otherwise.
 */
export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Creates a new user record and stores a bcrypt-hashed password.
 *
 * @param email - The user's email address
 * @param username - The user's chosen username
 * @param password - The user's plaintext password to be hashed before storage
 * @returns The created user's `id`, `email`, and `username`
 */
export async function register({
  email,
  username,
  password,
}: {
  email: string;
  username: string;
  password: string;
}) {
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  return { id: user.id, email: user.email, username: user.username };
}

/**
 * Authenticate a user by email and password and return their public profile on success.
 *
 * @param email - The user's email address
 * @param password - The plaintext password to verify
 * @returns The user's `id`, `email`, and `username` if authentication succeeds, `null` otherwise
 */
export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const isCorrectPassword = await verifyPassword(password, user.password);

  if (!isCorrectPassword) {
    return null;
  }

  return { id: user.id, email: user.email, username: user.username };
}