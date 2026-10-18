<?php


function run_checkin_reminders(PDO $pdo): array
{
    $result = ['checked' => 0, 'sent' => 0, 'failed' => 0, 'errors' => []];

    $daysBefore = (int) config('cvr.checkin_reminder_days_before');

    try {
        $stmt = $pdo->prepare(
            "SELECT id, user_id, booking_type, room_name, check_in, check_out,
                    customer_name, email, reservation_status, payload_json
             FROM reservations
             WHERE booking_type = 'room'
               AND check_in = DATE_ADD(CURDATE(), INTERVAL ? DAY)
               AND checkin_reminder_sent_at IS NULL
               AND reservation_status NOT LIKE '%cancel%'
               AND reservation_status NOT LIKE '%declin%'
               AND email <> ''"
        );
        $stmt->execute([$daysBefore]);
        $rows = $stmt->fetchAll();
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('checkin_reminders: query failed (has database/migration_checkin_checkout.sql been run?): ' . $e->getMessage());
        $result['errors'][] = 'Could not read reservations: ' . $e->getMessage();
        return $result;
    }

    $result['checked'] = count($rows);
    $markSent = $pdo->prepare('UPDATE reservations SET checkin_reminder_sent_at = NOW() WHERE id = ?');

    foreach ($rows as $row) {
        $payload = json_decode((string) $row['payload_json'], true);
        $roomLabel = $row['room_name'] ?: ($payload['roomName'] ?? 'your room');
        $guestName = $row['customer_name'] ?: ($payload['customerName'] ?? 'Guest');
        $firstName = trim(explode(' ', trim($guestName))[0] ?? '') ?: 'Guest';
        $checkInLabel = $row['check_in'] ? date('F j, Y', strtotime($row['check_in'])) : 'soon';
        $checkOutLabel = $row['check_out'] ? date('F j, Y', strtotime($row['check_out'])) : '';

        $title = 'Check-in reminder';
        $message = "Your check-in for {$roomLabel} ({$row['id']}) is coming up on {$checkInLabel}.";
        $link = 'reservation-status.html?id=' . rawurlencode($row['id']);

        if (!empty($row['user_id'])) {
            try {
                $pdo->prepare(
                    "INSERT INTO notifications (user_id, audience, title, message, link)
                     VALUES (?, 'customer', ?, ?, ?)"
                )->execute([(int) $row['user_id'], $title, $message, $link]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('checkin_reminders: notification insert failed for ' . $row['id'] . ': ' . $e->getMessage());
            }
        }

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($firstName) . ',</p>
            <p>Just a friendly reminder that your check-in at <strong>' . htmlspecialchars(config('cvr.site_name')) . '</strong> is coming up.</p>
            <table style="width:100%; border-collapse:collapse; margin:16px 0;">
                <tr><td style="padding:6px 0; color:#667;">Reservation</td><td style="padding:6px 0; text-align:right;"><strong>' . htmlspecialchars((string) $row['id']) . '</strong></td></tr>
                <tr><td style="padding:6px 0; color:#667;">Room</td><td style="padding:6px 0; text-align:right;">' . htmlspecialchars($roomLabel) . '</td></tr>
                <tr><td style="padding:6px 0; color:#667;">Check-in</td><td style="padding:6px 0; text-align:right;"><strong>' . htmlspecialchars($checkInLabel) . '</strong></td></tr>
                ' . ($checkOutLabel ? '<tr><td style="padding:6px 0; color:#667;">Check-out</td><td style="padding:6px 0; text-align:right;">' . htmlspecialchars($checkOutLabel) . '</td></tr>' : '') . '
            </table>
            <p>Good to know: you don\'t have to wait until your booked check-out date — you\'re welcome to check out any day during your stay, right from your reservation status page.</p>
            <p style="margin-top:20px;"><a href="' . htmlspecialchars(rtrim(config('cvr.site_url'), '/') . '/pages/' . $link) . '" style="background:#0c3b5d; color:#fff; padding:10px 18px; border-radius:6px; text-decoration:none;">View your reservation</a></p>
            <p>We can\'t wait to host you!</p>';

        $error = null;
        $sent = send_app_email(
            $row['email'],
            $guestName ?: $row['email'],
            'Your check-in is coming up — ' . config('cvr.site_name'),
            build_email_html('Check-in reminder', $bodyHtml),
            $error
        );

        if ($sent) {
            $result['sent']++;
            try {
                $markSent->execute([$row['id']]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('checkin_reminders: could not mark ' . $row['id'] . ' as reminded: ' . $e->getMessage());
            }
        } else {

            $result['failed']++;
            $result['errors'][] = $row['id'] . ': ' . ($error ?: 'unknown mail error');
        }
    }

    return $result;
}
