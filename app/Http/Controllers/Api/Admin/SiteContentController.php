<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class SiteContentController extends Controller
{
    /** Ported from api/admin/content-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();
        $stmt = $pdo->query('SELECT id, content_key, content_type, section, label, text_value, image_path, sort_order, updated_at FROM site_content ORDER BY section ASC, sort_order ASC, id ASC');
        $rows = $stmt->fetchAll();

        $items = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'key' => $row['content_key'],
                'type' => $row['content_type'],
                'section' => $row['section'],
                'label' => $row['label'],
                'textValue' => $row['text_value'],
                'imagePath' => $row['image_path'],
                'imageUrl' => $row['image_path'] ? (config('cvr.site_url') . '/' . $row['image_path']) : null,
                'updatedAt' => $row['updated_at'],
            ];
        }, $rows);

        json_response(true, 'Site content loaded.', ['items' => $items]);
    }

    /** Ported from api/admin/content-photo.php */
    public function photo(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $key = trim((string) ($_POST['key'] ?? ''));
        if ($key === '') {
            json_response(false, 'Missing content key.', [], 422);
        }

        if (empty($_FILES['photo']) || !is_array($_FILES['photo'])) {
            json_response(false, 'No photo was uploaded.', [], 422);
        }

        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The photo failed to upload. Please try again.', [], 422);
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            json_response(false, 'Photo must be smaller than 5 MB.', [], 422);
        }

        $allowedMime = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($file['tmp_name']) ?: '';

        if (!isset($allowedMime[$detectedMime])) {
            json_response(false, 'Photo must be a JPG, PNG, or WEBP image.', [], 422);
        }

        if (@getimagesize($file['tmp_name']) === false) {
            json_response(false, 'That file does not look like a valid image.', [], 422);
        }

        $pdo = get_db_connection();

        $existing = $pdo->prepare('SELECT id, content_type, image_path FROM site_content WHERE content_key = ?');
        $existing->execute([$key]);
        $row = $existing->fetch();

        if (!$row) {
            json_response(false, 'That content field could not be found.', [], 404);
        }

        if ($row['content_type'] !== 'image') {
            json_response(false, 'This is a text field — edit the text instead of uploading a photo.', [], 422);
        }

        $ext = $allowedMime[$detectedMime];
        $fileName = 'content_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $contentDir = cvr_path('uploads/site-content');

        if (!is_dir($contentDir) && !mkdir($contentDir, 0755, true) && !is_dir($contentDir)) {
            json_response(false, 'Could not create the upload folder.', [], 500);
        }

        if (!move_uploaded_file($file['tmp_name'], $contentDir . '/' . $fileName)) {
            json_response(false, 'Could not save the uploaded photo. Please try again.', [], 500);
        }

        $relativePath = 'uploads/site-content/' . $fileName;
        $previous = $row['image_path'];

        $stmt = $pdo->prepare('UPDATE site_content SET image_path = ? WHERE content_key = ?');
        $stmt->execute([$relativePath, $key]);

        if ($previous && $previous !== $relativePath && strpos($previous, 'uploads/site-content/') === 0) {
            $previousAbsolute = cvr_path($previous);
            if (is_file($previousAbsolute)) {
                @unlink($previousAbsolute);
            }
        }

        json_response(true, 'Photo updated.', [
            'key' => $key,
            'imagePath' => $relativePath,
            'imageUrl' => config('cvr.site_url') . '/' . $relativePath,
        ]);
    }

    /** Ported from api/admin/content-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $key = input_str($body, 'key');
        $textValue = isset($body['textValue']) ? (string) $body['textValue'] : '';

        if ($key === '') {
            json_response(false, 'Missing content key.', [], 422);
        }

        $pdo = get_db_connection();

        $existing = $pdo->prepare('SELECT id, content_type FROM site_content WHERE content_key = ?');
        $existing->execute([$key]);
        $row = $existing->fetch();

        if (!$row) {
            json_response(false, 'That content field could not be found.', [], 404);
        }

        if ($row['content_type'] === 'image') {
            json_response(false, 'This is a photo field — upload a new photo instead of saving text.', [], 422);
        }

        if (mb_strlen($textValue) > 20000) {
            json_response(false, 'That text is too long.', [], 422);
        }

        $stmt = $pdo->prepare('UPDATE site_content SET text_value = ? WHERE content_key = ?');
        $stmt->execute([$textValue, $key]);

        json_response(true, 'Content updated.', ['key' => $key, 'textValue' => $textValue]);
    }
}
