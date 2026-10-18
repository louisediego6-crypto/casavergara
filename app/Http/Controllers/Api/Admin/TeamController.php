<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class TeamController extends Controller
{
    /** Ported from api/admin/team-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        if ($id <= 0) {
            json_response(false, 'Invalid team profile.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('DELETE FROM team_members WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            json_response(false, 'That team profile no longer exists.', [], 404);
        }

        json_response(true, 'Team profile removed.');
    }

    /** Ported from api/admin/team-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();

        ensure_team_members_ready($pdo);

        try {
            $rows = $pdo->query(
                'SELECT id, name, role, email, photo_url, bio, facts, sort_order, is_visible, updated_at
                 FROM team_members
                 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            json_response(false, 'Please run database/migration_team_members.sql in phpMyAdmin first.', [], 500);
        }

        $members = array_map(static function (array $row): array {
            return [
                'id' => (int) $row['id'],
                'name' => $row['name'],
                'role' => $row['role'],
                'email' => (string) $row['email'],
                'photo' => $row['photo_url'],
                'bio' => (string) $row['bio'],
                'facts' => (string) $row['facts'],
                'sortOrder' => (int) $row['sort_order'],
                'visible' => (bool) $row['is_visible'],
                'updatedAt' => $row['updated_at'],
            ];
        }, $rows);

        json_response(true, 'OK', ['members' => $members]);
    }

    /** Ported from api/admin/team-photo.php */
    public function photo(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        if (empty($_FILES['photo']) || !is_array($_FILES['photo'])) {
            json_response(false, 'No photo was uploaded.', [], 422);
        }

        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The photo failed to upload. Please try again.', [], 422);
        }

        if ($file['size'] > 3 * 1024 * 1024) {
            json_response(false, 'Photo must be smaller than 3 MB.', [], 422);
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

        $ext = $allowedMime[$detectedMime];
        $fileName = 'team_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $teamDir = cvr_path('uploads/team');

        if (!is_dir($teamDir) && !mkdir($teamDir, 0755, true) && !is_dir($teamDir)) {
            json_response(false, 'Could not create the upload folder.', [], 500);
        }

        if (!move_uploaded_file($file['tmp_name'], $teamDir . '/' . $fileName)) {
            json_response(false, 'Could not save the uploaded photo. Please try again.', [], 500);
        }

        $relativePath = 'uploads/team/' . $fileName;

        json_response(true, 'Photo uploaded.', [
            'photoPath' => $relativePath,
            'photoUrl'  => config('cvr.site_url') . '/' . $relativePath,
        ]);
    }

    /** Ported from api/admin/team-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $id = (int) ($body['id'] ?? 0);
        $name = input_str($body, 'name');
        $role = input_str($body, 'role');
        $email = strtolower(trim(input_str($body, 'email')));
        $photo = input_str($body, 'photo');
        $bio = input_str($body, 'bio');
        $facts = input_str($body, 'facts');
        $sortOrder = (int) ($body['sortOrder'] ?? 0);
        $visible = !empty($body['visible']) ? 1 : 0;

        $errors = [];
        if ($name === '' || mb_strlen($name) > 150) $errors[] = 'Please enter a name (150 characters or fewer).';
        if ($role === '' || mb_strlen($role) > 150) $errors[] = 'Please enter a role/title (150 characters or fewer).';
        if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190)) {
            $errors[] = 'Please enter a valid email address for the "Get in touch" button (or leave it blank).';
        }
        if ($photo !== '' && !preg_match('#^(https?://|\.\./|/|uploads/)#i', $photo)) {
            $errors[] = 'Photo must be a valid image URL or site path.';
        }
        if (mb_strlen($photo) > 500) $errors[] = 'Photo URL is too long.';
        if (mb_strlen($bio) > 2000) $errors[] = 'Bio must be 2000 characters or fewer.';
        if (mb_strlen($facts) > 1000) $errors[] = 'Highlights must be 1000 characters or fewer.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $factLines = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $facts))));
        $facts = implode("\n", array_slice($factLines, 0, 6));

        $pdo = get_db_connection();
        $editorId = (int) ($session['user_id'] ?? 0) ?: null;

        try {
            if ($id > 0) {
                $stmt = $pdo->prepare(
                    'UPDATE team_members
                     SET name = ?, role = ?, email = ?, photo_url = ?, bio = ?, facts = ?, sort_order = ?, is_visible = ?, updated_by = ?
                     WHERE id = ?'
                );
                $stmt->execute([$name, $role, $email, $photo, $bio, $facts, $sortOrder, $visible, $editorId, $id]);
                if ($stmt->rowCount() === 0) {
                    $exists = $pdo->prepare('SELECT id FROM team_members WHERE id = ?');
                    $exists->execute([$id]);
                    if (!$exists->fetchColumn()) {
                        json_response(false, 'That team profile no longer exists.', [], 404);
                    }
                }
            } else {
                if ($sortOrder === 0) {
                    $sortOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order), 0) + 1 FROM team_members')->fetchColumn();
                }
                $stmt = $pdo->prepare(
                    'INSERT INTO team_members (name, role, email, photo_url, bio, facts, sort_order, is_visible, updated_by)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $stmt->execute([$name, $role, $email, $photo, $bio, $facts, $sortOrder, $visible, $editorId]);
                $id = (int) $pdo->lastInsertId();
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('admin/team-save.php: ' . $e->getMessage());
            json_response(false, 'Could not save the profile. Has database/migration_team_members.sql been run?', [], 500);
        }

        json_response(true, 'Team profile saved.', ['id' => $id]);
    }
}
