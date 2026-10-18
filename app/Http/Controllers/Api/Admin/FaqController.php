<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class FaqController extends Controller
{
    /** Ported from api/admin/faqs-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);

        if ($id <= 0) {
            json_response(false, 'A valid FAQ is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM faqs WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            json_response(false, 'That FAQ could not be found.', [], 404);
        }

        json_response(true, 'FAQ deleted.');
    }

    /** Ported from api/admin/faqs-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();
        $stmt = $pdo->query('SELECT id, question, answer, category, sort_order, is_active FROM faqs ORDER BY category ASC, sort_order ASC, id ASC');
        $rows = $stmt->fetchAll();

        $faqs = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'question' => $row['question'],
                'answer' => $row['answer'],
                'category' => $row['category'] ?: 'General',
                'sortOrder' => (int) $row['sort_order'],
                'isActive' => (bool) $row['is_active'],
            ];
        }, $rows);

        json_response(true, 'OK', ['faqs' => $faqs]);
    }

    /** Ported from api/admin/faqs-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        $question = input_str($body, 'question');
        $answer = input_str($body, 'answer');
        $category = input_str($body, 'category', 'General');
        $sortOrder = (int) ($body['sortOrder'] ?? 0);
        $isActive = !empty($body['isActive']) ? 1 : 0;

        if ($question === '') {
            json_response(false, 'Question is required.', [], 422);
        }
        if (mb_strlen($question) > 255) {
            json_response(false, 'Question must be 255 characters or fewer.', [], 422);
        }
        if ($answer === '') {
            json_response(false, 'Answer is required.', [], 422);
        }
        if ($category === '') {
            $category = 'General';
        }

        $pdo = get_db_connection();

        if ($id > 0) {
            $exists = $pdo->prepare('SELECT id FROM faqs WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetch()) {
                json_response(false, 'That FAQ could not be found.', [], 404);
            }
            $stmt = $pdo->prepare(
                'UPDATE faqs SET question = ?, answer = ?, category = ?, sort_order = ?, is_active = ? WHERE id = ?'
            );
            $stmt->execute([$question, $answer, $category, $sortOrder, $isActive, $id]);
            json_response(true, 'FAQ updated.', ['id' => $id]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$question, $answer, $category, $sortOrder, $isActive]);

        json_response(true, 'FAQ added.', ['id' => (int) $pdo->lastInsertId()]);
    }
}
