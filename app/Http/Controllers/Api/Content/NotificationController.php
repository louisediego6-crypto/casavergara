<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class NotificationController extends Controller
{
    /** Ported from api/content/my-notifications.php */
    public function mine(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        $audience = in_array($session['role'] ?? '', ['admin', 'event_manager'], true) ? 'staff' : 'customer';

        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT id, title, message, link, is_read, created_at
             FROM notifications
             WHERE user_id = ? AND audience = ?
             ORDER BY created_at DESC
             LIMIT 200'
        );
        $stmt->execute([$session['user_id'], $audience]);
        $rows = $stmt->fetchAll();

        $notifications = array_map(static function ($row) {
            return [
                'id'        => (int) $row['id'],
                'title'     => $row['title'],
                'message'   => $row['message'],
                'link'      => $row['link'],
                'read'      => (bool) $row['is_read'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        json_response(true, 'OK', ['notifications' => $notifications]);
    }

    /** Ported from api/content/notifications-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid notification.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $session['user_id']]);

        json_response(true, 'OK');
    }

    /** Ported from api/content/notifications-mark-read.php */
    public function markRead(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid notification.', [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $session['user_id']]);

        json_response(true, 'OK');
    }

    /** Ported from api/content/notifications-mark-unread.php */
    public function markUnread(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid notification.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('UPDATE notifications SET is_read = 0 WHERE id = ? AND user_id = ?');
        $stmt->execute([$id, $session['user_id']]);

        json_response(true, 'OK');
    }
}
