<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class SiteController extends Controller
{
    /** Ported from api/content/site-images.php */
    public function images(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();

        json_response(true, 'OK', [
            'images' => get_site_images($pdo),
        ]);
    }

    /** Ported from api/content/site-text.php */
    public function text(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();

        json_response(true, 'OK', [
            'text' => get_site_text($pdo),
        ]);
    }

    /** Ported from api/content/site.php */
    public function content(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->query('SELECT content_key, content_type, text_value, image_path FROM site_content');
        $rows = $stmt->fetchAll();

        $content = [];
        foreach ($rows as $row) {
            if ($row['content_type'] === 'image') {
                $content[$row['content_key']] = $row['image_path'] ? (config('cvr.site_url') . '/' . $row['image_path']) : null;
            } else {
                $content[$row['content_key']] = $row['text_value'];
            }
        }

        json_response(true, 'Site content loaded.', ['content' => $content]);
    }
}
