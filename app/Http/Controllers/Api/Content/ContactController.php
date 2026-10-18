<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ContactController extends Controller
{
    /** Ported from api/content/contact.php */
    public function send(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body    = get_json_body();
        $name    = input_str($body, 'name');
        $email   = strtolower(input_str($body, 'email'));
        $phone   = input_str($body, 'phone');
        $subject = input_str($body, 'subject', 'General Inquiry');
        $message = input_str($body, 'message');
        $recipient = strtolower(input_str($body, 'recipient', 'admin'));

        $allowedSubjects = ['General Inquiry', 'Reservations', 'Events & Weddings', 'Guest Support'];
        if (!in_array($subject, $allowedSubjects, true)) {
            $subject = 'General Inquiry';
        }
        if (!in_array($recipient, ['admin', 'staff'], true)) {
            $recipient = 'admin';
        }

        if ($email === '' || $message === '') {
            json_response(false, 'Please fill in your email and message.', [], 422);
        }

        if ($name === '') {
            $localPart = strstr($email, '@', true);
            $localPart = $localPart !== false ? $localPart : $email;
            $localPart = trim(preg_replace('/[._+-]+/', ' ', $localPart));
            $name = $localPart !== '' ? ucwords($localPart) : 'Guest';
        }

        $emailReason = null;
        $emailSuggestion = null;
        if (!validate_email_deliverability($email, $emailReason, $emailSuggestion)) {
            json_response(false, $emailReason ?: 'Please enter a valid email address.', ['deliverable' => false, 'suggestion' => $emailSuggestion], 422);
        }
        if ($phone !== '' && !is_valid_phone($phone)) {
            json_response(false, 'Please enter a valid contact number (7–20 digits).', [], 422);
        }
        if (mb_strlen($name) > 150) {
            json_response(false, 'Name must be 150 characters or fewer.', [], 422);
        }
        if (mb_strlen($message) > 3000) {
            json_response(false, 'Message must be 3000 characters or fewer.', [], 422);
        }

        $messageId = null;
        try {
            $pdo = get_db_connection();
            $stmt = $pdo->prepare(
                'INSERT INTO contact_messages (name, email, phone, subject, recipient_role, message) VALUES (?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([$name, $email, $phone !== '' ? $phone : null, $subject, $recipient, $message]);
            $messageId = (int) $pdo->lastInsertId();

            try {
                $notifRole = $recipient === 'staff' ? 'event_manager' : 'admin';
                $notifTitle = 'New message — ' . $subject;
                $notifMessage = $name . ': ' . mb_substr($message, 0, 140) . (mb_strlen($message) > 140 ? '…' : '');
                $pdo->prepare(
                    "INSERT INTO notifications (user_id, audience, title, message, link)
                     SELECT id, 'staff', ?, ?, ? FROM users WHERE role = ?"
                )->execute([$notifTitle, $notifMessage, 'messages.html?open=' . $messageId, $notifRole]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('contact.php: failed to create admin/staff notification: ' . $e->getMessage());
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('contact.php: failed to save contact message (has database/migration_contact_messages.sql been run?): ' . $e->getMessage());
        }

        $adminBodyHtml = '
            <p><strong>Subject:</strong> ' . htmlspecialchars($subject) . '</p>
            <p><strong>From:</strong> ' . htmlspecialchars($name) . ' &lt;' . htmlspecialchars($email) . '&gt;</p>
            ' . ($phone !== '' ? '<p><strong>Phone:</strong> ' . htmlspecialchars($phone) . '</p>' : '') . '
            <p style="margin-top:16px; white-space:pre-wrap;">' . nl2br(htmlspecialchars($message)) . '</p>
            <p style="margin-top:24px; font-size:12px; color:#888;">Reply to this email to respond directly to ' . htmlspecialchars($name) . '.</p>
        ';

        $mailError = null;
        $sentToAdmin = send_app_email(
            config('cvr.admin_notify_email'),
            config('cvr.admin_notify_name'),
            '[Contact Form] ' . $subject . ' — ' . $name,
            build_email_html('New Contact Form Message', $adminBodyHtml),
            $mailError,
            $email,
            $name
        );

        if ($sentToAdmin && $messageId !== null) {
            $pdo->prepare('UPDATE contact_messages SET emailed_admin = 1 WHERE id = ?')->execute([$messageId]);
        }

        $guestBodyHtml = '
            <p>Hi ' . htmlspecialchars($name) . ',</p>
            <p>Thanks for reaching out to Casa Vergara! We\'ve received your message and our team will get back to you shortly.</p>
            <p style="margin-top:16px; padding:12px 16px; background:#f4f6f9; border-radius:6px; white-space:pre-wrap; color:#555;">' . nl2br(htmlspecialchars($message)) . '</p>
        ';
        $guestMailError = null;
        send_app_email(
            $email,
            $name,
            'We received your message — Casa Vergara',
            build_email_html('Thanks for contacting us', $guestBodyHtml),
            $guestMailError
        );

        if (!$sentToAdmin) {

            json_response(true, 'Your message has been received. Our team will reply shortly.', [
                'id' => $messageId,
                'adminEmailWarning' => $mailError,
            ]);
        }

        json_response(true, 'Thank you! Your message has been received. Our team will reply shortly.', ['id' => $messageId]);
    }
}
