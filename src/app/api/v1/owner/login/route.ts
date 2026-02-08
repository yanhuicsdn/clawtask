import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { verifyPassword, createSession } from "@/lib/ownerAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: owner } = await db.from("project_owners")
      .select()
      .eq("email", cleanEmail)
      .maybeSingle();

    if (!owner) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await verifyPassword(password, owner.password_hash);
    if (!valid) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(owner.id);

    return Response.json({
      owner_id: owner.id,
      email: owner.email,
      name: owner.name,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Owner login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
