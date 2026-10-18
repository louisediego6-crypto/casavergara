<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ReservationController extends Controller
{
    /** Ported from api/admin/reservations-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = input_str($body, 'id');
        if ($id === '') {
            json_response(false, 'Missing reservation id.', [], 422);
        }

        $pdo = get_db_connection();

        try {
            $pdo->prepare('DELETE FROM reservations WHERE id = ?')->execute([$id]);
            json_response(true, 'Reservation deleted.', ['id' => $id]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('admin/reservations-delete.php: delete failed: ' . $e->getMessage());
            json_response(false, 'Could not delete this reservation.', [], 500);
        }
    }

    /** Ported from api/admin/reservations-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();

        try {
            $rows = $pdo->query('SELECT r.payload_json, u.avatar_path FROM reservations r LEFT JOIN users u ON u.email = r.email ORDER BY r.updated_at DESC')->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('admin/reservations-list.php: query failed (has database/migration_reservations.sql been run?): ' . $e->getMessage());
            json_response(false, 'Could not load reservations. Has database/migration_reservations.sql been run?', [], 500);
        }

        $reservations = [];
        foreach ($rows as $row) {
            $decoded = json_decode($row['payload_json'], true);
            if (is_array($decoded)) {
                $decoded['guestAvatarUrl'] = !empty($row['avatar_path'])
                    ? config('cvr.site_url') . '/' . $row['avatar_path']
                    : null;
                $reservations[] = $decoded;
            }
        }

        json_response(true, 'OK', ['reservations' => $reservations]);
    }
}
