<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class SettingsController extends Controller
{
    /** Ported from api/admin/settings-get.php */
    public function show(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();

        $row = $pdo->query('SELECT resort_name, email, phone, address, updated_at FROM resort_settings WHERE id = 1')->fetch();

        if (!$row) {

            $pdo->exec("INSERT INTO resort_settings (id, resort_name, email, phone, address) VALUES (1, 'Casa Vergara Resort', 'info@casavergara.com', '0970 323 6544', 'Purok 3, Barangay Langkiwa, Biñan, Laguna')");
            $row = $pdo->query('SELECT resort_name, email, phone, address, updated_at FROM resort_settings WHERE id = 1')->fetch();
        }

        $qr = get_payment_qr($pdo);

        json_response(true, 'OK', [
            'settings' => [
                'paymentQrUrl' => $qr['url'],
                'paymentQrLabel' => $qr['label'],
                'resortName' => $row['resort_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'address' => $row['address'],
                'updatedAt' => $row['updated_at'],
            ],
        ]);
    }

    /** Ported from api/admin/settings-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $resortName = input_str($body, 'resortName');
        $email = input_str($body, 'email');
        $phone = input_str($body, 'phone');
        $address = input_str($body, 'address');

        $hasQrLabel = array_key_exists('paymentQrLabel', $body);
        $paymentQrLabel = input_str($body, 'paymentQrLabel');

        $errors = [];
        if ($resortName === '') $errors[] = 'Resort name is required.';
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
        if ($phone === '') $errors[] = 'Phone number is required.';
        if ($address === '') $errors[] = 'Address is required.';
        if (mb_strlen($paymentQrLabel) > 150) $errors[] = 'The payment QR caption must be 150 characters or fewer.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare(
            'INSERT INTO resort_settings (id, resort_name, email, phone, address) VALUES (1, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE resort_name = VALUES(resort_name), email = VALUES(email), phone = VALUES(phone), address = VALUES(address)'
        );
        $stmt->execute([$resortName, $email, $phone, $address]);

        if ($hasQrLabel) {
            try {
                $pdo->prepare('UPDATE resort_settings SET payment_qr_label = ? WHERE id = 1')->execute([$paymentQrLabel]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('settings-save.php: could not save payment_qr_label (run database/migration_payment_qr.sql): ' . $e->getMessage());
                json_response(false, 'Resort info saved, but the QR caption could not be saved. Please run database/migration_payment_qr.sql.', [], 500);
            }
        }

        json_response(true, 'Resort information saved.', [
            'settings' => [
                'resortName' => $resortName,
                'email' => $email,
                'phone' => $phone,
                'address' => $address,
            ],
        ]);
    }
}
