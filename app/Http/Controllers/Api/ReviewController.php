<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReviewController extends Controller
{
    /** Ported from api/reviews/delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'A valid review is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM reviews WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $session['user_id']]);

        if ($stmt->rowCount() === 0) {
            json_response(false, 'You don\'t have a review to delete.', [], 404);
        }

        json_response(true, 'Your review has been removed.');
    }

    /** Ported from api/reviews/mine.php */
    public function mine(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT id, rating, comment, location, review_type, reservation_id, booking_label, created_at
             FROM reviews WHERE user_id = ? ORDER BY created_at DESC, id DESC'
        );
        $stmt->execute([$session['user_id']]);
        $rows = $stmt->fetchAll();

        $reviews = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'rating' => (float) $row['rating'],
                'comment' => $row['comment'],
                'location' => $row['location'],
                'reviewType' => $row['review_type'] ?? 'general',
                'reservationId' => $row['reservation_id'],
                'bookingLabel' => $row['booking_label'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        json_response(true, 'OK', ['reviews' => $reviews]);
    }

    /** Ported from api/reviews/submit.php */
    public function submit(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        if (($session['role'] ?? '') !== 'customer') {
            json_response(false, 'Only guest accounts can post a review.', [], 403);
        }

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        $rating = round(((float) ($body['rating'] ?? 0)) * 2) / 2;
        $comment = input_str($body, 'comment');
        $location = input_str($body, 'location');
        $reservationId = input_str($body, 'reservationId');

        if ($rating < 0.5 || $rating > 5) {
            json_response(false, 'Please choose a rating from 0.5 to 5 stars.', [], 422);
        }
        if ($comment === '') {
            json_response(false, 'Please write a few words about your stay.', [], 422);
        }
        if (mb_strlen($comment) > 1000) {
            json_response(false, 'Reviews must be 1000 characters or fewer.', [], 422);
        }
        if (mb_strlen($location) > 100) {
            json_response(false, 'Location must be 100 characters or fewer.', [], 422);
        }

        $pdo = get_db_connection();

        $reviewType = 'general';
        $bookingLabel = null;

        if ($reservationId !== '') {
            $res = $pdo->prepare(
                'SELECT id, user_id, email, booking_type, room_name, package_id, checked_out_at
                 FROM reservations WHERE id = ?'
            );
            $res->execute([$reservationId]);
            $reservation = $res->fetch();

            $ownsReservation = $reservation
                && (
                    ((int) ($reservation['user_id'] ?? 0) === (int) $session['user_id'])
                    || (strtolower((string) $reservation['email']) === strtolower((string) ($session['email'] ?? '')))
                );

            if (!$ownsReservation || $reservation['booking_type'] !== 'room') {
                json_response(false, 'That reservation could not be found.', [], 404);
            }
            if (empty($reservation['checked_out_at'])) {
                json_response(false, 'You can review a stay once you\'ve checked out of it.', [], 422);
            }

            $reviewType = 'booking';
            $bookingLabel = $reservation['room_name'] ?: $reservation['package_id'] ?: 'Your stay';
        }

        if ($id > 0) {

            $owns = $pdo->prepare('SELECT id FROM reviews WHERE id = ? AND user_id = ?');
            $owns->execute([$id, $session['user_id']]);
            if (!$owns->fetch()) {
                json_response(false, 'That review could not be found.', [], 404);
            }

            $stmt = $pdo->prepare(
                "UPDATE reviews
                 SET rating = ?, comment = ?, location = ?, review_type = ?, reservation_id = ?, booking_label = ?, status = 'visible'
                 WHERE id = ? AND user_id = ?"
            );
            $stmt->execute([
                $rating, $comment, $location !== '' ? $location : null,
                $reviewType, $reviewType === 'booking' ? $reservationId : null, $bookingLabel,
                $id, $session['user_id'],
            ]);
            json_response(true, 'Your review has been updated. Thank you!', ['id' => $id]);
        }

        if ($reviewType === 'booking') {
            $existing = $pdo->prepare(
                'SELECT id FROM reviews WHERE user_id = ? AND reservation_id = ?'
            );
            $existing->execute([$session['user_id'], $reservationId]);
            $existingRow = $existing->fetch();
            if ($existingRow) {
                $existingId = (int) $existingRow['id'];
                $stmt = $pdo->prepare(
                    "UPDATE reviews SET rating = ?, comment = ?, location = ?, booking_label = ?, status = 'visible' WHERE id = ?"
                );
                $stmt->execute([$rating, $comment, $location !== '' ? $location : null, $bookingLabel, $existingId]);
                json_response(true, 'Your review has been updated. Thank you!', ['id' => $existingId]);
            }
        }

        $stmt = $pdo->prepare(
            'INSERT INTO reviews (user_id, rating, comment, location, review_type, reservation_id, booking_label) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $session['user_id'], $rating, $comment, $location !== '' ? $location : null,
            $reviewType, $reviewType === 'booking' ? $reservationId : null, $bookingLabel,
        ]);
        $reviewId = (int) $pdo->lastInsertId();

        try {
            $reviewerName = trim(($session['first_name'] ?? '') . ' ' . ($session['last_name'] ?? '')) ?: 'A guest';
            $fullStars = (int) floor($rating);
            $stars = str_repeat('★', $fullStars) . ($rating - $fullStars >= 0.5 ? '⯨' : '')
                . str_repeat('☆', 5 - $fullStars - ($rating - $fullStars >= 0.5 ? 1 : 0));
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'staff', ?, ?, ? FROM users WHERE role IN ('admin', 'event_manager')"
            )->execute([
                'New review — ' . $stars,
                $reviewerName . ': ' . mb_substr($comment, 0, 140) . (mb_strlen($comment) > 140 ? '…' : ''),
                'reviews.html',
            ]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('reviews/submit.php: failed to create admin/staff notification: ' . $e->getMessage());
        }

        notify_admin_activity('New review submitted', [
            'Guest' => $reviewerName ?? '',
            'Email' => (string) ($session['email'] ?? ''),
            'Rating' => $rating . ' / 5',
            'Comment' => mb_substr((string) $comment, 0, 500),
        ]);

        json_response(true, 'Thank you for your review!', ['id' => $reviewId]);
    }
}
