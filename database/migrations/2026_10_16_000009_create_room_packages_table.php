<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `room_packages` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `room_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(80) NOT NULL,
  `title` varchar(150) NOT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price_per_night` decimal(10,2) NOT NULL DEFAULT 0.00,
  `capacity_min` int(11) NOT NULL DEFAULT 1,
  `capacity_max` int(11) NOT NULL DEFAULT 1,
  `area_sqm` int(11) DEFAULT NULL,
  `bed_setup` varchar(150) DEFAULT NULL,
  `inclusions_json` text DEFAULT NULL,
  `addons_json` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `standard_check_in` varchar(20) NOT NULL DEFAULT '15:00',
  `standard_check_out` varchar(50) NOT NULL DEFAULT 'Anytime (flexible)',
  `availability_note` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('room_packages');
    }
};
