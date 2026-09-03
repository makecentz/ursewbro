import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(), name: text("name").notNull(), category: text("category").notNull(),
  description: text("description").notNull(), priceCents: integer("price_cents").notNull(),
  inventory: integer("inventory").notNull().default(0), oneOfOne: integer("one_of_one", { mode: "boolean" }).notNull().default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const quoteRequests = sqliteTable("quote_requests", {
  id: text("id").primaryKey(), firstName: text("first_name").notNull(), lastName: text("last_name").notNull(),
  email: text("email").notNull(), phone: text("phone"), garment: text("garment").notNull(), budget: text("budget").notNull(),
  details: text("details").notNull(), status: text("status").notNull().default("NEW"), fileKeys: text("file_keys"), createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: text("id").primaryKey(), email: text("email").notNull().unique(), active: integer("active", { mode: "boolean" }).notNull().default(true), createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(), customerEmail: text("customer_email"), status: text("status").notNull().default("AWAITING_PAYMENT"),
  customerName: text("customer_name"), type: text("type").notNull(), totalCents: integer("total_cents").notNull(),
  itemsJson: text("items_json"), shippingAddressJson: text("shipping_address_json"), stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"), printifyOrderId: text("printify_order_id"), trackingUrl: text("tracking_url"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(), updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const siteSections = sqliteTable("site_sections", {
  sectionKey: text("section_key").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  body: text("body").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
