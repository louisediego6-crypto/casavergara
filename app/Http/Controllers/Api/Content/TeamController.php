<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class TeamController extends Controller
{
    /** Ported from api/content/team.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        try {
            $pdo = get_db_connection();
            ensure_team_members_ready($pdo);
            $rows = $pdo->query(
                'SELECT id, name, role, email, photo_url, bio, facts
                 FROM team_members
                 WHERE is_visible = 1
                 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

            error_log('content/team.php: ' . $e->getMessage());
            json_response(false, 'Team content is not available yet.', [], 200);
        }

        $members = array_map(static function (array $row): array {
            $facts = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', (string) $row['facts']))));
            return [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'email' => (string) $row['email'],
                'photo' => $row['photo_url'],
                'bio' => (string) $row['bio'],
                'facts' => $facts,
            ];
        }, $rows);

        json_response(true, 'OK', ['members' => $members]);
    }
}
