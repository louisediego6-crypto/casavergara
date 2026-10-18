<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class AiSettingsController extends Controller
{
    /** Ported from api/admin/ai-settings-get.php */
    public function show(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $pdo = get_db_connection();

        $row = $pdo->query('SELECT display_name, tagline, greeting, persona_instructions, updated_at FROM ai_assistant_settings WHERE id = 1')->fetch();

        if (!$row) {

            $defaultGreeting = "Hi! I'm C.A.S.A. — your Client Assistance & Service Associate. Ask me anything about rooms, rates, bookings or payments.";
            $stmt = $pdo->prepare('INSERT INTO ai_assistant_settings (id, display_name, tagline, greeting) VALUES (1, ?, ?, ?)');
            $stmt->execute(['C.A.S.A.', 'Client Assistance & Service Associate', $defaultGreeting]);
            $row = $pdo->query('SELECT display_name, tagline, greeting, persona_instructions, updated_at FROM ai_assistant_settings WHERE id = 1')->fetch();
        }

        json_response(true, 'OK', [
            'settings' => [
                'displayName' => $row['display_name'],
                'tagline' => $row['tagline'],
                'greeting' => $row['greeting'],
                'personaInstructions' => $row['persona_instructions'] ?? '',
                'updatedAt' => $row['updated_at'],
            ],
        ]);
    }

    /** Ported from api/admin/ai-settings-save.php */
    public function save(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_role(['admin']);

        $body = get_json_body();
        $displayName = input_str($body, 'displayName');
        $tagline = input_str($body, 'tagline');
        $greeting = input_str($body, 'greeting');
        $personaInstructions = input_str($body, 'personaInstructions');

        $errors = [];
        if ($displayName === '') $errors[] = 'Assistant name is required.';
        if (mb_strlen($displayName) > 50) $errors[] = 'Assistant name must be 50 characters or fewer.';
        if (mb_strlen($tagline) > 150) $errors[] = 'Tagline must be 150 characters or fewer.';
        if ($greeting === '') $errors[] = 'Greeting message is required.';
        if (mb_strlen($greeting) > 500) $errors[] = 'Greeting message must be 500 characters or fewer.';
        if (mb_strlen($personaInstructions) > 4000) $errors[] = 'Extra instructions must be 4000 characters or fewer.';

        if ($errors) {
            json_response(false, implode(' ', $errors), [], 422);
        }

        $pdo = get_db_connection();

        $stmt = $pdo->prepare(
            'INSERT INTO ai_assistant_settings (id, display_name, tagline, greeting, persona_instructions) VALUES (1, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), tagline = VALUES(tagline), greeting = VALUES(greeting), persona_instructions = VALUES(persona_instructions)'
        );
        $stmt->execute([$displayName, $tagline, $greeting, $personaInstructions === '' ? null : $personaInstructions]);

        json_response(true, 'Assistant settings saved.', [
            'settings' => [
                'displayName' => $displayName,
                'tagline' => $tagline,
                'greeting' => $greeting,
                'personaInstructions' => $personaInstructions,
            ],
        ]);
    }
}
