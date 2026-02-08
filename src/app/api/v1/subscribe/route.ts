import { NextRequest } from "next/server";
import { db } from "@/lib/insforge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data: existing } = await db.from("email_subscribers")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      return Response.json({ message: "You're already subscribed!" });
    }

    await db.from("email_subscribers").insert([{ email: cleanEmail }]);

    return Response.json({ message: "Thanks for subscribing! We'll keep you posted." }, { status: 201 });
  } catch (error) {
    console.error("Subscribe error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
