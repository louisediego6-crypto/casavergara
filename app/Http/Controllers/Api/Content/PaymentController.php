<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class PaymentController extends Controller
{
    /** Ported from api/content/payment-proof.php */
    public function submitProof(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $reservationId = trim((string) ($_POST['reservationId'] ?? ''));
        $customerName  = trim((string) ($_POST['customerName'] ?? ''));
        $email         = strtolower(trim((string) ($_POST['email'] ?? '')));
        $phone         = trim((string) ($_POST['phone'] ?? ''));
        $amount        = trim((string) ($_POST['amount'] ?? ''));
        $packageName   = trim((string) ($_POST['packageName'] ?? ''));
        $paymentMethod = trim((string) ($_POST['paymentMethod'] ?? 'QR / GCash'));

        if ($reservationId === '' || mb_strlen($reservationId) > 100) {
            json_response(false, 'A valid reservation ID is required.', [], 422);
        }
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_response(false, 'Please provide a valid email address.', [], 422);
        }

        if (empty($_FILES['proof']) || !is_array($_FILES['proof']) || $_FILES['proof']['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'Please attach your proof of payment.', [], 422);
        }

        $file = $_FILES['proof'];

        if ($file['size'] > 5 * 1024 * 1024) {
            json_response(false, 'File too large. Maximum size is 5MB.', [], 422);
        }

        $blockedExtensions = [
            'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh',
            'ps1', 'psm1', 'sh', 'bash', 'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar',
            'cgi', 'pl', 'py', 'jar', 'apk', 'app', 'dmg', 'html', 'htm', 'svg', 'swf', 'reg',
            'lnk', 'hta', 'asp', 'aspx', 'jsp',
        ];

        $originalName = (string) ($file['name'] ?? '');
        $nameParts = explode('.', $originalName);
        $lastExt = strtolower((string) array_pop($nameParts)) ?: 'bin';
        $allExtParts = array_map('strtolower', array_slice($nameParts, 1));
        $allExtParts[] = $lastExt;

        foreach ($allExtParts as $part) {
            if (in_array($part, $blockedExtensions, true)) {
                json_response(false, 'That file type isn\'t allowed for security reasons. Please upload your receipt as a photo, PDF, or document file instead.', [], 422);
            }
        }

        $ext = preg_replace('/[^a-z0-9]/', '', $lastExt) ?: 'bin';
        $safeReservation = preg_replace('/[^A-Za-z0-9_\-]/', '', $reservationId) ?: 'reservation';

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';
        $fileName = 'proof_' . $safeReservation . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
        $dir = cvr_path('uploads/payments');

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            json_response(false, 'Could not create the upload folder.', [], 500);
        }

        $absolutePath = $dir . '/' . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $absolutePath)) {
            json_response(false, 'Could not save the uploaded receipt. Please try again.', [], 500);
        }

        $relativePath = 'uploads/payments/' . $fileName;
        $publicUrl = config('cvr.site_url') . '/' . $relativePath;

        $proofId = null;
        $pdo = null;
        try {
            $pdo = get_db_connection();
            $pdo->exec(
                'CREATE TABLE IF NOT EXISTS payment_proofs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    reservation_ref VARCHAR(100) NOT NULL,
                    user_id INT NULL,
                    customer_name VARCHAR(150) NOT NULL DEFAULT \'\',
                    email VARCHAR(190) NOT NULL DEFAULT \'\',
                    phone VARCHAR(40) NULL,
                    package_name VARCHAR(190) NULL,
                    amount VARCHAR(50) NULL,
                    payment_method VARCHAR(60) NOT NULL DEFAULT \'QR / GCash\',
                    file_path VARCHAR(255) NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    file_type VARCHAR(60) NOT NULL,
                    file_size INT NOT NULL DEFAULT 0,
                    status ENUM(\'Waiting for Verification\', \'Approved\', \'Rejected\') NOT NULL DEFAULT \'Waiting for Verification\',
                    admin_note TEXT NULL,
                    reviewed_by INT NULL,
                    reviewed_at TIMESTAMP NULL DEFAULT NULL,
                    emailed_admin TINYINT(1) NOT NULL DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX (reservation_ref),
                    INDEX (status)
                ) ENGINE=InnoDB'
            );

            $userId = (int) (session('user_id') ?? 0);

            $stmt = $pdo->prepare(
                'INSERT INTO payment_proofs
                    (reservation_ref, user_id, customer_name, email, phone, package_name, amount, payment_method,
                     file_path, file_name, file_type, file_size)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $reservationId,
                $userId ?: null,
                $customerName,
                $email,
                $phone !== '' ? $phone : null,
                $packageName !== '' ? $packageName : null,
                $amount !== '' ? $amount : null,
                $paymentMethod !== '' ? $paymentMethod : 'QR / GCash',
                $relativePath,
                $file['name'],
                $mime,
                (int) $file['size'],
            ]);
            $proofId = (int) $pdo->lastInsertId();

            try {
                $pdo->prepare(
                    "INSERT INTO notifications (user_id, audience, title, message, link)
                     SELECT id, 'staff', ?, ?, ? FROM users WHERE role = 'admin'"
                )->execute([
                    'New proof of payment',
                    ($customerName !== '' ? $customerName : 'A guest') . ' submitted a receipt for ' . $reservationId
                        . ($amount !== '' ? ' (' . $amount . ')' : '') . '.',
                    'payments.html',
                ]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('payment-proof.php: notification failed: ' . $e->getMessage());
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

            error_log('payment-proof.php: DB save failed: ' . $e->getMessage());
        }

        $rows = '
            <p><strong>Reservation ID:</strong> ' . htmlspecialchars($reservationId) . '</p>
            <p><strong>Guest:</strong> ' . htmlspecialchars($customerName !== '' ? $customerName : 'Not provided')
                . ($email !== '' ? ' &lt;' . htmlspecialchars($email) . '&gt;' : '') . '</p>'
            . ($phone !== '' ? '<p><strong>Phone:</strong> ' . htmlspecialchars($phone) . '</p>' : '')
            . ($packageName !== '' ? '<p><strong>Package:</strong> ' . htmlspecialchars($packageName) . '</p>' : '')
            . ($amount !== '' ? '<p><strong>Amount paid:</strong> ' . htmlspecialchars($amount) . '</p>' : '') . '
            <p><strong>Payment method:</strong> ' . htmlspecialchars($paymentMethod) . '</p>
            <p><strong>Receipt file:</strong> <a href="' . htmlspecialchars($publicUrl) . '">' . htmlspecialchars($fileName) . '</a> (also attached)</p>
            <p style="margin-top:20px;">Review and approve or reject it in the Admin Portal &rarr; Payment Verification.</p>
        ';

        $mailError = null;
        $sentToAdmin = send_app_email(
            config('cvr.admin_notify_email'),
            config('cvr.admin_notify_name'),
            '[Proof of Payment] ' . $reservationId . ($customerName !== '' ? ' — ' . $customerName : ''),
            build_email_html('New Proof of Payment Submitted', $rows),
            $mailError,
            $email !== '' ? $email : null,
            $customerName !== '' ? $customerName : null,
            [['path' => $absolutePath, 'name' => $fileName]]
        );

        if ($sentToAdmin && $proofId !== null && $pdo instanceof PDO) {
            try {
                $pdo->prepare('UPDATE payment_proofs SET emailed_admin = 1 WHERE id = ?')->execute([$proofId]);
            } catch (\Throwable $e) {
                if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
                error_log('payment-proof.php: emailed_admin flag failed: ' . $e->getMessage());
            }
        }

        if ($email !== '') {
            $guestError = null;
            send_app_email(
                $email,
                $customerName !== '' ? $customerName : 'Guest',
                'We received your proof of payment — Casa Vergara',
                build_email_html('Proof of Payment Received', '
                    <p>Hi ' . htmlspecialchars($customerName !== '' ? $customerName : 'there') . ',</p>
                    <p>Thanks! We received your receipt for reservation <strong>' . htmlspecialchars($reservationId) . '</strong>'
                    . ($amount !== '' ? ' (' . htmlspecialchars($amount) . ')' : '') . '.</p>
                    <p>Your booking status is now <strong>Waiting for Verification</strong>. Our staff will review the payment and
                    email you again once it is approved.</p>
                '),
                $guestError
            );
        }

        json_response(true, 'Proof of payment submitted. Our staff will verify it shortly.', [
            'id' => $proofId,
            'fileUrl' => $publicUrl,
            'filePath' => $relativePath,
            'fileName' => $fileName,
            'emailedAdmin' => $sentToAdmin,
            'adminEmailWarning' => $sentToAdmin ? null : $mailError,
        ]);
    }

    /** Ported from api/content/payment-qr.php */
    public function qr(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $qr = ['path' => null, 'label' => '', 'url' => null];

        try {
            $qr = get_payment_qr(get_db_connection());
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('payment-qr.php: ' . $e->getMessage());
        }

        json_response(true, 'OK', [
            'paymentQr' => [
                'url'        => $qr['url'],
                'label'      => $qr['label'],
                'configured' => $qr['url'] !== null,
            ],
        ]);
    }
}
