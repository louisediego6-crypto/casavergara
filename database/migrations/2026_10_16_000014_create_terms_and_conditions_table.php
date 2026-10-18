<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `terms_and_conditions` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `terms_and_conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `booking_type` enum('room','event','general','privacy') NOT NULL DEFAULT 'general',
  `version` varchar(20) NOT NULL DEFAULT '1.0',
  `content` longtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('terms_and_conditions');
    }
};
