<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class AccountController extends Controller
{
    /** Ported from api/account/remove-avatar.php */
    public function removeAvatar(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();

        $userId = (int) session('user_id');
        $pdo = get_db_connection();

        $stmt = $pdo->prepare('SELECT avatar_path FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $previous = $stmt->fetchColumn();

        $update = $pdo->prepare('UPDATE users SET avatar_path = NULL WHERE id = ?');
        $update->execute([$userId]);

        if ($previous) {
            $previousAbsolute = cvr_path($previous);
            if (is_file($previousAbsolute)) {
                @unlink($previousAbsolute);
            }
        }

        session()->put('avatar_path', null);

        json_response(true, 'Profile photo removed.');
    }

    /** Ported from api/account/update-password.php */
    public function updatePassword(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();

        $body = get_json_body();
        $currentPassword = (string) ($body['currentPassword'] ?? '');
        $newPassword     = (string) ($body['newPassword'] ?? '');
        $confirmPassword = (string) ($body['confirmPassword'] ?? '');

        $errors = [];
        if ($currentPassword === '') $errors[] = 'Your current password is required.';
        if (strlen($newPassword) < 6) $errors[] = 'New password must be at least 6 characters.';
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

        notify_admin_activity('Password changed', [
            'Name' => trim((string) session('first_name') . ' ' . (string) session('last_name')),
            'Email' => (string) session('email'),
        ]);

        json_response(true, 'Your password has been updated.');
    }

    /** Ported from api/account/update-profile.php */
    public function updateProfile(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();

        $body = get_json_body();
        $firstName = input_str($body, 'firstName');
        $lastName  = input_str($body, 'lastName');
        $phone     = input_str($body, 'phone');

        $errors = [];
        if ($firstName === '') $errors[] = 'First name is required.';
        if ($lastName === '')  $errors[] = 'Last name is required.';
        if ($phone === '' || !is_valid_phone($phone)) $errors[] = 'A valid contact number is required.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();
        $userId = (int) session('user_id');

        if (is_full_name_taken($pdo, $firstName, $lastName, (string) (session('email') ?? ''))) {
            json_response(false, 'An account already exists under this first and last name. Please choose a different name, or contact us if this is a mistake.', ['nameTaken' => true], 409);
        }

        $update = $pdo->prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?');
        $update->execute([$firstName, $lastName, $phone, $userId]);

        session()->put('first_name', $firstName);
        session()->put('last_name', $lastName);
        session()->put('phone', $phone);

        notify_admin_activity('Profile updated', [
            'Email' => (string) session('email'),
            'New name' => trim($firstName . ' ' . $lastName),
            'Phone' => $phone,
        ]);

        json_response(true, 'Your profile has been updated.', [
            'user' => [
                'id' => $userId,
                'firstName' => $firstName,
                'lastName' => $lastName,
                'phone' => $phone,
                'email' => session('email'),
                'role' => session('role'),
                'avatarUrl' => !empty(session('avatar_path')) ? config('cvr.site_url') . '/' . session('avatar_path') : null,
            ],
        ]);
    }

    /** Ported from api/account/upload-avatar.php */
    public function uploadAvatar(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();

        if (empty($_FILES['avatar']) || !is_array($_FILES['avatar'])) {
            json_response(false, 'No file was uploaded.', [], 422);
        }

        $file = $_FILES['avatar'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The file failed to upload. Please try again.', [], 422);
        }

        $maxBytes = 5 * 1024 * 1024;
        if ($file['size'] > $maxBytes) {
            json_response(false, 'File must be smaller than 5 MB.', [], 422);
        }

        $originalName = (string) ($file['name'] ?? '');
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $ext = preg_replace('/[^a-z0-9]/', '', $ext);
        if ($ext === '' || strlen($ext) > 10) {
            $ext = 'bin';
        }
        $dangerous = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'phps',
                      'cgi', 'pl', 'py', 'sh', 'bash', 'exe', 'bat', 'cmd', 'com', 'htaccess', 'htm', 'html', 'shtml', 'svgz'];
        if (in_array($ext, $dangerous, true)) {
            $ext = 'bin';
        }

        $userId = (int) session('user_id');
        $fileName = 'avatar_' . $userId . '_' . bin2hex(random_bytes(6)) . '.' . $ext;
        $avatarsDir = cvr_path('uploads/avatars');

        if (!is_dir($avatarsDir)) {
            mkdir($avatarsDir, 0755, true);
        }

        $destPath = $avatarsDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            json_response(false, 'Could not save the uploaded file. Please try again.', [], 500);
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

        json_response(true, 'Profile file updated.', [
            'avatarPath' => $relativePath,
            'avatarUrl'  => config('cvr.site_url') . '/' . $relativePath,
        ]);
    }
}
