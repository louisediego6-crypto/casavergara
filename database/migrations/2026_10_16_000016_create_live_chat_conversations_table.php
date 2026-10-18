<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `live_chat_conversations` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `live_chat_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `reservation_id` varchar(40) DEFAULT NULL,
  `topic` varchar(80) DEFAULT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `last_message_preview` varchar(255) DEFAULT NULL,
  `last_sender_role` enum('customer','staff') DEFAULT NULL,
  `customer_unread` int(11) NOT NULL DEFAULT 0,
  `staff_unread` int(11) NOT NULL DEFAULT 0,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_chat_customer` (`customer_id`),
  KEY `idx_chat_last` (`last_message_at`),
  CONSTRAINT `live_chat_conversations_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('live_chat_conversations');
    }
};
