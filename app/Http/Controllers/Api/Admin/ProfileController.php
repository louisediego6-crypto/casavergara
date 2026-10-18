<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ProfileController extends Controller
{
    /** Ported from api/admin/update-password.php */
    public function updatePassword(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $currentPassword = (string) ($body['currentPassword'] ?? '');
        $newPassword     = (string) ($body['newPassword'] ?? '');
        $confirmPassword = (string) ($body['confirmPassword'] ?? '');

        $errors = [];
        if ($currentPassword === '') $errors[] = 'Your current password is required.';
        if (strlen($newPassword) < 8) $errors[] = 'New password must be at least 8 characters.';
        if ($newPassword !== $confirmPassword) $errors[] = 'New password and confirmation do not match.';
        if ($newPassword !== '' && $newPassword === $currentPassword) $errors[] = 'New password must be different from your current password.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
        $stmt->execute([session('user_id')]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
            json_response(false, 'Your current password is incorrect.', [], 401);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $update = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, session('user_id')]);

        json_response(true, 'Your password has been updated.');
    }

    /** Ported from api/admin/upload-avatar.php */
    public function uploadAvatar(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        if (empty($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
            json_response(false, 'No photo was uploaded.', [], 422);
        }

        $file = $_FILES['avatar'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The photo failed to upload. Please try again.', [], 422);
        }

        $maxBytes = 2 * 1024 * 1024;
        if ($file['size'] > $maxBytes) {
            json_response(false, 'Photo must be smaller than 2 MB.', [], 422);
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

        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            json_response(false, 'That file does not look like a valid image.', [], 422);
        }

        $ext = $allowedMime[$detectedMime];
        $userId = (int) session('user_id');
        $fileName = 'avatar_' . $userId . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $avatarsDir = cvr_path('uploads/avatars');

        if (!is_dir($avatarsDir)) {
            mkdir($avatarsDir, 0755, true);
        }

        $destPath = $avatarsDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            json_response(false, 'Could not save the uploaded photo. Please try again.', [], 500);
        }

        $relativePath = 'uploads/avatars/' . $fileName;

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('SELECT avatar_path FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $previous = $stmt->fetchColumn();

        $update = $pdo->prepare('UPDATE users SET avatar_path = ? WHERE id = ?');
        $update->execute([$relativePath, $userId]);

        // Keep the replaced photo on disk: saved sessions and the account
        // switcher still reference the old URL, and deleting it left them
        // with a broken image. ($previous is kept only for reference.)

        session()->put('avatar_path', $relativePath);

        json_response(true, 'Profile photo updated.', [
            'avatarPath' => $relativePath,
            'avatarUrl'  => config('cvr.site_url') . '/' . $relativePath,
        ]);
    }
}
