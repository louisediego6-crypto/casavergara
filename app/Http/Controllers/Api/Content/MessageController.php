<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class MessageController extends Controller
{
    /** Ported from api/content/messages-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $email = strtolower((string) $session['email']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid message.', [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('UPDATE contact_messages SET customer_deleted = 1 WHERE id = ? AND LOWER(email) = ?');
        $stmt->execute([$id, $email]);

        json_response(true, 'OK');
    }

    /** Ported from api/content/messages-mark-read.php */
    public function markRead(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $email = strtolower((string) $session['email']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid message.', [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('UPDATE contact_messages SET customer_read = 1 WHERE id = ? AND LOWER(email) = ?');
        $stmt->execute([$id, $email]);

        json_response(true, 'OK');
    }

    /** Ported from api/content/messages-mark-unread.php */
    public function markUnread(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $email = strtolower((string) $session['email']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'Invalid message.', [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('UPDATE contact_messages SET customer_read = 0 WHERE id = ? AND LOWER(email) = ?');
        $stmt->execute([$id, $email]);

        json_response(true, 'OK');
    }

    /** Ported from api/content/my-messages.php */
    public function mine(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $email = strtolower((string) $session['email']);

        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT id, subject, message, admin_reply, replied_at, customer_read, created_at
             FROM contact_messages
             WHERE LOWER(email) = ? AND admin_reply IS NOT NULL AND customer_deleted = 0
             ORDER BY replied_at DESC'
        );
        $stmt->execute([$email]);
        $rows = $stmt->fetchAll();

        $messages = array_map(static function ($row) {
            return [
                'id'          => (int) $row['id'],
                'subject'     => $row['subject'],
                'message'     => $row['message'],
                'adminReply'  => $row['admin_reply'],
                'repliedAt'   => $row['replied_at'],
                'createdAt'   => $row['created_at'],
                'read'        => (bool) $row['customer_read'],
            ];
        }, $rows);

        $unreadCount = count(array_filter($messages, static function ($m) {
            return !$m['read'];
        }));

        json_response(true, 'OK', [
            'messages'    => $messages,
            'unreadCount' => $unreadCount,
        ]);
    }
}
