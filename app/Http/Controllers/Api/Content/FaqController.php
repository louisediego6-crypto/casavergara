<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class FaqController extends Controller
{
    /** Ported from api/content/faqs.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $isStaff = in_array((string) (session('role') ?? ''), ['admin', 'event_manager'], true);

        $pdo = get_db_connection();
        if ($isStaff) {
            $stmt = $pdo->query('SELECT id, question, answer, category, sort_order, is_active FROM faqs ORDER BY category ASC, sort_order ASC, id ASC');
        } else {
            $stmt = $pdo->query('SELECT id, question, answer, category, sort_order, is_active FROM faqs WHERE is_active = 1 ORDER BY category ASC, sort_order ASC, id ASC');
        }
        $rows = $stmt->fetchAll();

        $faqs = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'question' => $row['question'],
                'answer' => $row['answer'],
                'category' => $row['category'] ?: 'General',
                'isActive' => (bool) $row['is_active'],
            ];
        }, $rows);

        json_response(true, 'FAQs loaded.', ['faqs' => $faqs, 'isStaff' => $isStaff]);
    }
}
