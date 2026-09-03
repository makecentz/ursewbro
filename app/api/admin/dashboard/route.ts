import { getAdminForRequest } from "../../../../lib/admin-auth";
import { getPrintifyOrders, getStoreProducts, isPrintifyConfigured } from "../../../../lib/printify";
import { getSiteContent } from "../../../../lib/site-content";

export async function GET(request: Request) {
  if (!await getAdminForRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [orders, products, content] = await Promise.all([getPrintifyOrders(), getStoreProducts(), getSiteContent()]);
  return Response.json({ orders, productCount: products.length, printifyConnected: isPrintifyConfigured(), content });
}
