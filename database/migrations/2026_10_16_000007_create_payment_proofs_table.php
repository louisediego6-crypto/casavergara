<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `payment_proofs` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `payment_proofs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reservation_ref` varchar(100) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL DEFAULT '',
  `email` varchar(190) NOT NULL DEFAULT '',
  `phone` varchar(40) DEFAULT NULL,
  `package_name` varchar(190) DEFAULT NULL,
  `amount` varchar(50) DEFAULT NULL,
  `payment_method` varchar(60) NOT NULL DEFAULT 'QR / GCash',
  `file_path` varchar(255) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(60) NOT NULL,
  `file_size` int(11) NOT NULL DEFAULT 0,
  `status` enum('Waiting for Verification','Approved','Rejected') NOT NULL DEFAULT 'Waiting for Verification',
  `admin_note` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `emailed_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `reservation_ref` (`reservation_ref`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_proofs');
    }
};
