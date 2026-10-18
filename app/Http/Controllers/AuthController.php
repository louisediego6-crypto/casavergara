<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class AuthController extends Controller
{
    /** Ported from api/auth/check-email.php */
    public function checkEmail(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));

        $reason = null;
        $suggestion = null;
        $verified = null;
        if (!validate_email_deliverability($email, $reason, $suggestion, $verified)) {
            json_response(false, $reason, ['deliverable' => false, 'verified' => false, 'suggestion' => $suggestion], 200);
        }

        json_response(true, 'Email looks good.', ['deliverable' => true, 'verified' => $verified === true], 200);
    }

    /** Ported from api/auth/check-name.php */
    public function checkName(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body      = get_json_body();
        $firstName = input_str($body, 'firstName');
        $lastName  = input_str($body, 'lastName');
        $email     = strtolower(input_str($body, 'email'));

        if ($firstName === '' || $lastName === '') {
            json_response(false, 'Enter both a first and last name.', ['available' => false], 200);
        }

        $pdo = get_db_connection();
        $taken = is_full_name_taken($pdo, $firstName, $lastName, $email);

        if ($taken) {
            json_response(false, 'An account already exists under this first and last name.', ['available' => false], 200);
        }

        json_response(true, 'Name looks good.', ['available' => true], 200);
    }

    /** Ported from api/auth/check-phone.php */
    public function checkPhone(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $phone = input_str($body, 'phone');
        $email = strtolower(input_str($body, 'email'));

        if ($phone === '' || !is_valid_phone($phone)) {
            json_response(false, 'Please enter a valid contact number.', ['available' => false], 200);
        }

        $pdo = get_db_connection();
        $taken = count_accounts_with_phone($pdo, $phone, $email) >= config('cvr.max_accounts_per_phone');

        if ($taken) {
            json_response(false, 'This phone number is already in use. Please try a different phone number.', ['available' => false], 200);
        }

        json_response(true, 'Phone number looks good.', ['available' => true], 200);
    }

    /** Ported from api/auth/forget-account.php */
    public function forgetAccount(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));

        if ($email === '') {
            json_response(false, 'Which saved account should we remove?', [], 422);
        }

        $pdo = get_db_connection();
        cvr_remember_forget($pdo, $email);

        json_response(true, 'Removed from this browser.');
    }

    /** Ported from api/auth/forgot-password.php */
    public function forgotPassword(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'A valid email address is required.', [], 422);
        }

        $genericMessage = "If an account exists for that email, we've sent a 6-digit code to it.";

        $pdo = get_db_connection();
        $otpLockoutAvailable = cvr_reset_otp_columns_available($pdo);
        $columns = $otpLockoutAvailable
            ? 'id, first_name, status, reset_code_attempts, reset_block_until'
            : 'id, first_name, status';
        $stmt = $pdo->prepare('SELECT ' . $columns . ' FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user || $user['status'] === 'suspended') {
            json_response(true, $genericMessage);
        }

        $secondsLeft = $otpLockoutAvailable ? cvr_reset_block_seconds_left($user) : 0;
        if ($secondsLeft > 0) {
            json_response(false,
                'For security, this account is temporarily blocked from receiving password reset codes because too many incorrect codes were entered. Please try again in ' . cvr_format_wait($secondsLeft) . '.',
                ['otpBlocked' => true, 'retrySeconds' => $secondsLeft],
                429
            );
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires = date('Y-m-d H:i:s', strtotime('+' . config('cvr.reset_code_ttl_minutes') . ' minutes'));

        $update = $pdo->prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?');
        $update->execute([$code, $expires, $user['id']]);

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($user['first_name']) . ',</p>
            <p>We received a request to reset your Casa Vergara account password. Use the code below to continue:</p>
            <p style="text-align:center; margin:28px 0;">
                <span style="display:inline-block; background:#f4f6f9; color:#0c3b5d; font-size:28px; font-weight:700; letter-spacing:8px; padding:14px 24px; border-radius:8px;">' . $code . '</span>
            </p>
            <p style="font-size:13px; color:#666;">This code expires in ' . config('cvr.reset_code_ttl_minutes') . ' minutes.</p>
            <p style="font-size:13px; color:#666;">If you didn\'t request this, you can safely ignore this email.</p>
        ';

        $mailError = null;
        $sent = send_app_email($email, $user['first_name'], 'Your Casa Vergara password reset code', build_email_html('Reset your password', $bodyHtml), $mailError);

        if (!$sent) {
            json_response(false, 'We could not send the reset code right now. Please try again in a moment.', ['mailError' => $mailError], 500);
        }

        json_response(true, $genericMessage);
    }

    /** Ported from api/auth/login.php */
    public function login(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body = get_json_body();
        $email = strtolower(input_str($body, 'email'));
        $password = (string) ($body['password'] ?? '');

        $remember = !empty($body['remember']);

        if ($email === '' || $password === '') {
            json_response(false, 'Email and password are required.', [], 422);
        }

        $pdo = get_db_connection();

        $lockoutColumnsAvailable = true;
        try {
            $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, phone, password_hash, avatar_path, role, is_verified, status, created_at, failed_login_attempts, lockout_until FROM users WHERE email = ?');
            $stmt->execute([$email]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $lockoutColumnsAvailable = false;
            $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, phone, password_hash, avatar_path, role, is_verified, status, created_at FROM users WHERE email = ?');
            $stmt->execute([$email]);
        }
        $user = $stmt->fetch();

        if ($lockoutColumnsAvailable && $user && !empty($user['lockout_until']) && strtotime($user['lockout_until']) > time()) {
            $waitMinutes = max(1, (int) ceil((strtotime($user['lockout_until']) - time()) / 60));
            json_response(false,
                'Too many failed attempts. Please try again in ' . $waitMinutes . ' minute' . ($waitMinutes === 1 ? '' : 's') . ', or reset your password instead.',
                ['lockedOut' => true, 'retryAfterMinutes' => $waitMinutes, 'suggestReset' => true],
                429
            );
        }

        if (!$user || !password_verify($password, $user['password_hash'])) {

            if ($lockoutColumnsAvailable && $user) {
                $attempts = (int) $user['failed_login_attempts'] + 1;

                if ($attempts >= config('cvr.login_max_attempts')) {
                    $lockUntil = date('Y-m-d H:i:s', time() + config('cvr.login_lockout_minutes') * 60);
                    $pdo->prepare('UPDATE users SET failed_login_attempts = 0, lockout_until = ? WHERE id = ?')
                        ->execute([$lockUntil, $user['id']]);

                    json_response(false,
                        'Too many failed attempts. Your account is temporarily locked for ' . config('cvr.login_lockout_minutes') . ' minutes. You can also reset your password below.',
                        ['lockedOut' => true, 'retryAfterMinutes' => config('cvr.login_lockout_minutes'), 'suggestReset' => true],
                        429
                    );
                }

                $pdo->prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?')->execute([$attempts, $user['id']]);

                if ($attempts >= config('cvr.login_max_attempts') - 1) {
                    json_response(false, 'Incorrect email or password. One more failed attempt will temporarily lock this account — you can reset your password instead.', ['suggestReset' => true], 401);
                }
            }

            json_response(false, 'Incorrect email or password.', [], 401);
        }

        if ($lockoutColumnsAvailable && ((int) $user['failed_login_attempts'] !== 0 || !empty($user['lockout_until']))) {
            $pdo->prepare('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?')->execute([$user['id']]);
        }

        if ($user['status'] === 'suspended') {
            json_response(false, 'This account has been suspended. Please contact Casa Vergara.', ['suspended' => true], 403);
        }

        if (!$user['is_verified']) {
            json_response(false, 'Please verify your email address before signing in. Check your inbox for the 6-digit verification code.', ['unverified' => true], 403);
        }

        session()->regenerate(true);
        session()->put('user_id', $user['id']);
        session()->put('first_name', $user['first_name']);
        session()->put('last_name', $user['last_name']);
        session()->put('email', $user['email']);
        session()->put('phone', $user['phone']);
        session()->put('role', $user['role']);
        session()->put('avatar_path', $user['avatar_path']);

        $pdo_remember_ok = false;
        try {
            if ($remember) {
                cvr_remember_issue($pdo, (int) $user['id']);
            }
            $pdo_remember_ok = cvr_remember_available($pdo);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

            error_log('login.php: remember-me failed: ' . $e->getMessage());
        }

        json_response(true, 'Welcome back, ' . $user['first_name'] . '!', [
            'user' => cvr_user_payload($user),
            'remembered' => $remember && $pdo_remember_ok,
        ]);
    }

    /** Ported from api/auth/logout.php */
    public function logout(Request $request)
    {
        session()->invalidate();

        json_response(true, 'You have been signed out.');
    }

    /** Ported from api/auth/me.php */
    public function me(Request $request)
    {
        if (empty(session('user_id'))) {
            json_response(false, 'Not logged in.', [], 401);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT phone, avatar_path, status, created_at FROM users WHERE id = ?');
        $stmt->execute([session('user_id')]);
        $row = $stmt->fetch();
        if (!$row) {

            session()->invalidate();
            json_response(false, 'Not logged in.', [], 401);
        }

        if ($row['status'] === 'suspended') {

            session()->flush();
            session()->invalidate();
            json_response(false, 'This account has been suspended. Please contact Casa Vergara.', ['suspended' => true], 403);
        }

        $avatarPath = $row['avatar_path'];
        session()->put('avatar_path', $avatarPath ?: null);
        session()->put('phone', $row['phone']);

        json_response(true, 'OK', [
            'user' => [
                'id' => session('user_id'),
                'firstName' => session('first_name'),
                'lastName' => session('last_name'),
                'email' => session('email'),
                'phone' => $row['phone'],
                'role' => session('role'),
                'avatarUrl' => $avatarPath ? config('cvr.site_url') . '/' . $avatarPath : null,
                'joinedAt' => $row['created_at'],
            ],
        ]);
    }

    /** Ported from api/auth/register.php */
    public function register(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body = get_json_body();

        $firstName = input_str($body, 'firstName');
        $lastName  = input_str($body, 'lastName');
        $email     = strtolower(input_str($body, 'email'));
        $phone     = input_str($body, 'phone');
        $password  = (string) ($body['password'] ?? '');
        $passwordConfirm = (string) ($body['passwordConfirm'] ?? '');
        $agreedTerms = !empty($body['terms']);

        $errors = [];
        if ($firstName === '') $errors[] = 'First name is required.';
        if ($lastName === '')  $errors[] = 'Last name is required.';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
        if ($phone === '' || !is_valid_phone($phone)) $errors[] = 'A valid contact number is required.';
        if (strlen($password) < 6) $errors[] = 'Password must be at least 6 characters.';
        if ($password !== $passwordConfirm) $errors[] = 'Passwords do not match.';
        if (!$agreedTerms) $errors[] = 'You must agree to the Terms & Conditions.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $deliverReason = null;
        $deliverSuggestion = null;
        if (!validate_email_deliverability($email, $deliverReason, $deliverSuggestion)) {
            json_response(false, $deliverReason, ['suggestion' => $deliverSuggestion], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare('SELECT id, is_verified FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $existing = $stmt->fetch();

        if ($existing) {
            if ((int) $existing['is_verified'] === 1) {
                json_response(false, 'An account with this email already exists. Please sign in instead.', [], 409);
            }
        }

        if (count_accounts_with_phone($pdo, $phone, $email) >= config('cvr.max_accounts_per_phone')) {
            json_response(false, 'This phone number is already in use. Please try a different phone number.', ['phoneTaken' => true], 409);
        }

        if (is_full_name_taken($pdo, $firstName, $lastName, $email)) {
            json_response(false, 'An account already exists under this first and last name. Please sign in, or contact us if this is a mistake.', ['nameTaken' => true], 409);
        }

        if ($existing) {

            $userId = $existing['id'];
            $token = generate_verification_code();
            $expires = date('Y-m-d H:i:s', strtotime('+' . config('cvr.verification_code_ttl_minutes') . ' minutes'));
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $update = $pdo->prepare('UPDATE users SET first_name=?, last_name=?, phone=?, password_hash=?, verification_token=?, verification_expires=? WHERE id=?');
            $update->execute([$firstName, $lastName, $phone, $passwordHash, $token, $expires, $userId]);
        } else {
            $token = generate_verification_code();
            $expires = date('Y-m-d H:i:s', strtotime('+' . config('cvr.verification_code_ttl_minutes') . ' minutes'));
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);

            $insert = $pdo->prepare('INSERT INTO users (first_name, last_name, email, phone, password_hash, role, is_verified, verification_token, verification_expires) VALUES (?, ?, ?, ?, ?, "customer", 0, ?, ?)');
            $insert->execute([$firstName, $lastName, $email, $phone, $passwordHash, $token, $expires]);
            $userId = $pdo->lastInsertId();
        }

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($firstName) . ',</p>
            <p>Thanks for creating a guest account with Casa Vergara. Enter the code below on the registration page to activate your account:</p>
            <p style="text-align:center; margin:28px 0;">
                <span style="display:inline-block; background:#f4f6f9; color:#0c3b5d; font-size:28px; font-weight:700; letter-spacing:8px; padding:14px 24px; border-radius:8px;">' . $token . '</span>
            </p>
            <p style="font-size:13px; color:#666;">This code expires in ' . config('cvr.verification_code_ttl_minutes') . ' minutes.</p>
            <p style="font-size:13px; color:#666;">If you didn\'t create this account, you can safely ignore this email.</p>
        ';

        $mailError = null;
        $sent = send_app_email($email, $firstName, 'Your Casa Vergara verification code', build_email_html('Verify your account', $bodyHtml), $mailError);

        if (!$sent) {
            json_response(true, 'Account created, but we could not send the verification code right now. Please use "Resend code" to try again.', [
                'userId' => $userId,
                'email' => $email,
                'needsVerification' => true,
                'mailError' => $mailError,
            ], 201);
        }

        json_response(true, 'We sent a 6-digit code to ' . $email . '. Enter it below to verify your account.', [
            'userId' => $userId,
            'email' => $email,
            'needsVerification' => true,
        ], 201);
    }

    /** Ported from api/auth/remember-login.php */
    public function rememberLogin(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));

        if ($email === '') {
            json_response(false, 'Which saved account should we sign in?', [], 422);
        }

        $pdo = get_db_connection();

        if (!cvr_remember_available($pdo)) {
            json_response(false, 'Saved sign-in is not set up on this site yet. Please sign in with your password.', ['needsPassword' => true], 400);
        }

        $match = null;
        foreach (cvr_remember_lookup($pdo) as $row) {
            if (strcasecmp((string) $row['email'], $email) === 0) {
                $match = $row;
                break;
            }
        }

        if (!$match) {
            json_response(false, 'This account is no longer saved on this browser. Please enter your password.', ['needsPassword' => true], 401);
        }

        if ($match['status'] === 'suspended') {
            cvr_remember_forget($pdo, $match['email']);
            json_response(false, 'This account has been suspended. Please contact Casa Vergara.', ['suspended' => true], 403);
        }

        if ((int) $match['is_verified'] !== 1) {
            json_response(false, 'Please verify your email address before signing in.', ['unverified' => true], 403);
        }

        session()->regenerate(true);
        session()->put('user_id', $match['user_id']);
        session()->put('first_name', $match['first_name']);
        session()->put('last_name', $match['last_name']);
        session()->put('email', $match['email']);
        session()->put('phone', $match['phone']);
        session()->put('role', $match['role']);
        session()->put('avatar_path', $match['avatar_path']);

        try {
            $pdo->prepare('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?')
                ->execute([$match['user_id']]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

        }

        cvr_remember_rotate($pdo, $match);

        json_response(true, 'Welcome back, ' . $match['first_name'] . '!', [
            'user' => cvr_user_payload([
                'id' => $match['user_id'],
                'first_name' => $match['first_name'],
                'last_name' => $match['last_name'],
                'email' => $match['email'],
                'phone' => $match['phone'],
                'role' => $match['role'],
                'avatar_path' => $match['avatar_path'],
                'created_at' => $match['created_at'],
            ]),
        ]);
    }

    /** Ported from api/auth/resend-verification.php */
    public function resendVerification(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body = get_json_body();
        $email = strtolower(input_str($body, 'email'));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'A valid email address is required.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, first_name, is_verified FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $genericMessage = 'If an unverified account exists for that email, a new 6-digit code has been sent.';

        if (!$user || (int) $user['is_verified'] === 1) {
            json_response(true, $genericMessage);
        }

        $token = generate_verification_code();
        $expires = date('Y-m-d H:i:s', strtotime('+' . config('cvr.verification_code_ttl_minutes') . ' minutes'));

        $update = $pdo->prepare('UPDATE users SET verification_token=?, verification_expires=? WHERE id=?');
        $update->execute([$token, $expires, $user['id']]);

        $bodyHtml = '
            <p>Hi ' . htmlspecialchars($user['first_name']) . ',</p>
            <p>Here is your new verification code:</p>
            <p style="text-align:center; margin:28px 0;">
                <span style="display:inline-block; background:#f4f6f9; color:#0c3b5d; font-size:28px; font-weight:700; letter-spacing:8px; padding:14px 24px; border-radius:8px;">' . $token . '</span>
            </p>
            <p style="font-size:13px; color:#666;">This code expires in ' . config('cvr.verification_code_ttl_minutes') . ' minutes.</p>
        ';
        send_app_email($email, $user['first_name'], 'Your new Casa Vergara verification code', build_email_html('Verify your account', $bodyHtml));

        json_response(true, $genericMessage);
    }

    /** Ported from api/auth/reset-password.php */
    public function resetPassword(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));
        $code  = input_str($body, 'code');
        $newPassword     = (string) ($body['newPassword'] ?? '');
        $confirmPassword = (string) ($body['confirmPassword'] ?? '');

        $errors = [];
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
        if (!preg_match('/^\d{6}$/', $code)) $errors[] = 'A valid 6-digit code is required.';
        if (strlen($newPassword) < 6) $errors[] = 'New password must be at least 6 characters.';
        if ($newPassword !== $confirmPassword) $errors[] = 'New password and confirmation do not match.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();
        $otpLockoutAvailable = cvr_reset_otp_columns_available($pdo);
        $columns = $otpLockoutAvailable
            ? 'id, reset_token, reset_expires, reset_code_attempts, reset_block_until'
            : 'id, reset_token, reset_expires';
        $stmt = $pdo->prepare('SELECT ' . $columns . ' FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $secondsLeft = ($otpLockoutAvailable && $user) ? cvr_reset_block_seconds_left($user) : 0;
        if ($secondsLeft > 0) {
            json_response(false,
                'Too many incorrect codes were entered for this account. For security, password reset is locked for another ' . cvr_format_wait($secondsLeft) . '.',
                ['otpBlocked' => true, 'retrySeconds' => $secondsLeft],
                429
            );
        }

        if (!$user || $user['reset_token'] === null || !hash_equals((string) $user['reset_token'], $code)) {
            if ($user) {
                $result = cvr_register_wrong_reset_code($pdo, $user);
                if ($result['blocked']) {
                    json_response(false,
                        'That code is incorrect. After ' . config('cvr.reset_otp_max_attempts') . ' wrong codes in a row, this account cannot receive or use a password reset code for the next ' . config('cvr.reset_otp_block_hours') . ' hours.',
                        ['otpBlocked' => true, 'retrySeconds' => $result['secondsLeft']],
                        429
                    );
                }
                json_response(false,
                    'That code is incorrect. You have ' . $result['attemptsLeft'] . ' attempt' . ($result['attemptsLeft'] === 1 ? '' : 's') . ' left before password reset is locked for ' . config('cvr.reset_otp_block_hours') . ' hours.',
                    ['attemptsLeft' => $result['attemptsLeft']],
                    401
                );
            }
            json_response(false, 'That code is incorrect. Please check your email and try again.', [], 401);
        }

        if (!$user['reset_expires'] || strtotime($user['reset_expires']) < time()) {
            json_response(false, 'That code has expired. Please request a new one.', [], 401);
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $resetSql = $otpLockoutAvailable
            ? 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL, reset_code_attempts = 0, reset_block_until = NULL WHERE id = ?'
            : 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?';
        $update = $pdo->prepare($resetSql);
        $update->execute([$newHash, $user['id']]);

        json_response(true, 'Your password has been reset. You can now sign in with your new password.');
    }

    /** Ported from api/auth/saved-accounts.php */
    public function savedAccounts(Request $request)
    {
        $pdo = get_db_connection();

        $accounts = [];
        foreach (cvr_remember_lookup($pdo) as $row) {
            $accounts[] = [
                'email' => $row['email'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'avatarUrl' => !empty($row['avatar_path']) ? config('cvr.site_url') . '/' . $row['avatar_path'] : null,
                'role' => $row['role'],
            ];
        }

        json_response(true, 'Saved accounts on this browser.', [
            'accounts' => $accounts,
            'available' => cvr_remember_available($pdo),
        ]);
    }

    /** Ported from api/auth/test-mail.php */
    public function testMail(Request $request)
    {
        if (!in_array($request->ip() ?? '', ['127.0.0.1', '::1', 'localhost'], true)) {
            return response('Not found.', 404);
        }

        $to = $request->query('to') !== null ? trim($request->query('to')) : '';

        $out = '<html><body style="font-family: Arial, sans-serif; max-width:700px; margin:40px auto; line-height:1.6;">';
        $out .= '<h2>Casa Vergara &mdash; Mail Test</h2>';

        if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
            $out .= '<p>Add <code>?to=your@email.com</code> to the URL to run the test, e.g.:</p>';
            $out .= '<p><code>' . htmlspecialchars(config('cvr.site_url')) . '/api/auth/test-mail?to=you@gmail.com</code></p>';
            $out .= '</body></html>';
            return response($out)->header('Content-Type', 'text/html; charset=utf-8');
        }

        $out .= '<p><strong>Sending from:</strong> ' . htmlspecialchars(config('cvr.mail_from_email')) . '</p>';
        $out .= '<p><strong>Sending to:</strong> ' . htmlspecialchars($to) . '</p>';
        $out .= '<hr>';

        $error = null;
        $start = microtime(true);
        $sent = send_app_email(
            $to,
            'Test Recipient',
            'Casa Vergara - SMTP Test',
            build_email_html('SMTP Test Email', '<p>If you are reading this, the e-mail service is configured correctly. 🎉</p>'),
            $error
        );
        $elapsed = round(microtime(true) - $start, 2);

        if ($sent) {
            $out .= '<p style="color:green; font-weight:bold; font-size:18px;">✅ Success! Email sent in ' . $elapsed . 's.</p>';
            $out .= '<p>Check the inbox (and Spam folder) of <strong>' . htmlspecialchars($to) . '</strong>.</p>';
        } else {
            $out .= '<p style="color:#b00020; font-weight:bold; font-size:18px;">❌ Failed after ' . $elapsed . 's.</p>';
            $out .= '<p><strong>Raw error:</strong></p>';
            $out .= '<pre style="background:#f5f5f5; padding:16px; border-radius:6px; white-space:pre-wrap;">' . htmlspecialchars((string) $error) . '</pre>';

            $out .= '<h3>What this usually means:</h3><ul>';
            if (stripos((string) $error, 'not set') !== false || stripos((string) $error, 'authenticat') !== false || stripos((string) $error, '535') !== false) {
                $out .= '<li><code>MAIL_USERNAME</code> / <code>MAIL_PASSWORD</code> in <code>.env</code> are missing or wrong. Use your Gmail address and a 16-letter Google App Password (no spaces). Your normal Gmail password will not work.</li>';
                $out .= '<li>The App Password must belong to the same Gmail account as <code>MAIL_USERNAME</code>, and 2-Step Verification must be on for that account.</li>';
            } elseif (stripos((string) $error, 'certificate') !== false || stripos((string) $error, 'ssl') !== false || stripos((string) $error, 'tls') !== false) {
                $out .= '<li>This is a local certificate issue common on Windows. Add <code>MAIL_VERIFY_PEER=false</code> to <code>.env</code>, run <code>php artisan config:clear</code>, and restart the server.</li>';
            } elseif (stripos((string) $error, 'connect') !== false || stripos((string) $error, 'timed out') !== false || stripos((string) $error, 'timeout') !== false) {
                $out .= '<li>Outbound port 587 is blocked (school/office network, antivirus, or firewall). Try a different network (e.g. mobile hotspot) to confirm.</li>';
            } else {
                $out .= '<li>Copy the raw error above and share it - it tells us exactly what to fix next.</li>';
            }
            $out .= '</ul>';
        }

        $out .= '</body></html>';
        return response($out)->header('Content-Type', 'text/html; charset=utf-8');
    }

    /** Ported from api/auth/verify-email-code.php */
    public function verifyEmailCode(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));
        $code  = input_str($body, 'code');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'A valid email address is required.', [], 422);
        }
        if (!preg_match('/^\d{6}$/', $code)) {
            json_response(false, 'Enter the 6-digit code from your email.', [], 422);
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, is_verified, verification_token, verification_expires, first_name, last_name, email FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if (!$user) {
            json_response(false, 'We could not find an account for that email.', [], 404);
        }

        if ((int) $user['is_verified'] === 1) {
            json_response(true, 'Your email is already verified. You can sign in now.', ['alreadyVerified' => true]);
        }

        if ($user['verification_token'] === null || !hash_equals((string) $user['verification_token'], $code)) {
            json_response(false, 'That code is incorrect. Please check your email and try again.', [], 401);
        }

        if (!$user['verification_expires'] || strtotime($user['verification_expires']) < time()) {
            json_response(false, 'That code has expired. Please request a new one.', [], 401);
        }

        $update = $pdo->prepare('UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?');
        $update->execute([$user['id']]);

        try {
            $guestName = trim($user['first_name'] . ' ' . $user['last_name']) ?: $user['email'];
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'staff', ?, ?, ? FROM users WHERE role IN ('admin', 'event_manager')"
            )->execute([
                'New guest account',
                $guestName . ' (' . $user['email'] . ') just verified their account.',
                'users.html',
            ]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('verify-email-code.php: failed to create admin/staff notification: ' . $e->getMessage());
        }

        json_response(true, 'Email verified! You can now sign in.');
    }

    /** Ported from api/auth/verify-reset-code.php */
    public function verifyResetCode(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $body  = get_json_body();
        $email = strtolower(input_str($body, 'email'));
        $code  = input_str($body, 'code');

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'A valid email address is required.', [], 422);
        }
        if (!preg_match('/^\d{6}$/', $code)) {
            json_response(false, 'Enter the 6-digit code from your email.', [], 422);
        }

        $pdo = get_db_connection();
        $otpLockoutAvailable = cvr_reset_otp_columns_available($pdo);
        $columns = $otpLockoutAvailable
            ? 'id, reset_token, reset_expires, reset_code_attempts, reset_block_until'
            : 'id, reset_token, reset_expires';
        $stmt = $pdo->prepare('SELECT ' . $columns . ' FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        $secondsLeft = ($otpLockoutAvailable && $user) ? cvr_reset_block_seconds_left($user) : 0;
        if ($secondsLeft > 0) {
            json_response(false,
                'Too many incorrect codes were entered for this account. For security, password reset is locked for another ' . cvr_format_wait($secondsLeft) . '.',
                ['otpBlocked' => true, 'retrySeconds' => $secondsLeft],
                429
            );
        }

        if (!$user || $user['reset_token'] === null || !hash_equals((string) $user['reset_token'], $code)) {
            if ($user) {
                $result = cvr_register_wrong_reset_code($pdo, $user);
                if ($result['blocked']) {
                    json_response(false,
                        'That code is incorrect. You have entered ' . config('cvr.reset_otp_max_attempts') . ' wrong codes in a row, so for security this account cannot receive or use a password reset code for the next ' . config('cvr.reset_otp_block_hours') . ' hours.',
                        ['otpBlocked' => true, 'retrySeconds' => $result['secondsLeft']],
                        429
                    );
                }
                json_response(false,
                    'That code is incorrect. You have ' . $result['attemptsLeft'] . ' attempt' . ($result['attemptsLeft'] === 1 ? '' : 's') . ' left before password reset is locked for ' . config('cvr.reset_otp_block_hours') . ' hours.',
                    ['attemptsLeft' => $result['attemptsLeft']],
                    401
                );
            }
            json_response(false, 'That code is incorrect. Please check your email and try again.', [], 401);
        }

        if (!$user['reset_expires'] || strtotime($user['reset_expires']) < time()) {
            json_response(false, 'That code has expired. Please request a new one.', [], 401);
        }

        cvr_clear_reset_code_attempts($pdo, $user);

        json_response(true, 'Code verified. You can now set a new password.');
    }

    /** Ported from api/auth/verify.php */
    public function verify(Request $request)
    {
        $token = $request->query('token') !== null ? trim($request->query('token')) : '';

        $redirectToLogin = function (string $status): never {
            throw new HttpResponseException(redirect(config('cvr.site_url') . '/pages/login.html?verify=' . urlencode($status)));
        };

        if ($token === '') {
            $redirectToLogin('missing');
        }

        $pdo = get_db_connection();
        $stmt = $pdo->prepare('SELECT id, is_verified, verification_expires, first_name, last_name, email FROM users WHERE verification_token = ?');
        $stmt->execute([$token]);
        $user = $stmt->fetch();

        if (!$user) {
            $redirectToLogin('invalid');
        }

        if ((int) $user['is_verified'] === 1) {
            $redirectToLogin('already');
        }

        if ($user['verification_expires'] && strtotime($user['verification_expires']) < time()) {
            $redirectToLogin('expired');
        }

        $update = $pdo->prepare('UPDATE users SET is_verified = 1, verification_token = NULL, verification_expires = NULL WHERE id = ?');
        $update->execute([$user['id']]);

        try {
            $guestName = trim($user['first_name'] . ' ' . $user['last_name']) ?: $user['email'];
            $pdo->prepare(
                "INSERT INTO notifications (user_id, audience, title, message, link)
                 SELECT id, 'staff', ?, ?, ? FROM users WHERE role IN ('admin', 'event_manager')"
            )->execute([
                'New guest account',
                $guestName . ' (' . $user['email'] . ') just verified their account.',
                'users.html',
            ]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            if ($e instanceof HttpResponseException) { throw $e; }
            error_log('verify: failed to create admin/staff notification: ' . $e->getMessage());
        }

        $redirectToLogin('success');
    }
}
