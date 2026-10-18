<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/** HTTP version of scripts/send-checkin-reminders.php and scripts/send-checkout-reminders.php (cron-by-URL). */
class ReminderJobController extends Controller
{
    public function checkin(Request $request)
    {
        return $this->run($request, config('cvr.checkin_reminder_secret'), fn () => run_checkin_reminders(get_db_connection()));
    }

    public function checkout(Request $request)
    {
        return $this->run($request, config('cvr.checkout_reminder_secret'), fn () => run_checkout_reminders(get_db_connection()));
    }

    private function run(Request $request, string $secret, callable $job)
    {
        $key = $request->query('key', '');
        if (!is_string($key) || $key === '' || !hash_equals($secret, $key)) {
            return response()->json(['success' => false, 'message' => 'Forbidden.'], 403);
        }

        return response()->json(['success' => true, 'data' => $job()]);
    }
}
