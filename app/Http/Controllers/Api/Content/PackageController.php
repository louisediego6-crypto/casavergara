<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class PackageController extends Controller
{
    /** Ported from api/content/packages.php */
    public function index(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();

        try {
            $roomRows = $pdo->query(
                'SELECT slug, title, tagline, description, price_per_night, capacity_min, capacity_max,
                        area_sqm, bed_setup, inclusions_json, addons_json, image_path,
                        standard_check_in, standard_check_out, availability_note
                 FROM room_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
            $eventRows = $pdo->query(
                'SELECT slug, name, price, included_pax, max_pax, extra_pax_rate, is_custom, is_flat_rate, double_rate_on_24hr, image_path, inclusions_json, motifs_json, addons_json
                 FROM event_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

            error_log('content/packages.php: ' . $e->getMessage());
            json_response(false, 'Package catalog is not available yet.', [], 200);
        }

        $rooms = array_map(static function (array $r): array {
            return [
                'id' => $r['slug'],
                'title' => $r['title'],
                'tagline' => $r['tagline'],
                'description' => $r['description'],
                'pricePerNight' => (float) $r['price_per_night'],
                'capacity' => ['min' => (int) $r['capacity_min'], 'max' => (int) $r['capacity_max']],
                'areaSqm' => $r['area_sqm'] !== null ? (int) $r['area_sqm'] : null,
                'bed' => $r['bed_setup'],
                'inclusions' => json_decode((string) $r['inclusions_json'], true) ?: [],
                'addOns' => json_decode((string) $r['addons_json'], true) ?: [],
                'image' => $r['image_path'],
                'standardCheckIn' => $r['standard_check_in'],
                'standardCheckOut' => $r['standard_check_out'],
                'availabilityNote' => $r['availability_note'],
            ];
        }, $roomRows);

        $events = array_map(static function (array $e): array {
            return [
                'id' => $e['slug'],
                'name' => $e['name'],
                'price' => (float) $e['price'],
                'pax' => (int) $e['included_pax'],
                'maxPax' => $e['max_pax'] !== null ? (int) $e['max_pax'] : null,
                'extraPaxRate' => $e['extra_pax_rate'] !== null ? (float) $e['extra_pax_rate'] : null,
                'isCustom' => (bool) $e['is_custom'],
                'isFlatRate' => (bool) $e['is_flat_rate'],
                'doubleRateOn24hr' => (bool) $e['double_rate_on_24hr'],
                'image' => $e['image_path'],
                'inclusions' => json_decode((string) $e['inclusions_json'], true) ?: [],
                'motifs' => json_decode((string) $e['motifs_json'], true) ?: [],
                'addOns' => json_decode((string) $e['addons_json'], true) ?: [],
            ];
        }, $eventRows);

        json_response(true, 'OK', ['rooms' => $rooms, 'events' => $events]);
    }
}
