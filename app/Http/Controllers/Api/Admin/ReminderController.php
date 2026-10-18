<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReminderController extends Controller
{
    /** Ported from api/admin/send-checkin-reminders.php */
    public function sendCheckin(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $summary = run_checkin_reminders($pdo);

        $message = $summary['checked'] === 0
            ? 'No upcoming check-ins needed a reminder right now.'
            : sprintf('Checked %d reservation(s): %d reminder(s) sent, %d failed.', $summary['checked'], $summary['sent'], $summary['failed']);

        json_response(true, $message, ['summary' => $summary]);
    }

    /** Ported from api/admin/send-checkout-reminders.php */
    public function sendCheckout(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $summary = run_checkout_reminders($pdo);

        $message = $summary['checked'] === 0
            ? 'No upcoming check-outs needed a reminder right now.'
            : sprintf('Checked %d reservation(s): %d reminder(s) sent, %d failed.', $summary['checked'], $summary['sent'], $summary['failed']);

        json_response(true, $message, ['summary' => $summary]);
    }
}
