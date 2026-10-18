<?php

namespace App\Http\Controllers\Api\Content;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class AiAssistantController extends Controller
{
    /** Ported from api/content/ai-assist.php */
    public function ask(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $input   = json_decode($request->getContent(), true) ?: [];
        $message = trim((string) ($input['message'] ?? ''));
        $history = is_array($input['history'] ?? null) ? $input['history'] : [];

        if ($message === '') {
            json_response(false, 'Please type a question first.', [], 422);
        }
        if (mb_strlen($message) > 1000) {
            $message = mb_substr($message, 0, 1000);
        }

        $apiKey = (string) config('cvr.ai_api_key');
        if ($apiKey === '' || $apiKey === 'PASTE_YOUR_GEMINI_API_KEY_HERE') {
            json_response(false, 'The AI assistant is not configured yet. Please contact the resort directly.', [], 503);
        }

        $pdo = get_db_connection();
        try {
            $resort = $pdo->query('SELECT resort_name, email, phone, address FROM resort_settings WHERE id = 1')->fetch();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $resort = null;
        }
        $resortName  = $resort['resort_name'] ?? config('cvr.site_name');
        $resortBlock = "RESORT CONTACT INFO:\n"
            . '- Name: ' . $resortName . "\n"
            . '- Phone: ' . ($resort['phone'] ?? '+63 970 323 6544') . "\n"
            . '- Email: ' . ($resort['email'] ?? 'info@casavergara.com') . "\n"
            . '- Address: ' . ($resort['address'] ?? '') . "\n";

        $faqRows = $pdo->query('SELECT question, answer, category FROM faqs WHERE is_active = 1 ORDER BY category ASC, sort_order ASC, id ASC')->fetchAll();
        $faqBlock = '';
        foreach ($faqRows as $row) {
            $faqBlock .= '- [' . ($row['category'] ?: 'General') . '] Q: ' . $row['question'] . "\n  A: " . $row['answer'] . "\n";
        }
        if ($faqBlock === '') {
            $faqBlock = "(No FAQ entries have been published yet.)\n";
        }

        try {
            $roomDbRows = $pdo->query(
                'SELECT title, tagline, price_per_night, capacity_min, capacity_max, area_sqm, bed_setup,
                        inclusions_json, addons_json, standard_check_in, standard_check_out
                 FROM room_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $roomDbRows = null;
        }
        if ($roomDbRows !== null && count($roomDbRows) > 0) {
            $roomBlock = '';
            foreach ($roomDbRows as $r) {
                $inclusions = json_decode((string) $r['inclusions_json'], true) ?: [];
                $addOns = json_decode((string) $r['addons_json'], true) ?: [];
                $addOnStrs = array_map(static fn($a) => ($a['label'] ?? '') . ' — PHP ' . number_format((float) ($a['price'] ?? 0), 2), $addOns);
                $roomBlock .= '- ' . $r['title'] . ($r['tagline'] ? ' ("' . $r['tagline'] . '")' : '') . ': PHP ' . number_format((float) $r['price_per_night'], 2) . ' per night, '
                    . $r['capacity_min'] . '–' . $r['capacity_max'] . ' guests'
                    . ($r['area_sqm'] ? ', ' . $r['area_sqm'] . ' m²' : '') . ($r['bed_setup'] ? ', ' . $r['bed_setup'] : '') . '. '
                    . 'Includes: ' . implode(', ', $inclusions) . '. '
                    . 'Check-in ' . $r['standard_check_in'] . ', check-out ' . $r['standard_check_out'] . '. '
                    . 'Optional add-ons: ' . (empty($addOnStrs) ? 'none' : implode('; ', $addOnStrs)) . ".\n";
            }
        } else {
            $roomBlock = cv_render_room_packages_block();
        }

        try {
            $eventDbRows = $pdo->query(
                'SELECT name, price, included_pax, inclusions_json, motifs_json, addons_json
                 FROM event_packages WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
            )->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $eventDbRows = null;
        }
        if ($eventDbRows !== null && count($eventDbRows) > 0) {
            $eventBlock = '';
            foreach ($eventDbRows as $e) {
                $inclusions = json_decode((string) $e['inclusions_json'], true) ?: [];
                $motifs = json_decode((string) $e['motifs_json'], true) ?: [];
                $addOns = json_decode((string) $e['addons_json'], true) ?: [];
                $motifStrs = array_map(static fn($m) => $m['label'] ?? '', $motifs);
                $addOnStrs = array_map(static fn($a) => ($a['label'] ?? '') . ' — PHP ' . number_format((float) ($a['price'] ?? 0), 2), $addOns);
                $eventBlock .= '- ' . $e['name'] . ': PHP ' . number_format((float) $e['price'], 2) . ' base, includes ' . $e['included_pax'] . ' pax. '
                    . 'Inclusions: ' . implode(', ', $inclusions) . '. '
                    . 'Motif choices: ' . implode(', ', $motifStrs) . '. '
                    . 'Optional add-ons: ' . (empty($addOnStrs) ? 'none' : implode('; ', $addOnStrs)) . ".\n";
            }
        } else {
            $eventBlock = cv_render_event_packages_block();
        }

        $highlightsBlock = "- Swimming Pools: 1 adult pool and 1 kiddie pool.\n"
            . "- Function hall for all occasions, tables & chairs, videoke.\n"
            . "- 2 family rooms, kitchen space (gas stove, refrigerator), parking space.\n"
            . "- Event Spaces: perfect for birthdays, reunions, weddings, debuts, and small gatherings.\n"
            . "- 24/7 security and professional staff on-site (Trust & Safety).\n";

        $venueRatesBlock = cv_render_venue_rates_block();

        try {
            $reviewStats = $pdo->query("SELECT COUNT(*) AS n, AVG(rating) AS avg_rating FROM reviews WHERE status = 'visible'")->fetch();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $reviewStats = null;
        }
        $reviewsBlock = ($reviewStats && (int) $reviewStats['n'] > 0)
            ? '- ' . (int) $reviewStats['n'] . ' visible guest reviews, average rating ' . number_format((float) $reviewStats['avg_rating'], 1) . " / 5.\n"
            : "(No published guest reviews yet.)\n";

        try {
            $termsRows = $pdo->query("SELECT booking_type, content FROM terms_and_conditions WHERE is_active = 1")->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $termsRows = [];
        }
        $termsBlock = '';
        foreach ($termsRows as $t) {

            $snippet = mb_substr(strip_tags((string) $t['content']), 0, 1500);
            $termsBlock .= '--- ' . ucfirst($t['booking_type']) . ' terms (summarized below; do not dump verbatim) ---' . "\n" . $snippet . "\n\n";
        }
        if ($termsBlock === '') {
            $termsBlock = "(No terms/privacy content published yet.)\n";
        }

        try {
            ensure_team_members_ready($pdo);
            $teamRows = $pdo->query('SELECT name, role, bio FROM team_members WHERE is_visible = 1 ORDER BY sort_order ASC, id ASC')->fetchAll();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $teamRows = [];
        }
        $teamBlock = '';
        foreach ($teamRows as $t) {
            $teamBlock .= '- ' . $t['name'] . ', ' . $t['role'] . ': ' . $t['bio'] . "\n";
        }
        if ($teamBlock === '') {
            $teamBlock = "(No team profiles published yet.)\n";
        }

        try {
            $settingsRow = $pdo->query('SELECT display_name, tagline, greeting, persona_instructions FROM ai_assistant_settings WHERE id = 1')->fetch();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $settingsRow = null;
        }
        $assistantName    = $settingsRow['display_name'] ?? 'C.A.S.A.';
        $assistantTagline = $settingsRow['tagline'] ?? 'Client Assistance & Service Associate';
        $personaExtra     = trim((string) ($settingsRow['persona_instructions'] ?? ''));

        $system = "You are " . $assistantName . " (" . $assistantTagline . "), the official virtual assistant for " . $resortName . ", a resort in Binan, Laguna, Philippines. You are the resort's pricing and booking expert — you know every room type, every event package, every add-on, and every rate exactly, and you should answer specific pricing questions with real numbers, not vague ranges.\n"
            . "For anything about the resort itself — rooms, rates, event packages, bookings, payments, amenities, policies, motifs/themes, add-ons, check-in/out, location, staff, reviews, or terms/privacy — answer using the WEBSITE KNOWLEDGE below; it reflects the resort's actual live content and takes priority over anything else you know. Combine facts across sections when useful — e.g. add up a package's base price plus any add-ons the guest mentions, or pair a motif choice with the package it belongs to — rather than only pulling from one section at a time.\n"
            . "You can also help with everything else a helpful, knowledgeable assistant would: general travel tips, things to do nearby, packing advice, weather-appropriate suggestions, translations, simple calculations, or general questions unrelated to the resort. Use your own knowledge for these, and be clear when something is a general suggestion rather than official resort policy.\n"
            . "If a resort-specific detail truly isn't covered below (e.g. real-time date availability, an exact policy, or a price not listed), say so plainly and point the guest to the Contact page or the front desk (" . ($resort['phone'] ?? '+63 970 323 6544') . ") rather than guessing.\n"
            . "When summarizing the terms/privacy sections, paraphrase in your own words — never quote them at length.\n"
            . "Keep replies concise and friendly, plain-text (no markdown headings or tables), long enough to fully answer the question but without padding. Use PHP peso amounts exactly as written below, and show your addition when a guest asks for a total (base package + add-ons).\n\n"
            . $resortBlock . "\n"
            . "SITE HIGHLIGHTS / AMENITIES:\n" . $highlightsBlock . "\n"
            . "ROOM TYPES & PRICING (per night, from the live booking page):\n" . $roomBlock . "\n"
            . "EVENT DECORATION PACKAGES & PRICING (from the live booking page — Ayesha/Anica/Amarah/Custom):\n" . $eventBlock . "\n"
            . "VENUE RENTAL, DAY-USE & CELEBRATION RATES (private/public entry, standard room hourly rates, cottages, wedding/debut — phone/walk-in booking only, not yet on the online reservation form):\n" . $venueRatesBlock . "\n"
            . "GUEST REVIEWS:\n" . $reviewsBlock . "\n"
            . "FAQ KNOWLEDGE:\n" . $faqBlock . "\n"
            . "TERMS & PRIVACY (summarize, don't quote at length):\n" . $termsBlock
            . "OUR TEAM:\n" . $teamBlock;

        if ($personaExtra !== '') {
            $system .= "\nADDITIONAL INSTRUCTIONS FROM THE RESORT ADMIN (follow these too):\n" . $personaExtra . "\n";
        }

        $contents = [];
        foreach (array_slice($history, -20) as $turn) {
            $role = ($turn['role'] ?? '') === 'assistant' ? 'model' : 'user';
            $text = trim((string) ($turn['content'] ?? ''));
            if ($text !== '') {
                $contents[] = ['role' => $role, 'parts' => [['text' => mb_substr($text, 0, 1000)]]];
            }
        }
        $contents[] = ['role' => 'user', 'parts' => [['text' => $message]]];

        $url = config('cvr.ai_api_url') . rawurlencode(config('cvr.ai_model')) . ':generateContent?key=' . rawurlencode($apiKey);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 45,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'system_instruction' => ['parts' => [['text' => $system]]],
                'contents'           => $contents,
                'generationConfig'   => [
                    'maxOutputTokens'  => 2048,

                    'thinkingConfig'   => ['thinkingLevel' => 'high'],
                ],
            ]),
        ]);
        $raw    = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($raw === false) {
            json_response(false, 'Could not reach the AI service right now. Please try again.' . ($err ? '' : ''), [], 502);
        }

        $body = json_decode($raw, true) ?: [];

        if ($status === 429) {
            json_response(false, 'The assistant is busy right now — please wait a moment and try again.', [], 429);
        }
        if ($status < 200 || $status >= 300) {
            $msg = $body['error']['message'] ?? 'The assistant could not answer that right now.';
            json_response(false, $msg, [], 502);
        }

        $parts = $body['candidates'][0]['content']['parts'] ?? [];
        $reply = '';
        foreach ($parts as $p) {
            if (isset($p['text'])) {
                $reply .= $p['text'];
            }
        }
        $reply = trim($reply);
        if ($reply === '') {
            $reply = "I couldn't come up with an answer for that. Please reach our front desk at " . ($resort['phone'] ?? '+63 970 323 6544') . " and we'll help you out.";
        }

        json_response(true, 'OK', ['reply' => $reply]);
    }

    /** Ported from api/content/ai-settings.php */
    public function settings(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();
        try {
            $row = $pdo->query('SELECT display_name, tagline, greeting FROM ai_assistant_settings WHERE id = 1')->fetch();
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            $row = null;
        }

        $defaults = [
            'displayName' => 'C.A.S.A.',
            'tagline' => 'Client Assistance & Service Associate',
            'greeting' => "Hi! I'm C.A.S.A. — your Client Assistance & Service Associate. Ask me anything about rooms, rates, bookings or payments.",
        ];

        json_response(true, 'OK', [
            'settings' => $row ? [
                'displayName' => $row['display_name'],
                'tagline' => $row['tagline'],
                'greeting' => $row['greeting'],
            ] : $defaults,
        ]);
    }
}
