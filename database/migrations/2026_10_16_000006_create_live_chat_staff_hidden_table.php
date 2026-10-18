<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `live_chat_staff_hidden` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `live_chat_staff_hidden` (
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hidden_before_id` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`conversation_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('live_chat_staff_hidden');
    }
};
