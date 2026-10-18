<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class MessageController extends Controller
{
    /** Ported from api/admin/messages-compose.php */
    public function compose(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);

        $body     = get_json_body();
        $clientId = (int) ($body['clientId'] ?? 0);
        $name     = input_str($body, 'name');
        $email    = strtolower(input_str($body, 'email'));
        $subject  = input_str($body, 'subject', 'A message from Casa Vergara');
        $message  = input_str($body, 'message');

        $pdo = get_db_connection();

        if ($clientId > 0) {
            $stmt = $pdo->prepare("SELECT first_name, last_name, email, phone FROM users WHERE id = ? AND role = 'customer'");
            $stmt->execute([$clientId]);
            $client = $stmt->fetch();
            if (!$client) {
                json_response(false, 'That client account no longer exists.', [], 404);
            }
            $name  = trim($client['first_name'] . ' ' . $client['last_name']);
            $email = strtolower((string) $client['email']);
            $phone = $client['phone'];
        } else {
            $phone = null;
        }

        $errors = [];
        if ($name === '' || mb_strlen($name) > 150) $errors[] = 'Please enter the recipient\'s name (150 characters or fewer).';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Please enter a valid recipient email address.';
        if ($subject === '' || mb_strlen($subject) > 100) $errors[] = 'Please enter a subject (100 characters or fewer).';
        if ($message === '') $errors[] = 'Please write a message before sending.';
        if (mb_strlen($message) > 3000) $errors[] = 'Message must be 3000 characters or fewer.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $senderRole = (string) ($session['role'] ?? 'admin');
        $senderId   = (int) ($session['user_id'] ?? 0) ?: null;

        $origin = $senderRole === 'event_manager' ? 'the resort staff team' : 'the resort management';
        $note   = 'Message started by ' . $origin . ' from the admin dashboard.';

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO contact_messages
                    (name, email, phone, subject, recipient_role, origin, sender_role, sender_id, message, admin_reply, replied_at, customer_read)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 0)'
            );
            $stmt->execute([
                $name,
                $email,
                $phone,
                $subject,
                $senderRole === 'event_manager' ? 'staff' : 'admin',
                'staff',
                $senderRole,
                $senderId,
                $note,
                $message,
            ]);
            $messageId = (int) $pdo->lastInsertId();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('admin/messages-compose.php: ' . $e->getMessage());
            json_response(false, 'Could not save the message. Has database/migration_contact_messages_origin.sql been run?', [], 500);
        }

        try {
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'customer', ?, ?, ? FROM users WHERE LOWER(email) = ? AND role = 'customer'"
            )->execute([
                'Message from Casa Vergara — ' . $subject,
                mb_substr($message, 0, 140) . (mb_strlen($message) > 140 ? '…' : ''),
                'customer-dashboard.html#messages',
                $email,
            ]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('admin/messages-compose.php: notification failed: ' . $e->getMessage());
        }

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($name) . ',</p>
            <p style="white-space:pre-wrap;">' . nl2br(htmlspecialchars($message)) . '</p>
            <p style="margin-top:24px; font-size:12px; color:#888;">— Casa Vergara Team</p>
            <p style="font-size:12px; color:#999;">You can reply to this email, or open your Casa Vergara dashboard to see this message under "My Messages".</p>
        ';

        $mailError = null;
        $sent = send_app_email(
            $email,
            $name,
            $subject . ' — Casa Vergara',
            build_email_html('A message from Casa Vergara', $bodyHtml),
            $mailError,
            config('cvr.admin_notify_email'),
            config('cvr.admin_notify_name')
        );

        if (!$sent) {
            json_response(true, 'Message saved and visible to the client on the site, but the email could not be sent. ' . ($mailError ?: ''), [
                'id' => $messageId,
                'emailSent' => false,
            ]);
        }

        json_response(true, 'Message sent to ' . $email . '.', ['id' => $messageId, 'emailSent' => true]);
    }

    /** Ported from api/admin/messages-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $stmt = $pdo->query(
            'SELECT id, name, email, phone, subject, recipient_role, origin, sender_role, message, emailed_admin, admin_reply, replied_at, created_at
             FROM contact_messages
             ORDER BY created_at DESC'
        );
        $rows = $stmt->fetchAll();

        $messages = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'subject' => $row['subject'],
                'recipientRole' => $row['recipient_role'] ?? 'admin',
                'origin' => $row['origin'] ?? 'guest',
                'senderRole' => $row['sender_role'] ?? null,
                'message' => $row['message'],
                'emailedAdmin' => (bool) $row['emailed_admin'],
                'adminReply' => $row['admin_reply'],
                'repliedAt' => $row['replied_at'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        json_response(true, 'OK', ['messages' => $messages]);
    }

    /** Ported from api/admin/messages-reply.php */
    public function reply(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body  = get_json_body();
        $id    = (int) ($body['id'] ?? 0);
        $reply = input_str($body, 'reply');

        if ($id <= 0) {
            json_response(false, 'Invalid message.', [], 422);
        }
        if ($reply === '') {
            json_response(false, 'Please write a reply before sending.', [], 422);
        }
        if (mb_strlen($reply) > 3000) {
            json_response(false, 'Reply must be 3000 characters or fewer.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, name, email, subject, message FROM contact_messages WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        if (!$row) {
            json_response(false, 'Message not found.', [], 404);
        }

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($row['name']) . ',</p>
            <p style="white-space:pre-wrap;">' . nl2br(htmlspecialchars($reply)) . '</p>
            <p style="margin-top:24px; font-size:12px; color:#888;">— Casa Vergara Team</p>
            <div style="margin-top:20px; padding-top:16px; border-top:1px solid #e5e5e5; font-size:12px; color:#999;">
                <p style="margin:0 0 4px;">In response to your message:</p>
                <p style="margin:0; white-space:pre-wrap;">' . nl2br(htmlspecialchars($row['message'])) . '</p>
            </div>
        ';

        $pdo->prepare('UPDATE contact_messages SET admin_reply = ?, replied_at = NOW(), customer_read = 0 WHERE id = ?')
            ->execute([$reply, $id]);

        $mailError = null;
        $sent = send_app_email(
            $row['email'],
            $row['name'],
            'Re: ' . $row['subject'] . ' — Casa Vergara',
            build_email_html('A reply from Casa Vergara', $bodyHtml),
            $mailError,
            config('cvr.admin_notify_email'),
            config('cvr.admin_notify_name')
        );

        if (!$sent) {

            json_response(
                true,
                'Reply saved and visible to the guest on the site, but the email could not be sent. ' . ($mailError ?: ''),
                ['emailSent' => false]
            );
        }

        json_response(true, 'Reply sent to ' . $row['email'] . '.', ['emailSent' => true]);
    }
}
