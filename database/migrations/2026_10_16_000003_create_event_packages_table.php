<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `event_packages` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 * max_pax / extra_pax_rate / is_flat_rate / double_rate_on_24hr are read by api/content/packages and
 * api/admin/packages-list but were missing from the original combined SQL import, so they are added here.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `event_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `name` varchar(150) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `included_pax` int(11) NOT NULL DEFAULT 0,
  `max_pax` int(11) DEFAULT NULL,
  `extra_pax_rate` decimal(10,2) DEFAULT NULL,
  `is_flat_rate` tinyint(1) NOT NULL DEFAULT 0,
  `double_rate_on_24hr` tinyint(1) NOT NULL DEFAULT 0,
  `is_custom` tinyint(1) NOT NULL DEFAULT 0,
  `image_path` varchar(255) DEFAULT NULL,
  `inclusions_json` text DEFAULT NULL,
  `motifs_json` text DEFAULT NULL,
  `addons_json` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('event_packages');
    }
};
