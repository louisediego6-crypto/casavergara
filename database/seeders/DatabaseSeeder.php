<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Loads the starter content of the original database: the admin and event-manager logins,
 * resort settings, FAQs, terms/privacy text, room & event packages, site content,
 * team profiles and the AI assistant defaults. Safe to run more than once (INSERT IGNORE).
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $file = fopen(__DIR__ . '/seed_data.sql', 'r');

        while (($line = fgets($file)) !== false) {
            $line = trim($line);
            if ($line !== '') {
                DB::unprepared($line);
            }
        }

        fclose($file);
    }
}
