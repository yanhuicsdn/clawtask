import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";
import { hashPassword, createSession } from "@/lib/ownerAuth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, company } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: existing } = await db.from("project_owners")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const { data: owner } = await db.from("project_owners").insert([{
      email: cleanEmail,
      password_hash: passwordHash,
      name: (name || "").trim(),
      company: (company || "").trim(),
    }]).select("id, email, name, company");

    const ownerData = owner?.[0];
    if (!ownerData) {
      return Response.json({ error: "Failed to create account" }, { status: 500 });
    }

    await createSession(ownerData.id);

    return Response.json({
      owner_id: ownerData.id,
      email: ownerData.email,
      name: ownerData.name,
      message: "Account created successfully!",
    }, { status: 201 });
  } catch (error) {
    console.error("Owner register error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
