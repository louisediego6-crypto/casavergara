<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `resort_settings` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `resort_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `resort_name` varchar(150) NOT NULL DEFAULT 'Casa Vergara Resort',
  `email` varchar(191) NOT NULL DEFAULT 'info@casavergara.com',
  `phone` varchar(30) NOT NULL DEFAULT '+1 (555) 123-4567',
  `address` varchar(255) NOT NULL DEFAULT '123 Paradise Boulevard, Tropical Island, TI 12345',
  `payment_qr_path` varchar(255) DEFAULT NULL,
  `payment_qr_label` varchar(150) NOT NULL DEFAULT '',
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `resort_settings_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('resort_settings');
    }
};
