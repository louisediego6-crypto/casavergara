<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendCheckinReminders extends Command
{
    protected $signature = 'reminders:checkin';
    protected $description = 'Email and notify guests whose check-in is coming up';

    public function handle(): int
    {
        $summary = run_checkin_reminders(get_db_connection());

        $this->line(sprintf(
            "[%s] Check-in reminders: checked=%d sent=%d failed=%d",
            date('Y-m-d H:i:s'),
            $summary['checked'],
            $summary['sent'],
            $summary['failed']
        ));
        foreach ($summary['errors'] as $err) {
            $this->line('  - ' . $err);
        }

        return $summary['failed'] > 0 ? self::FAILURE : self::SUCCESS;
    }
}
