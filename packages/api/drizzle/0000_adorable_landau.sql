CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `edges` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`type` text NOT NULL,
	`weight` real DEFAULT 0.5 NOT NULL,
	`source` text DEFAULT 'ai' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`from_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_edges_unique` ON `edges` (`from_id`,`to_id`,`type`);--> statement-breakpoint
CREATE INDEX `idx_edges_user` ON `edges` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_edges_from` ON `edges` (`from_id`);--> statement-breakpoint
CREATE INDEX `idx_edges_to` ON `edges` (`to_id`);--> statement-breakpoint
CREATE TABLE `nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`surface` text NOT NULL,
	`reading` text DEFAULT '' NOT NULL,
	`meanings` text DEFAULT '[]' NOT NULL,
	`example_sentence` text,
	`audio_word` text,
	`audio_sentence` text,
	`notes` text,
	`source` text DEFAULT 'user_added' NOT NULL,
	`added_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_nodes_user_surface` ON `nodes` (`user_id`,`surface`);--> statement-breakpoint
CREATE INDEX `idx_nodes_user_source` ON `nodes` (`user_id`,`source`);--> statement-breakpoint
CREATE INDEX `idx_nodes_user_type` ON `nodes` (`user_id`,`type`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`stability_before` real NOT NULL,
	`stability_after` real NOT NULL,
	`interval_days` integer NOT NULL,
	`reviewed_at` integer NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_reviews_user_date` ON `reviews` (`user_id`,`reviewed_at`);--> statement-breakpoint
CREATE INDEX `idx_reviews_node` ON `reviews` (`node_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `srs_state` (
	`id` text PRIMARY KEY NOT NULL,
	`node_id` text NOT NULL,
	`stability` real DEFAULT 0 NOT NULL,
	`difficulty` real DEFAULT 0 NOT NULL,
	`reps` integer DEFAULT 0 NOT NULL,
	`lapses` integer DEFAULT 0 NOT NULL,
	`state` integer DEFAULT 0 NOT NULL,
	`due_at` integer NOT NULL,
	`last_review` integer,
	FOREIGN KEY (`node_id`) REFERENCES `nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `srs_state_node_id_unique` ON `srs_state` (`node_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`plan` text DEFAULT 'free' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
