ALTER TABLE `orders` ADD `customer_name` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `items_json` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `shipping_address_json` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `stripe_payment_intent_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `printify_order_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_url` text;