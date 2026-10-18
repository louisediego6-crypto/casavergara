<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReservationController extends Controller
{
    /** Ported from api/content/my-reservations.php */
    public function mine(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        $pdo = get_db_connection();

        try {
            $stmt = $pdo->prepare(
                'SELECT payload_json FROM reservations
                 WHERE user_id = ? OR LOWER(email) = LOWER(?)
                 ORDER BY updated_at DESC'
            );
            $stmt->execute([$session['user_id'], $session['email'] ?? '']);
            $rows = $stmt->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('my-reservations.php: query failed (has database/migration_reservations.sql been run?): ' . $e->getMessage());
            json_response(true, 'OK', ['reservations' => []]);
        }

        $reservations = [];
        foreach ($rows as $row) {
            $decoded = json_decode($row['payload_json'], true);
            if (is_array($decoded)) {
                $reservations[] = $decoded;
            }
        }

        json_response(true, 'OK', ['reservations' => $reservations]);
    }

    /** Ported from api/content/occupied-dates.php */
    public function occupiedDates(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();

        try {
            $rows = $pdo->query(
                "SELECT id, booking_type, package_id, room_name, check_in, check_out, preferred_date,
                        duration_type, scheduled_check_in, scheduled_check_out
                 FROM reservations
                 WHERE reservation_status NOT LIKE '%cancel%'
                   AND reservation_status NOT LIKE '%declin%'"
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('occupied-dates.php: query failed (has database/migration_reservations.sql / migration_duration_pricing.sql been run?): ' . $e->getMessage());

            json_response(true, 'OK', ['reservations' => []]);
        }

        $out = array_map(static function ($row) {
            return [
                'id'                => $row['id'],
                'bookingType'       => $row['booking_type'],
                'packageId'         => $row['package_id'],
                'roomName'          => $row['room_name'],
                'checkIn'           => $row['check_in'],
                'checkOut'          => $row['check_out'],
                'preferredDate'     => $row['preferred_date'],
                'durationKey'       => $row['duration_type'] ?? null,
                'scheduledCheckIn'  => $row['scheduled_check_in'] ?? null,
                'scheduledCheckOut' => $row['scheduled_check_out'] ?? null,
            ];
        }, $rows);

        json_response(true, 'OK', ['reservations' => $out]);
    }

    /** Ported from api/content/reservations-sync.php */
    public function sync(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body = get_json_body();
        $reservation = $body['reservation'] ?? null;
        if (!is_array($reservation) || empty($reservation['id'])) {
            json_response(false, 'Missing reservation data.', [], 422);
        }

        $id = (string) $reservation['id'];
        if (mb_strlen($id) > 40) {
            json_response(false, 'Invalid reservation id.', [], 422);
        }

        $bookingType = ($reservation['bookingType'] ?? '') === 'event' ? 'event' : 'room';
        $checkIn = !empty($reservation['checkIn']) ? substr($reservation['checkIn'], 0, 10) : null;
        $checkOut = !empty($reservation['checkOut']) ? substr($reservation['checkOut'], 0, 10) : null;

        $checkedOutAt = null;
        if (!empty($reservation['checkedOutAt'])) {
            $ts = strtotime((string) $reservation['checkedOutAt']);
            if ($ts !== false) {
                $checkedOutAt = date('Y-m-d H:i:s', $ts);
            }
        }
        $preferredDate = !empty($reservation['preferredDate']) ? substr($reservation['preferredDate'], 0, 10) : null;
        if ($bookingType === 'event' && !$preferredDate && $checkIn) {
            $preferredDate = $checkIn;
        }

        $durationType = in_array($reservation['durationKey'] ?? null, ['3hr', '12hr', '24hr', 'extended'], true) ? $reservation['durationKey'] : null;
        $toDatetime = function ($value) {
            if (empty($value)) return null;
            $ts = strtotime((string) $value);
            return $ts !== false ? date('Y-m-d H:i:s', $ts) : null;
        };
        $scheduledCheckIn = $toDatetime($reservation['scheduledCheckIn'] ?? null);
        $scheduledCheckOut = $toDatetime($reservation['scheduledCheckOut'] ?? null);
        $overtimeHours = is_numeric($reservation['overtimeHours'] ?? null) ? (float) $reservation['overtimeHours'] : 0;
        $penaltyAmount = is_numeric($reservation['penaltyAmount'] ?? null) ? (float) $reservation['penaltyAmount'] : 0;

        $customerName = mb_substr(trim((string) ($reservation['customerName'] ?? '')), 0, 191);
        $email = mb_substr(strtolower(trim((string) ($reservation['email'] ?? ''))), 0, 191);
        $packageId = mb_substr((string) ($reservation['packageId'] ?? ($reservation['packageOption'] ?? '')), 0, 100);
        $roomName = mb_substr((string) ($reservation['roomName'] ?? ''), 0, 191);
        $reservationStatus = mb_substr((string) ($reservation['reservationStatus'] ?? ''), 0, 60);
        $paymentStatus = mb_substr((string) ($reservation['paymentStatus'] ?? ''), 0, 60);
        $totalNumeric = is_numeric($reservation['totalNumeric'] ?? null) ? (float) $reservation['totalNumeric'] : null;
        $currency = mb_substr((string) ($reservation['currency'] ?? 'PHP'), 0, 10) ?: 'PHP';
        $ownerSessionKey = mb_substr((string) ($reservation['ownerSessionKey'] ?? ''), 0, 64) ?: null;

        $isStaff = in_array((string) (session('role') ?? ''), ['admin', 'event_manager'], true);
        $userId = null;
        if (!$isStaff && !empty(session('user_id'))) {
            $userId = (int) session('user_id');
        }

        $payloadJson = json_encode($reservation, JSON_UNESCAPED_UNICODE);
        if ($payloadJson === false) {
            json_response(false, 'Could not process this reservation.', [], 422);
        }

        $pdo = get_db_connection();

        try {
            $existing = $pdo->prepare('SELECT user_id, reservation_status, payment_status, check_in, scheduled_check_out FROM reservations WHERE id = ?');
            $existing->execute([$id]);
            $existingRow = $existing->fetch();
            $previousStatus = $existingRow ? $existingRow['reservation_status'] : false;
            $previousCheckIn = $existingRow ? $existingRow['check_in'] : null;
            $previousScheduledCheckOut = $existingRow ? $existingRow['scheduled_check_out'] : null;
            $isNew = $existingRow === false;

            $checkinChanged = !$isNew && $checkIn !== $previousCheckIn;

            $checkoutChanged = !$isNew && $scheduledCheckOut !== $previousScheduledCheckOut;

            if ($userId === null && $existingRow && !empty($existingRow['user_id'])) {
                $userId = (int) $existingRow['user_id'];
            }

            $previousPaymentStatus = $existingRow ? (string) $existingRow['payment_status'] : '';

            if (!$isStaff && in_array($previousPaymentStatus, ['Approved', 'Rejected'], true)
                && $paymentStatus !== $previousPaymentStatus) {

                $resubmitting = $previousPaymentStatus === 'Rejected' && stripos($paymentStatus, 'waiting') !== false;
                if (!$resubmitting) {
                    $paymentStatus = $previousPaymentStatus;
                }
            }

            [$reservationStatus, $paymentStatus] = cvr_reconcile_statuses($reservationStatus, $paymentStatus);

            if (($reservation['paymentStatus'] ?? null) !== $paymentStatus
                || ($reservation['reservationStatus'] ?? null) !== $reservationStatus) {
                $reservation['paymentStatus'] = $paymentStatus;
                $reservation['reservationStatus'] = $reservationStatus;
                $reEncoded = json_encode($reservation, JSON_UNESCAPED_UNICODE);
                if ($reEncoded !== false) {
                    $payloadJson = $reEncoded;
                }
            }

            $stmt = $pdo->prepare(
                'INSERT INTO reservations
                    (id, user_id, owner_session_key, booking_type, package_id, room_name,
                     check_in, check_out, duration_type, scheduled_check_in, scheduled_check_out,
                     checked_out_at, overtime_hours, penalty_amount, preferred_date, customer_name, email,
                     reservation_status, payment_status, total_numeric, currency, payload_json,
                     checkin_reminder_sent_at, checkout_reminder_sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
                 ON DUPLICATE KEY UPDATE
                    user_id = VALUES(user_id),
                    owner_session_key = VALUES(owner_session_key),
                    booking_type = VALUES(booking_type),
                    package_id = VALUES(package_id),
                    room_name = VALUES(room_name),
                    check_in = VALUES(check_in),
                    check_out = VALUES(check_out),
                    duration_type = VALUES(duration_type),
                    scheduled_check_in = VALUES(scheduled_check_in),
                    scheduled_check_out = VALUES(scheduled_check_out),
                    checked_out_at = VALUES(checked_out_at),
                    overtime_hours = VALUES(overtime_hours),
                    penalty_amount = VALUES(penalty_amount),
                    preferred_date = VALUES(preferred_date),
                    customer_name = VALUES(customer_name),
                    email = VALUES(email),
                    reservation_status = VALUES(reservation_status),
                    payment_status = VALUES(payment_status),
                    total_numeric = VALUES(total_numeric),
                    currency = VALUES(currency),
                    payload_json = VALUES(payload_json),
                    checkin_reminder_sent_at = IF(?, NULL, checkin_reminder_sent_at),
                    checkout_reminder_sent_at = IF(?, NULL, checkout_reminder_sent_at)'
            );
            $stmt->execute([
                $id, $userId, $ownerSessionKey, $bookingType, $packageId ?: null, $roomName ?: null,
                $checkIn, $checkOut, $durationType, $scheduledCheckIn, $scheduledCheckOut,
                $checkedOutAt, $overtimeHours, $penaltyAmount, $preferredDate, $customerName, $email,
                $reservationStatus, $paymentStatus, $totalNumeric, $currency, $payloadJson,
                $checkinChanged ? 1 : 0,
                $checkoutChanged ? 1 : 0,
            ]);

            if ($isStaff && !$isNew) {
                $statusChanged = $reservationStatus !== (string) $previousStatus
                    || $paymentStatus !== $previousPaymentStatus;
                if ($statusChanged) {
                    cvr_notify_guest_status_change(
                        $pdo,
                        $id,
                        $userId,
                        $email,
                        $customerName,
                        $reservationStatus,
                        $paymentStatus
                    );
                }
            }

            try {
                $isCancelled = stripos($reservationStatus, 'cancel') !== false;
                $isCheckedOut = stripos($reservationStatus, 'checked out') !== false;
                $wasCheckedOut = stripos((string) $previousStatus, 'checked out') !== false;

                if ($isNew) {
                    $notifTitle = 'New booking request';
                    $notifMessage = ($customerName !== '' ? $customerName : 'A guest') . ' submitted a '
                        . ($bookingType === 'event' ? 'event' : 'room') . ' booking (' . $id . ').';
                    $notifLink = 'reservations.html?id=' . rawurlencode($id);
                } elseif ($isCancelled && stripos((string) $previousStatus, 'cancel') === false) {
                    $notifTitle = 'Booking cancelled';
                    $notifMessage = ($customerName !== '' ? $customerName : 'A guest') . ' cancelled booking ' . $id . '.';
                    $notifLink = 'reservations.html?id=' . rawurlencode($id);
                } elseif ($isCheckedOut && !$wasCheckedOut) {
                    $notifTitle = 'Guest checked out';
                    $notifMessage = ($customerName !== '' ? $customerName : 'A guest') . ' checked out early from '
                        . ($roomName !== '' ? $roomName : 'their room') . ' (' . $id . ').';
                    $notifLink = 'reservations.html?id=' . rawurlencode($id);
                } else {
                    $notifTitle = null;
                    $notifMessage = null;
                    $notifLink = null;
                }

                if ($notifTitle !== null) {
                    notify_admin_activity($notifTitle, [
                        'Reservation ID' => $id,
                        'Guest' => trim($customerName . ($email !== '' ? ' <' . $email . '>' : '')),
                        'Booking type' => $bookingType === 'event' ? 'Event' : 'Room',
                        'Package / room' => $roomName !== '' ? $roomName : $packageId,
                        'Check-in' => $checkIn,
                        'Check-out' => $checkOut,
                        'Event date' => $preferredDate,
                        'Total' => $totalNumeric !== null ? $currency . ' ' . number_format($totalNumeric, 2) : '',
                        'Reservation status' => $reservationStatus,
                        'Payment status' => $paymentStatus,
                        'Policy' => $isCancelled ? 'Downpayment is non-refundable and forfeited per resort policy.' : '',
                    ]);

                    $pdo->prepare(
                        "INSERT INTO notifications (user_id, audience, title, message, link)
                         SELECT id, 'staff', ?, ?, ? FROM users WHERE role IN ('admin', 'event_manager')"
                    )->execute([$notifTitle, $notifMessage, $notifLink]);
                }

                if ($isCheckedOut && !$wasCheckedOut && $email !== '') {
                    $guestTitle = 'You\'re checked out';
                    $guestMessage = 'Thanks for staying with us! You\'re checked out of '
                        . ($roomName !== '' ? $roomName : 'your room') . ' (' . $id . ').';
                    $guestLink = 'reservation-status.html?id=' . rawurlencode($id);

                    if ($userId !== null) {
                        $pdo->prepare(
                            "INSERT INTO notifications (user_id, audience, title, message, link)
                             VALUES (?, 'customer', ?, ?, ?)"
                        )->execute([$userId, $guestTitle, $guestMessage, $guestLink]);
                    }

                    $checkoutError = null;
                    send_app_email(
                        $email,
                        $customerName ?: $email,
                        'Checkout confirmed — ' . config('cvr.site_name'),
                        build_email_html('Checkout confirmed', '<p>' . htmlspecialchars($guestMessage) . '</p><p>We hope you enjoyed your stay — come back soon!</p>'),
                        $checkoutError
                    );
                    if ($checkoutError) {
                        error_log('reservations-sync.php: checkout confirmation email failed for ' . $id . ': ' . $checkoutError);
                    }
                }
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('reservations-sync.php: notification failed: ' . $e->getMessage());
            }

            json_response(true, 'Reservation synced.', ['id' => $id]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('reservations-sync.php: sync failed (has database/migration_reservations.sql been run?): ' . $e->getMessage());
            json_response(false, 'Could not sync this reservation to the server.', [], 500);
        }
    }
}
