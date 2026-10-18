<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `ai_assistant_settings` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `ai_assistant_settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `display_name` varchar(50) NOT NULL DEFAULT 'C.A.S.A.',
  `tagline` varchar(150) NOT NULL DEFAULT 'Client Assistance & Service Associate',
  `greeting` varchar(500) NOT NULL DEFAULT 'Hi! I''m C.A.S.A. — your Client Assistance & Service Associate. Ask me anything about rooms, rates, bookings or payments.',
  `persona_instructions` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `ai_assistant_settings_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_assistant_settings');
    }
};
