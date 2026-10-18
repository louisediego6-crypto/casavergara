<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class PaymentQrController extends Controller
{
    /** Ported from api/admin/payment-qr-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();

        try {
            $previous = $pdo->query('SELECT payment_qr_path FROM resort_settings WHERE id = 1')->fetchColumn();
            $pdo->exec("UPDATE resort_settings SET payment_qr_path = NULL, payment_qr_label = '' WHERE id = 1");
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('payment-qr-delete.php: ' . $e->getMessage());
            json_response(false, 'Could not remove the QR code. Please run database/migration_payment_qr.sql and try again.', [], 500);
        }

        if ($previous) {
            $previousAbsolute = cvr_path($previous);
            if (is_file($previousAbsolute)) {
                @unlink($previousAbsolute);
            }
        }

        json_response(true, 'Payment QR code removed.', ['paymentQr' => ['path' => null, 'url' => null, 'label' => '']]);
    }

    /** Ported from api/admin/payment-qr-upload.php */
    public function upload(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        if (empty($_FILES['qr']) || !is_array($_FILES['qr'])) {
            json_response(false, 'No QR image was uploaded.', [], 422);
        }

        $file = $_FILES['qr'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The QR image failed to upload. Please try again.', [], 422);
        }

        if ($file['size'] > 3 * 1024 * 1024) {
            json_response(false, 'QR image must be smaller than 3 MB.', [], 422);
        }

        $allowedMime = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ];

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($file['tmp_name']) ?: '';

        if (!isset($allowedMime[$detectedMime])) {
            json_response(false, 'QR image must be a JPG, PNG, or WEBP file.', [], 422);
        }

        $imageInfo = @getimagesize($file['tmp_name']);
        if ($imageInfo === false) {
            json_response(false, 'That file does not look like a valid image.', [], 422);
        }

        $label = trim((string) ($_POST['label'] ?? ''));
        if (mb_strlen($label) > 150) {
            json_response(false, 'The QR caption must be 150 characters or fewer.', [], 422);
        }

        $ext = $allowedMime[$detectedMime];
        $fileName = 'qr_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $qrDir = cvr_path('uploads/payments');

        if (!is_dir($qrDir) && !mkdir($qrDir, 0755, true) && !is_dir($qrDir)) {
            json_response(false, 'Could not prepare the upload folder.', [], 500);
        }

        if (!move_uploaded_file($file['tmp_name'], $qrDir . '/' . $fileName)) {
            json_response(false, 'Could not save the uploaded QR image. Please try again.', [], 500);
        }

        $relativePath = 'uploads/payments/' . $fileName;

        $pdo = get_db_connection();

        try {
            $previous = $pdo->query('SELECT payment_qr_path FROM resort_settings WHERE id = 1')->fetchColumn();

            $stmt = $pdo->prepare(
                'INSERT INTO resort_settings (id, payment_qr_path, payment_qr_label) VALUES (1, ?, ?)
                 ON DUPLICATE KEY UPDATE payment_qr_path = VALUES(payment_qr_path), payment_qr_label = VALUES(payment_qr_label)'
            );
            $stmt->execute([$relativePath, $label]);
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            @unlink($qrDir . '/' . $fileName);
            error_log('payment-qr-upload.php: ' . $e->getMessage());
            json_response(false, 'Could not save the QR code. Please run database/migration_payment_qr.sql and try again.', [], 500);
        }

        if ($previous && $previous !== $relativePath) {
            $previousAbsolute = cvr_path($previous);
            if (is_file($previousAbsolute)) {
                @unlink($previousAbsolute);
            }
        }

        json_response(true, 'Payment QR code updated.', [
            'paymentQr' => [
                'path'  => $relativePath,
                'url'   => config('cvr.site_url') . '/' . $relativePath,
                'label' => $label,
            ],
        ]);
    }
}
