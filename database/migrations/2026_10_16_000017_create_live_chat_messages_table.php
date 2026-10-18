<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `live_chat_messages` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `live_chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `sender_role` enum('customer','staff') NOT NULL,
  `sender_label` varchar(191) NOT NULL DEFAULT '',
  `body` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(10) unsigned DEFAULT NULL,
  `topic` varchar(80) DEFAULT NULL,
  `reservation_id` varchar(40) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  `msg_type` varchar(12) NOT NULL DEFAULT 'text',
  `attachment_path` varchar(255) DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_mime` varchar(120) DEFAULT NULL,
  `attachment_size` int(10) unsigned DEFAULT NULL,
  `read_at` datetime DEFAULT NULL,
  `deleted_for_customer` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_for_staff` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_for_all` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_chat_msg_conv` (`conversation_id`,`id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `live_chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `live_chat_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `live_chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('live_chat_messages');
    }
};
