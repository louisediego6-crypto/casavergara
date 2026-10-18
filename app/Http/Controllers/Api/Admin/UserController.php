<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class UserController extends Controller
{
    /** Ported from api/admin/users-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $userId = (int) ($body['userId'] ?? 0);

        if ($userId <= 0) {
            json_response(false, 'A valid user is required.', [], 422);
        }

        if ($userId === (int) session('user_id')) {
            json_response(false, 'You cannot delete your own account.', [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $target = $stmt->fetch();
        if (!$target) {
            json_response(false, 'That account could not be found.', [], 404);
        }

        if ($target['role'] === 'admin') {
            $activeAdmins = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($activeAdmins <= 1) {
                json_response(false, 'At least one admin account must remain.', [], 422);
            }
        }

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE user_id = ?');
        $countStmt->execute([$userId]);
        $bookingCount = (int) $countStmt->fetchColumn();

        if ($bookingCount > 0) {
            json_response(false, 'This account has ' . $bookingCount . ' reservation record(s) and cannot be deleted. Suspend it instead to preserve reservation history.', [], 422);
        }

        $avatarStmt = $pdo->prepare('SELECT avatar_path FROM users WHERE id = ?');
        $avatarStmt->execute([$userId]);
        $avatarPath = $avatarStmt->fetchColumn();

        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);

        if ($avatarPath) {
            $absolute = cvr_path($avatarPath);
            if (is_file($absolute)) {
                @unlink($absolute);
            }
        }

        json_response(true, 'Account deleted.');
    }

    /** Ported from api/admin/users-list.php */
    public function index(Request $request)
    {
        $query = $request->query->all();
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();

        $search = trim((string) ($query['search'] ?? ''));
        $role = trim((string) ($query['role'] ?? 'all'));
        $status = trim((string) ($query['status'] ?? 'all'));

        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
            $like = '%' . $search . '%';
            array_push($params, $like, $like, $like, $like);
        }

        if (in_array($role, ['customer', 'admin', 'event_manager'], true)) {
            $where[] = 'role = ?';
            $params[] = $role;
        }

        if (in_array($status, ['active', 'suspended'], true)) {
            $where[] = 'status = ?';
            $params[] = $status;
        }

        $sql = 'SELECT id, first_name, last_name, email, phone, avatar_path, role, is_verified, status, created_at
                FROM users';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $counts = $pdo->query("SELECT
                SUM(role = 'customer') AS customers,
                SUM(role = 'admin') AS admins,
                SUM(role = 'event_manager') AS event_managers,
                SUM(status = 'active') AS active,
                SUM(status = 'suspended') AS suspended,
                COUNT(*) AS total
            FROM users")->fetch();

        $users = array_map(function ($row) {
            return [
                'id' => (int) $row['id'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'avatarUrl' => $row['avatar_path'] ? config('cvr.site_url') . '/' . $row['avatar_path'] : null,
                'role' => $row['role'],
                'isVerified' => (bool) $row['is_verified'],
                'status' => $row['status'],
                'createdAt' => $row['created_at'],
            ];
        }, $rows);

        json_response(true, 'OK', [
            'users' => $users,
            'counts' => [
                'total' => (int) ($counts['total'] ?? 0),
                'customers' => (int) ($counts['customers'] ?? 0),
                'admins' => (int) ($counts['admins'] ?? 0),
                'eventManagers' => (int) ($counts['event_managers'] ?? 0),
                'active' => (int) ($counts['active'] ?? 0),
                'suspended' => (int) ($counts['suspended'] ?? 0),
            ],
            'serverTime' => date('c'),
        ]);
    }

    /** Ported from api/admin/users-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();

        $id        = (int) ($body['id'] ?? 0);
        $firstName = input_str($body, 'firstName');
        $lastName  = input_str($body, 'lastName');
        $email     = strtolower(input_str($body, 'email'));
        $phone     = input_str($body, 'phone');
        $password  = (string) ($body['password'] ?? '');
        $role      = input_str($body, 'role', 'customer');
        $status    = input_str($body, 'status', 'active');

        $errors = [];
        if ($firstName === '') $errors[] = 'First name is required.';
        if ($lastName === '')  $errors[] = 'Last name is required.';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
        if ($phone === '' || !is_valid_phone($phone)) $errors[] = 'A valid contact number is required.';
        if (!in_array($role, ['customer', 'admin', 'event_manager'], true)) $errors[] = 'Invalid role.';
        if (!in_array($status, ['active', 'suspended'], true)) $errors[] = 'Invalid status.';
        if ($id <= 0 && strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
        if ($id > 0 && $password !== '' && strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();
        $currentAdminId = (int) session('user_id');

        $dupStmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $dupStmt->execute([$email, $id]);
        if ($dupStmt->fetch()) {
            json_response(false, 'Another account already uses this email address.', [], 409);
        }

        if ($id > 0) {

            $stmt = $pdo->prepare('SELECT id, role, status FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $target = $stmt->fetch();
            if (!$target) {
                json_response(false, 'That account could not be found.', [], 404);
            }

            if ($id === $currentAdminId && $role !== 'admin') {
                json_response(false, 'You cannot change your own role.', [], 422);
            }
            if ($id === $currentAdminId && $status !== 'active') {
                json_response(false, 'You cannot suspend your own account.', [], 422);
            }

            if ($target['role'] === 'admin' && ($role !== 'admin' || $status !== 'active')) {
                $activeAdmins = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'")->fetchColumn();
                if ($activeAdmins <= 1) {
                    json_response(false, 'At least one active admin account must remain.', [], 422);
                }
            }

            if ($password !== '') {
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $update = $pdo->prepare(
                    'UPDATE users SET first_name=?, last_name=?, email=?, phone=?, role=?, status=?, password_hash=? WHERE id=?'
                );
                $update->execute([$firstName, $lastName, $email, $phone, $role, $status, $passwordHash, $id]);
            } else {
                $update = $pdo->prepare(
                    'UPDATE users SET first_name=?, last_name=?, email=?, phone=?, role=?, status=? WHERE id=?'
                );
                $update->execute([$firstName, $lastName, $email, $phone, $role, $status, $id]);
            }

            json_response(true, 'Account updated.', ['id' => $id]);
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $insert = $pdo->prepare(
            'INSERT INTO users (first_name, last_name, email, phone, password_hash, role, is_verified, status) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
        );
        $insert->execute([$firstName, $lastName, $email, $phone, $passwordHash, $role, $status]);

        json_response(true, 'Account created.', ['id' => (int) $pdo->lastInsertId()], 201);
    }

    /** Ported from api/admin/users-update.php */
    public function update(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $userId = (int) ($body['userId'] ?? 0);
        $action = input_str($body, 'action');
        $newRole = input_str($body, 'role');

        if ($userId <= 0) {
            json_response(false, 'A valid user is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, role, status FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $target = $stmt->fetch();

        if (!$target) {
            json_response(false, 'That account could not be found.', [], 404);
        }

        $currentAdminId = (int) session('user_id');

        if ($action === 'suspend') {
            if ($userId === $currentAdminId) {
                json_response(false, 'You cannot suspend your own account.', [], 422);
            }
            if ($target['role'] === 'admin') {
                $activeAdmins = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'")->fetchColumn();
                if ($activeAdmins <= 1) {
                    json_response(false, 'At least one active admin account must remain.', [], 422);
                }
            }
            $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute(['suspended', $userId]);
            json_response(true, 'Account suspended.');
        } elseif ($action === 'activate') {
            $pdo->prepare('UPDATE users SET status = ? WHERE id = ?')->execute(['active', $userId]);
            json_response(true, 'Account reactivated.');
        } elseif ($action === 'setRole') {
            if (!in_array($newRole, ['customer', 'admin', 'event_manager'], true)) {
                json_response(false, 'Invalid role.', [], 422);
            }
            if ($userId === $currentAdminId && $newRole !== 'admin') {
                json_response(false, 'You cannot change your own role.', [], 422);
            }
            if ($target['role'] === 'admin' && $newRole !== 'admin') {
                $activeAdmins = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin' AND status = 'active'")->fetchColumn();
                if ($activeAdmins <= 1) {
                    json_response(false, 'At least one active admin account must remain.', [], 422);
                }
            }
            $pdo->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$newRole, $userId]);
            json_response(true, 'Role updated.');
        } else {
            json_response(false, 'Unknown action.', [], 422);
        }
    }
}
