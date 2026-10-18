<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class SiteTextController extends Controller
{
    /** Ported from api/admin/site-text-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();

        $overrides = [];
        try {
            foreach ($pdo->query('SELECT text_key, text_value, updated_at FROM site_text') as $row) {
                $overrides[$row['text_key']] = $row;
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('site-text-list.php: site_text table unavailable: ' . $e->getMessage());
        }

        $fields = [];
        foreach (SITE_TEXT_FIELDS as $key => $meta) {
            $override = $overrides[$key] ?? null;
            $fields[] = [
                'textKey' => $key,
                'label' => $meta['label'],
                'group' => $meta['group'],
                'page' => $meta['page'],
                'type' => $meta['type'],
                'default' => $meta['default'],
                'isCustom' => $override !== null,
                'value' => $override['text_value'] ?? $meta['default'],
                'updatedAt' => $override['updated_at'] ?? null,
            ];
        }

        json_response(true, 'OK', ['fields' => $fields]);
    }

    /** Ported from api/admin/site-text-reset.php */
    public function reset(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $textKey = input_str($body, 'key');

        if (!isset(SITE_TEXT_FIELDS[$textKey])) {
            json_response(false, 'Unknown text field.', [], 422);
        }

        $pdo = get_db_connection();

        try {
            $pdo->prepare('DELETE FROM site_text WHERE text_key = ?')->execute([$textKey]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('site-text-reset.php: could not delete site_text row: ' . $e->getMessage());
            json_response(false, 'Could not reset this field. Please run database/migration_site_text.sql.', [], 500);
        }

        json_response(true, 'Text reset to default.', [
            'textKey' => $textKey,
            'value' => site_text_default($textKey),
        ]);
    }

    /** Ported from api/admin/site-text-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin']);

        $body = get_json_body();
        $textKey = input_str($body, 'key');
        $value = trim((string) ($body['value'] ?? ''));

        if (!isset(SITE_TEXT_FIELDS[$textKey])) {
            json_response(false, 'Unknown text field.', [], 422);
        }

        if ($value === '') {
            json_response(false, 'This field can\'t be left blank. Use Reset to restore the default wording instead.', [], 422);
        }

        if (mb_strlen($value) > 5000) {
            json_response(false, 'That text is too long (5000 characters max).', [], 422);
        }

        $pdo = get_db_connection();
        $adminId = (int) ($session['user_id'] ?? 0);

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO site_text (text_key, text_value, updated_by) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE text_value = VALUES(text_value), updated_by = VALUES(updated_by)'
            );
            $stmt->execute([$textKey, $value, $adminId]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('site-text-save.php: could not save site_text row (run database/migration_site_text.sql): ' . $e->getMessage());
            json_response(false, 'Could not save this text. Please run database/migration_site_text.sql.', [], 500);
        }

        json_response(true, 'Text updated.', [
            'textKey' => $textKey,
            'value' => $value,
        ]);
    }
}
