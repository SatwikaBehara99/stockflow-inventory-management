import { SignJWT, jwtVerify } from "jose";

export const AUTH_COOKIE_NAME = "stockflow_token";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionPayload {
  userId: string;
  email: string;
  name?: string | null;
  organizationId: string;
  organizationName: string;
  role: "ADMIN" | "MEMBER";
}

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET environment variable is missing or too short (minimum 16 characters required)."
    );
  }
  return new TextEncoder().encode(secret);
}

/**
 * Signs a payload into a secure HS256 JWT string.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Cryptographically verifies an HS256 JWT string and returns its typed payload.
 * Returns null if token is expired, corrupted, or invalid.
 */
export async function verifyToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: (payload.name as string) ?? null,
      organizationId: payload.organizationId as string,
      organizationName: payload.organizationName as string,
      role: payload.role as "ADMIN" | "MEMBER",
    };
  } catch {
    return null;
  }
}

