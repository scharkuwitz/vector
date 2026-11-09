CREATE TABLE `activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`weight` integer NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "activities_title_not_blank" CHECK(length(trim("activities"."title")) > 0),
	CONSTRAINT "activities_priority" CHECK("activities"."priority" in ('low', 'medium', 'high')),
	CONSTRAINT "activities_status" CHECK("activities"."status" in ('todo', 'in_progress', 'done')),
	CONSTRAINT "activities_weight" CHECK("activities"."weight" between 1 and 100),
	CONSTRAINT "activities_start_date" CHECK("activities"."start_date" glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "activities_end_date" CHECK("activities"."end_date" glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
	CONSTRAINT "activities_dates" CHECK("activities"."end_date" >= "activities"."start_date")
);
--> statement-breakpoint
CREATE INDEX `activities_plan_id_idx` ON `activities` (`plan_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "plans_title_not_blank" CHECK(length(trim("plans"."title")) > 0)
);
