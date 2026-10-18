<?php


function run_checkout_reminders(PDO $pdo): array
{
    $result = ['checked' => 0, 'sent' => 0, 'failed' => 0, 'errors' => []];

    $hoursBefore = (int) config('cvr.checkout_reminder_hours_before');

    try {
        $stmt = $pdo->prepare(
            "SELECT id, user_id, booking_type, room_name, check_in, check_out,
                    scheduled_check_out, customer_name, email, reservation_status,
                    payload_json
             FROM reservations
             WHERE booking_type = 'room'
               AND scheduled_check_out IS NOT NULL
               AND scheduled_check_out <= DATE_ADD(NOW(), INTERVAL ? HOUR)
               AND scheduled_check_out >= NOW()
               AND checked_out_at IS NULL
               AND checkout_reminder_sent_at IS NULL
               AND reservation_status NOT LIKE '%cancel%'
               AND reservation_status NOT LIKE '%declin%'"
        );
        $stmt->execute([$hoursBefore]);
        $rows = $stmt->fetchAll();
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('checkout_reminders: query failed (has database/migration_checkout_reminders.sql been run?): ' . $e->getMessage());
        $result['errors'][] = 'Could not read reservations: ' . $e->getMessage();
        return $result;
    }

    $result['checked'] = count($rows);
    $markSent = $pdo->prepare('UPDATE reservations SET checkout_reminder_sent_at = NOW() WHERE id = ?');

    foreach ($rows as $row) {
        $payload = json_decode((string) $row['payload_json'], true);
        $roomLabel = $row['room_name'] ?: ($payload['roomName'] ?? 'your room');
        $guestName = $row['customer_name'] ?: ($payload['customerName'] ?? 'Guest');
        $firstName = trim(explode(' ', trim($guestName))[0] ?? '') ?: 'Guest';
        $checkOutLabel = $payload['checkOutLabel'] ?? null;
        $checkOutTime = $row['scheduled_check_out'] ? date('g:i A', strtotime($row['scheduled_check_out'])) : 'shortly';
        $checkOutWhen = $checkOutLabel ?: $checkOutTime;

        $guestTitle = 'Check-out reminder';
        $guestMessage = "Your fixed check-out time for {$roomLabel} ({$row['id']}) is coming up at {$checkOutWhen}.";
        $guestLink = 'reservation-status.html?id=' . rawurlencode($row['id']);

        if (!empty($row['user_id'])) {
            try {
                $pdo->prepare(
                    "INSERT INTO notifications (user_id, audience, title, message, link)
                     VALUES (?, 'customer', ?, ?, ?)"
                )->execute([(int) $row['user_id'], $guestTitle, $guestMessage, $guestLink]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('checkout_reminders: guest notification insert failed for ' . $row['id'] . ': ' . $e->getMessage());
            }
        }

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($firstName) . ',</p>
            <p>Just a friendly heads-up — your fixed check-out time at <strong>' . htmlspecialchars(config('cvr.site_name')) . '</strong> is almost here.</p>
            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                <tr><td style="padding:6px 0; color:#667;">Reservation</td><td style="padding:6px 0; text-align:right;"><strong>' . htmlspecialchars((string) $row['id']) . '</strong></td></tr>
                <tr><td style="padding:6px 0; color:#667;">Room</td><td style="padding:6px 0; text-align:right;">' . htmlspecialchars($roomLabel) . '</td></tr>
                <tr><td style="padding:6px 0; color:#667;">Check-out time</td><td style="padding:6px 0; text-align:right;"><strong>' . htmlspecialchars($checkOutWhen) . '</strong></td></tr>
            </table>
            <p>Please prepare to check out on time — staying past your fixed check-out time is billed as overtime per hour.</p>
            <p style="margin-top:20px;"><a href="' . htmlspecialchars(rtrim(config('cvr.site_url'), '/') . '/pages/' . $guestLink) . '" style="background:#0c3b5d; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none;">Check out now</a></p>
            <p>Thank you for staying with us!</p>';

        $error = null;
        $sent = send_app_email(
            $row['email'],
            $guestName ?: $row['email'],
            'Your check-out time is coming up — ' . config('cvr.site_name'),
            build_email_html('Check-out reminder', $bodyHtml),
            $error
        );

        try {
            $staffTitle = 'Guest check-out coming up';
            $staffMessage = ($guestName !== 'Guest' ? $guestName : 'A guest') . ' is due to check out of '
                . $roomLabel . ' at ' . $checkOutWhen . ' (' . $row['id'] . ').';
            $staffLink = 'reservations.html?id=' . rawurlencode($row['id']);
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'staff', ?, ?, ? FROM users WHERE role IN ('admin', 'event_manager')"
            )->execute([$staffTitle, $staffMessage, $staffLink]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('checkout_reminders: staff notification insert failed for ' . $row['id'] . ': ' . $e->getMessage());
        }

        if ($sent) {
            $result['sent']++;
            try {
                $markSent->execute([$row['id']]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('checkout_reminders: could not mark ' . $row['id'] . ' as reminded: ' . $e->getMessage());
            }
        } else {

            $result['failed']++;
            $result['errors'][] = $row['id'] . ': ' . ($error ?: 'unknown mail error');
        }
    }

    return $result;
}
