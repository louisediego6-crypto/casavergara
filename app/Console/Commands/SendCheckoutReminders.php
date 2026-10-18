<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendCheckoutReminders extends Command
{
    protected $signature = 'reminders:checkout';
    protected $description = 'Email and notify guests whose check-out is coming up';

    public function handle(): int
    {
        $summary = run_checkout_reminders(get_db_connection());

        $this->line(sprintf(
            "[%s] Check-out reminders: checked=%d sent=%d failed=%d",
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
