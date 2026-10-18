<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReviewController extends Controller
{
    /** Ported from api/admin/reviews-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'A valid review is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM reviews WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            json_response(false, 'That review could not be found.', [], 404);
        }

        json_response(true, 'Review deleted.');
    }

    /** Ported from api/admin/reviews-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $stmt = $pdo->query(
            "SELECT r.id, r.rating, r.comment, r.location, r.status, r.review_type, r.booking_label, r.created_at,
                    u.first_name, u.last_name, u.email
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             ORDER BY r.created_at DESC"
        );
        $rows = $stmt->fetchAll();

        $reviews = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'rating' => (float) $row['rating'],
                'comment' => $row['comment'],
                'location' => $row['location'],
                'status' => $row['status'],
                'reviewType' => $row['review_type'] ?? 'general',
                'bookingLabel' => $row['booking_label'],
                'guestName' => trim($row['first_name'] . ' ' . $row['last_name']),
                'guestEmail' => $row['email'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        json_response(true, 'OK', ['reviews' => $reviews]);
    }

    /** Ported from api/admin/reviews-update.php */
    public function update(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        $status = input_str($body, 'status');

        if ($id <= 0) {
            json_response(false, 'A valid review is required.', [], 422);
        }
        if (!in_array($status, ['visible', 'hidden'], true)) {
            json_response(false, 'Status must be "visible" or "hidden".', [], 422);
        }

        $pdo = get_db_connection();

        $exists = $pdo->prepare('SELECT id FROM reviews WHERE id = ?');
        $exists->execute([$id]);
        if (!$exists->fetch()) {
            json_response(false, 'That review could not be found.', [], 404);
        }

        $stmt = $pdo->prepare('UPDATE reviews SET status = ? WHERE id = ?');
        $stmt->execute([$status, $id]);

        json_response(true, 'Review updated.');
    }
}
