<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReviewController extends Controller
{
    /** Ported from api/content/reviews.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->query(
            "SELECT r.id, r.rating, r.comment, r.location, r.review_type, r.booking_label, r.created_at,
                    u.first_name, u.last_name, u.avatar_path,
                    res.package_id
             FROM reviews r
             JOIN users u ON u.id = r.user_id
             LEFT JOIN reservations res ON res.id = r.reservation_id
             WHERE r.status = 'visible'
             ORDER BY r.created_at DESC"
        );
        $rows = $stmt->fetchAll();

        $reviews = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'rating' => (float) $row['rating'],
                'comment' => $row['comment'],
                'location' => $row['location'],
                'reviewType' => $row['review_type'] ?? 'general',
                'bookingLabel' => $row['booking_label'],

                'packageId' => $row['package_id'],
                'guestName' => trim($row['first_name'] . ' ' . mb_substr($row['last_name'], 0, 1) . '.'),
                'avatarUrl' => !empty($row['avatar_path']) ? config('cvr.site_url') . '/' . $row['avatar_path'] : null,
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        $count = count($reviews);
        $average = $count > 0
            ? round(array_sum(array_column($reviews, 'rating')) / $count, 1)
            : 0;

        json_response(true, 'Reviews loaded.', [
            'reviews' => $reviews,
            'averageRating' => $average,
            'totalReviews' => $count,
        ]);
    }
}
