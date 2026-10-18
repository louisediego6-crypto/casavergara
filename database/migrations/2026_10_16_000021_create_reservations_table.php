<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * `reservations` - final structure of the table in the original Casa Vergara database
 * (schema.sql plus every migration_*.sql, already folded together).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement(<<<'SQL'
CREATE TABLE IF NOT EXISTS `reservations` (
  `id` varchar(40) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `owner_session_key` varchar(64) DEFAULT NULL,
  `booking_type` enum('room','event') NOT NULL,
  `package_id` varchar(100) DEFAULT NULL,
  `room_name` varchar(191) DEFAULT NULL,
  `check_in` date DEFAULT NULL,
  `check_out` date DEFAULT NULL,
  `duration_type` varchar(10) DEFAULT NULL,
  `scheduled_check_in` datetime DEFAULT NULL,
  `scheduled_check_out` datetime DEFAULT NULL,
  `checked_out_at` datetime DEFAULT NULL,
  `overtime_hours` decimal(6,2) NOT NULL DEFAULT 0.00,
  `penalty_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `checkin_reminder_sent_at` datetime DEFAULT NULL,
  `checkout_reminder_sent_at` datetime DEFAULT NULL,
  `preferred_date` date DEFAULT NULL,
  `customer_name` varchar(191) NOT NULL DEFAULT '',
  `email` varchar(191) NOT NULL DEFAULT '',
  `reservation_status` varchar(60) NOT NULL DEFAULT '',
  `payment_status` varchar(60) NOT NULL DEFAULT '',
  `total_numeric` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'PHP',
  `payload_json` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_res_dates` (`booking_type`,`check_in`,`check_out`),
  KEY `idx_res_preferred_date` (`booking_type`,`preferred_date`),
  KEY `idx_res_user` (`user_id`),
  KEY `idx_res_email` (`email`),
  KEY `idx_res_checkin_reminder` (`booking_type`,`check_in`,`checkin_reminder_sent_at`),
  KEY `idx_res_scheduled_window` (`package_id`,`scheduled_check_in`,`scheduled_check_out`),
  KEY `idx_res_checkout_reminder` (`booking_type`,`scheduled_check_out`,`checkout_reminder_sent_at`),
  CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
