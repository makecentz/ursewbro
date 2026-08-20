import { env } from "cloudflare:workers";
import { getDb } from "../../../db";
import { quoteRequests } from "../../../db/schema";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const id = crypto.randomUUID();
    const fileKeys: string[] = [];
    const files = form.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    for (const file of files.slice(0, 6)) {
      if (file.size > 10_000_000) return Response.json({ error: "Each file must be under 10 MB." }, { status: 400 });
      const key = `quotes/${id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { quoteId: id } });
      fileKeys.push(key);
    }
    const now = new Date();
    await getDb().insert(quoteRequests).values({
      id, firstName: String(form.get("firstName") || ""), lastName: String(form.get("lastName") || ""),
      email: String(form.get("email") || ""), phone: String(form.get("phone") || ""), garment: String(form.get("garment") || "Other"),
      budget: String(form.get("budget") || "Not sure"), details: String(form.get("details") || ""), status: "NEW", fileKeys: JSON.stringify(fileKeys), createdAt: now, updatedAt: now,
    });
    return Response.json({ ok: true, id });
  } catch (error) {
    console.error("quote submission failed", error);
    return Response.json({ error: "Unable to save quote request." }, { status: 500 });
  }
}
