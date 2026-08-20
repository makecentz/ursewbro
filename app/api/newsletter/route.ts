import { getDb } from "../../../db";
import { newsletterSubscribers } from "../../../db/schema";

export async function POST(request: Request) {
  const data = await request.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  if (!email.includes("@")) return Response.json({ error: "Valid email required." }, { status: 400 });
  try {
    await getDb().insert(newsletterSubscribers).values({ id: crypto.randomUUID(), email, active: true, createdAt: new Date() }).onConflictDoNothing();
    return Response.redirect(new URL("/?subscribed=1#top", request.url), 303);
  } catch (error) {
    console.error("newsletter signup failed", error);
    return Response.json({ error: "Unable to subscribe." }, { status: 500 });
  }
}
