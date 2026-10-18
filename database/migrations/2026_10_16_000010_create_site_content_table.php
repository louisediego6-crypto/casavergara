<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `site_content` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `site_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content_key` varchar(100) NOT NULL,
  `content_type` enum('text','textarea','image') NOT NULL DEFAULT 'text',
  `section` varchar(100) NOT NULL DEFAULT 'General',
  `label` varchar(150) NOT NULL,
  `text_value` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_key` (`content_key`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('site_content');
    }
};
