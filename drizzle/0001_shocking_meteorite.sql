CREATE TABLE `site_sections` (
	`section_key` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`body` text NOT NULL,
	`updated_at` integer NOT NULL
);
