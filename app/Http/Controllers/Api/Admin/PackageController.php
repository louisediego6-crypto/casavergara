<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class PackageController extends Controller
{
    /** Ported from api/admin/package-photo.php */
    public function photo(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        if (empty($_FILES['photo']) || !is_array($_FILES['photo'])) {
            json_response(false, 'No file was uploaded.', [], 422);
        }

        $file = $_FILES['photo'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            json_response(false, 'The file failed to upload. Please try again.', [], 422);
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            json_response(false, 'File must be smaller than 5 MB.', [], 422);
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
                json_response(false, 'That file type isn\'t allowed for security reasons. Please upload it as a photo, PDF, or document file instead.', [], 422);
            }
        }

        $ext = preg_replace('/[^a-z0-9]/', '', $lastExt) ?: 'bin';

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($file['tmp_name']) ?: 'application/octet-stream';

        $fileName = 'pkg_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $dir = cvr_path('uploads/packages');

        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            json_response(false, 'Could not create the upload folder.', [], 500);
        }

        if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $fileName)) {
            json_response(false, 'Could not save the uploaded file. Please try again.', [], 500);
        }

        $relativePath = 'uploads/packages/' . $fileName;

        json_response(true, 'File uploaded.', [
            'photoPath' => $relativePath,
            'photoUrl'  => config('cvr.site_url') . '/' . $relativePath,
            'mimeType'  => $detectedMime,
        ]);
    }

    /** Ported from api/admin/packages-delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $type = input_str($body, 'type');
        $id   = (int) ($body['id'] ?? 0);

        if (!in_array($type, ['room', 'event'], true)) {
            json_response(false, 'Package type must be "room" or "event".', [], 422);
        }
        if ($id <= 0) {
            json_response(false, 'A valid package is required.', [], 422);
        }

        $pdo = get_db_connection();
        $table = $type === 'room' ? 'room_packages' : 'event_packages';

        $stmt = $pdo->prepare("DELETE FROM {$table} WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) {
            json_response(false, 'That package could not be found.', [], 404);
        }

        json_response(true, 'Package deleted.');
    }

    /** Ported from api/admin/packages-list.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $pdo = get_db_connection();

        $roomRows = $pdo->query(
            'SELECT id, slug, title, tagline, description, price_per_night, capacity_min, capacity_max,
                    area_sqm, bed_setup, inclusions_json, addons_json, image_path,
                    standard_check_in, standard_check_out, availability_note, sort_order, is_active
             FROM room_packages ORDER BY sort_order ASC, id ASC'
        )->fetchAll();

        $eventRows = $pdo->query(
            'SELECT id, slug, name, price, included_pax, max_pax, extra_pax_rate, is_custom, image_path, inclusions_json, motifs_json, addons_json, sort_order, is_active
             FROM event_packages ORDER BY sort_order ASC, id ASC'
        )->fetchAll();

        $rooms = array_map(static function (array $r): array {
            return [
                'id' => (int) $r['id'],
                'slug' => $r['slug'],
                'title' => $r['title'],
                'tagline' => $r['tagline'],
                'description' => $r['description'],
                'pricePerNight' => (float) $r['price_per_night'],
                'capacityMin' => (int) $r['capacity_min'],
                'capacityMax' => (int) $r['capacity_max'],
                'areaSqm' => $r['area_sqm'] !== null ? (int) $r['area_sqm'] : null,
                'bed' => $r['bed_setup'],
                'inclusions' => json_decode((string) $r['inclusions_json'], true) ?: [],
                'addOns' => json_decode((string) $r['addons_json'], true) ?: [],
                'image' => $r['image_path'],
                'standardCheckIn' => $r['standard_check_in'],
                'standardCheckOut' => $r['standard_check_out'],
                'availabilityNote' => $r['availability_note'],
                'sortOrder' => (int) $r['sort_order'],
                'isActive' => (bool) $r['is_active'],
            ];
        }, $roomRows);

        $events = array_map(static function (array $e): array {
            return [
                'id' => (int) $e['id'],
                'slug' => $e['slug'],
                'name' => $e['name'],
                'price' => (float) $e['price'],
                'includedPax' => (int) $e['included_pax'],
                'maxPax' => $e['max_pax'] !== null ? (int) $e['max_pax'] : null,
                'extraPaxRate' => $e['extra_pax_rate'] !== null ? (float) $e['extra_pax_rate'] : null,
                'isCustom' => (bool) $e['is_custom'],
                'image' => $e['image_path'],
                'inclusions' => json_decode((string) $e['inclusions_json'], true) ?: [],
                'motifs' => json_decode((string) $e['motifs_json'], true) ?: [],
                'addOns' => json_decode((string) $e['addons_json'], true) ?: [],
                'sortOrder' => (int) $e['sort_order'],
                'isActive' => (bool) $e['is_active'],
            ];
        }, $eventRows);

        json_response(true, 'OK', ['rooms' => $rooms, 'events' => $events]);
    }

    /** Ported from api/admin/packages-reorder.php */
    public function reorder(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $type = input_str($body, 'type');
        $order = $body['order'] ?? null;

        if (!in_array($type, ['room', 'event'], true)) {
            json_response(false, 'Package type must be "room" or "event".', [], 422);
        }
        if (!is_array($order) || !count($order)) {
            json_response(false, 'An order list is required.', [], 422);
        }

        $ids = array_map('intval', $order);
        if (in_array(0, $ids, true) || count($ids) !== count(array_unique($ids))) {
            json_response(false, 'The order list must contain unique, valid package ids.', [], 422);
        }

        $table = $type === 'room' ? 'room_packages' : 'event_packages';
        $pdo = get_db_connection();

        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $check = $pdo->prepare("SELECT id FROM {$table} WHERE id IN ({$placeholders})");
        $check->execute($ids);
        $found = array_map('intval', array_column($check->fetchAll(), 'id'));
        if (count($found) !== count($ids)) {
            json_response(false, 'One or more packages in that order no longer exist. Refresh and try again.', [], 409);
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("UPDATE {$table} SET sort_order = ? WHERE id = ?");
            foreach ($ids as $index => $id) {
                $stmt->execute([($index + 1) * 10, $id]);
            }
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $pdo->rollBack();
            error_log('packages-reorder.php: ' . $e->getMessage());
            json_response(false, 'Could not save the new order. Please try again.', [], 500);
        }

        json_response(true, 'Order updated.');
    }

    /** Ported from api/admin/packages-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin', 'event_manager']);

        $body = get_json_body();
        $type = input_str($body, 'type');
        $id   = (int) ($body['id'] ?? 0);

        if (!in_array($type, ['room', 'event'], true)) {
            json_response(false, 'Package type must be "room" or "event".', [], 422);
        }

        $pdo = get_db_connection();

        $cv_slugify = function (string $text): string {
            $slug = strtolower(trim($text));
            $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
            $slug = trim($slug, '-');
            return $slug !== '' ? $slug : 'item-' . substr(md5((string) mt_rand()), 0, 6);
        };

        if ($type === 'room') {
            $title = input_str($body, 'title');
            if ($title === '') {
                json_response(false, 'Room title is required.', [], 422);
            }
            $slug = input_str($body, 'slug') ?: $cv_slugify($title);
            $tagline = input_str($body, 'tagline');
            $description = input_str($body, 'description');
            $pricePerNight = (float) ($body['pricePerNight'] ?? 0);
            $capacityMin = max(1, (int) ($body['capacityMin'] ?? 1));
            $capacityMax = max($capacityMin, (int) ($body['capacityMax'] ?? $capacityMin));
            $areaSqm = isset($body['areaSqm']) && $body['areaSqm'] !== '' ? (int) $body['areaSqm'] : null;
            $bed = input_str($body, 'bed');
            $inclusions = is_array($body['inclusions'] ?? null) ? array_values(array_filter(array_map('trim', $body['inclusions']))) : [];
            $addOns = is_array($body['addOns'] ?? null) ? $body['addOns'] : [];
            $image = input_str($body, 'image', '') ?: '../images/booking-photo-1.png';
            $checkIn = input_str($body, 'standardCheckIn', '15:00');
            $checkOut = input_str($body, 'standardCheckOut', 'Anytime (flexible)');
            $availabilityNote = input_str($body, 'availabilityNote');
            $sortOrder = (int) ($body['sortOrder'] ?? 0);
            $isActive = !empty($body['isActive']) ? 1 : 0;

            if ($pricePerNight < 0) {
                json_response(false, 'Price per night cannot be negative.', [], 422);
            }

            $params = [
                $slug, $title, $tagline, $description, $pricePerNight, $capacityMin, $capacityMax,
                $areaSqm, $bed, json_encode($inclusions), json_encode($addOns), $image,
                $checkIn, $checkOut, $availabilityNote, $sortOrder, $isActive,
            ];

            if ($id > 0) {
                $exists = $pdo->prepare('SELECT id FROM room_packages WHERE id = ?');
                $exists->execute([$id]);
                if (!$exists->fetch()) {
                    json_response(false, 'That room package could not be found.', [], 404);
                }
                $stmt = $pdo->prepare(
                    'UPDATE room_packages SET slug=?, title=?, tagline=?, description=?, price_per_night=?, capacity_min=?, capacity_max=?,
                     area_sqm=?, bed_setup=?, inclusions_json=?, addons_json=?, image_path=?, standard_check_in=?, standard_check_out=?,
                     availability_note=?, sort_order=?, is_active=? WHERE id=?'
                );
                $stmt->execute([...$params, $id]);
                json_response(true, 'Room package updated.', ['id' => $id]);
            }

            $stmt = $pdo->prepare(
                'INSERT INTO room_packages (slug, title, tagline, description, price_per_night, capacity_min, capacity_max,
                 area_sqm, bed_setup, inclusions_json, addons_json, image_path, standard_check_in, standard_check_out,
                 availability_note, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
            );
            $stmt->execute($params);
            json_response(true, 'Room package added.', ['id' => (int) $pdo->lastInsertId()]);
        }

        $name = input_str($body, 'name');
        if ($name === '') {
            json_response(false, 'Event package name is required.', [], 422);
        }
        $slug = input_str($body, 'slug') ?: $cv_slugify($name);
        $price = (float) ($body['price'] ?? 0);
        $includedPax = max(0, (int) ($body['includedPax'] ?? 0));
        $isCustom = !empty($body['isCustom']) ? 1 : 0;
        $image = input_str($body, 'image');
        $image = $image !== '' ? $image : null;
        $inclusions = is_array($body['inclusions'] ?? null) ? array_values(array_filter(array_map('trim', $body['inclusions']))) : [];
        $motifs = is_array($body['motifs'] ?? null) ? $body['motifs'] : [];
        $addOns = is_array($body['addOns'] ?? null) ? $body['addOns'] : [];
        $sortOrder = (int) ($body['sortOrder'] ?? 0);
        $isActive = !empty($body['isActive']) ? 1 : 0;

        if ($price < 0) {
            json_response(false, 'Price cannot be negative.', [], 422);
        }

        $params = [$slug, $name, $price, $includedPax, $isCustom, $image, json_encode($inclusions), json_encode($motifs), json_encode($addOns), $sortOrder, $isActive];

        if ($id > 0) {
            $exists = $pdo->prepare('SELECT id FROM event_packages WHERE id = ?');
            $exists->execute([$id]);
            if (!$exists->fetch()) {
                json_response(false, 'That event package could not be found.', [], 404);
            }
            $stmt = $pdo->prepare(
                'UPDATE event_packages SET slug=?, name=?, price=?, included_pax=?, is_custom=?, image_path=?, inclusions_json=?, motifs_json=?, addons_json=?, sort_order=?, is_active=? WHERE id=?'
            );
            $stmt->execute([...$params, $id]);
            json_response(true, 'Event package updated.', ['id' => $id]);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO event_packages (slug, name, price, included_pax, is_custom, image_path, inclusions_json, motifs_json, addons_json, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
        );
        $stmt->execute($params);
        json_response(true, 'Event package added.', ['id' => (int) $pdo->lastInsertId()]);
    }
}
