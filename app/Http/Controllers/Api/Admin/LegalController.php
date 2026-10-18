<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class LegalController extends Controller
{
    /** Ported from api/admin/legal-get.php */
    public function show(Request $request)
    {
        $query = $request->query->all();
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $allowedTypes = ['room', 'event', 'general', 'privacy'];
        $type = strtolower(trim((string) ($query['type'] ?? '')));
        if (!in_array($type, $allowedTypes, true)) {
            json_response(false, 'Invalid document type.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, version, content, created_at FROM terms_and_conditions WHERE booking_type = ? AND is_active = 1 ORDER BY created_at DESC, id DESC LIMIT 1');
        $stmt->execute([$type]);
        $row = $stmt->fetch();

        json_response(true, 'OK', [
            'bookingType' => $type,
            'version' => $row['version'] ?? '1.0',
            'content' => $row['content'] ?? '',
            'effectiveDate' => $row['created_at'] ?? null,
            'exists' => (bool) $row,
        ]);
    }

    /** Ported from api/admin/legal-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $allowedTypes = ['room', 'event', 'general', 'privacy'];
        $body = get_json_body();
        $type = strtolower(input_str($body, 'bookingType'));
        $version = input_str($body, 'version');
        $content = (string) ($body['content'] ?? '');

        if (!in_array($type, $allowedTypes, true)) {
            json_response(false, 'Invalid document type.', [], 422);
        }
        if ($version === '' || !preg_match('/^\d+(\.\d+)*$/', $version)) {
            json_response(false, 'Version must look like "1.0" or "2.3".', [], 422);
        }
        if (trim($content) === '') {
            json_response(false, 'Content cannot be empty.', [], 422);
        }

        $docMeta = [
            'privacy' => ['label' => 'Privacy Policy', 'url' => 'privacy.html'],
            'room'    => ['label' => 'Terms & Conditions — Room Bookings', 'url' => 'terms.html?type=room'],
            'event'   => ['label' => 'Terms & Conditions — Event Bookings', 'url' => 'terms.html?type=event'],
            'general' => ['label' => 'Terms & Conditions', 'url' => 'terms.html'],
        ];

        $pdo = get_db_connection();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE terms_and_conditions SET is_active = 0 WHERE booking_type = ?')->execute([$type]);
            $insert = $pdo->prepare('INSERT INTO terms_and_conditions (booking_type, version, content, is_active) VALUES (?, ?, ?, 1)');
            $insert->execute([$type, $version, $content]);

            $meta = $docMeta[$type] ?? ['label' => ucfirst($type), 'url' => 'terms.html'];
            $notifTitle = $meta['label'] . ' updated';
            $notifMessage = "We've published v{$version} of our {$meta['label']}. Please review the changes.";
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'customer', ?, ?, ? FROM users WHERE role = 'customer'"
            )->execute([$notifTitle, $notifMessage, $meta['url']]);

            $pdo->commit();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $pdo->rollBack();
            json_response(false, 'Could not save this document. Please try again.', [], 500);
        }

        json_response(true, 'Published. This is now the live version shown on the website.', [
            'bookingType' => $type,
            'version' => $version,
        ]);
    }
}
