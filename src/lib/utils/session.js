import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
);

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(adminUser) {
  const token = await new SignJWT({
    id: adminUser.id,
    username: adminUser.username,
    role: adminUser.role_name,
    email: adminUser.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });

  return token;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin-session")?.value;

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (error) {
    console.error("Session verification failed:", error);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("admin-session");
}

export async function validateSession() {
  const session = await getSession();

  if (!session) {
    return { isValid: false, user: null };
  }

  return { isValid: true, user: session };
}
