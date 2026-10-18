<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class LegalController extends Controller
{
    /** Ported from api/content/legal-updates.php */
    public function updates(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $types = [
            'privacy' => 'Privacy Policy',
            'room' => 'Terms & Conditions — Room Bookings',
            'event' => 'Terms & Conditions — Event Bookings',
        ];

        $pdo = get_db_connection();
        $stmt = $pdo->prepare(
            'SELECT version, created_at FROM terms_and_conditions WHERE booking_type = ? AND is_active = 1 ORDER BY created_at DESC, id DESC LIMIT 1'
        );

        $documents = [];
        foreach ($types as $type => $label) {
            $stmt->execute([$type]);
            $row = $stmt->fetch();
            if (!$row) {
                continue;
            }
            $documents[] = [
                'type' => $type,
                'label' => $label,
                'version' => $row['version'],
                'updatedAt' => $row['created_at'],
            ];
        }

        json_response(true, 'OK', ['documents' => $documents]);
    }

    /** Ported from api/content/terms.php */
    public function terms(Request $request)
    {
        $query = $request->query->all();
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $allowedTypes = ['room', 'event', 'general', 'privacy'];
        $type = strtolower(trim((string) ($query['type'] ?? 'general')));
        if (!in_array($type, $allowedTypes, true)) {
            $type = 'general';
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, booking_type, version, content, created_at FROM terms_and_conditions WHERE booking_type = ? AND is_active = 1 ORDER BY created_at DESC, id DESC LIMIT 1');
        $stmt->execute([$type]);
        $row = $stmt->fetch();

        if (!$row) {
            json_response(false, 'No published content found for this document yet.', [], 404);
        }

        $parse_terms_sections = function (string $content): array {
            $blocks = preg_split('/\n\s*\n/', trim($content));
            $sections = [];
            foreach ($blocks as $block) {
                $block = trim($block);
                if ($block === '') {
                    continue;
                }
                if (preg_match('/^##\s*(.+?)\n(.*)$/s', $block, $m)) {
                    $sections[] = ['title' => trim($m[1]), 'body' => trim($m[2])];
                } else {
                    $sections[] = ['title' => '', 'body' => $block];
                }
            }
            return $sections;
        };

        json_response(true, 'Content loaded.', [
            'bookingType' => $row['booking_type'],
            'version' => $row['version'],
            'effectiveDate' => $row['created_at'],
            'sections' => $parse_terms_sections($row['content']),
        ]);
    }
}
