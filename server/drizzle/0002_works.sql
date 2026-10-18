CREATE TABLE `works` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`status` text NOT NULL,
	`progress` text,
	`rating` integer,
	`started_at` integer,
	`finished_at` integer,
	`last_session_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
