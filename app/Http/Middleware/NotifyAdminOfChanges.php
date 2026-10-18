<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Emails the admin Gmail whenever staff change something in the system
 * (policies/terms, settings, packages, site content, users, payments ...).
 * Runs AFTER the response is sent (terminate), so it never slows the page down.
 * Turn off with CVR_ACTIVITY_EMAILS=false.
 */
class NotifyAdminOfChanges
{
    /** path (after api/admin/) => title shown in the email subject */
    private const LABELS = [
        'legal-save'            => 'System policy updated (Terms / Privacy Policy)',
        'settings-save'         => 'System settings changed',
        'ai-settings-save'      => 'AI assistant settings changed',
        'packages-save'         => 'Package / room saved',
        'packages-delete'       => 'Package / room deleted',
        'packages-reorder'      => 'Packages reordered',
        'package-photo'         => 'Package photo changed',
        'content-save'          => 'Site content changed',
        'content-photo'         => 'Site content photo changed',
        'site-text-save'        => 'Website text changed',
        'site-text-reset'       => 'Website text reset to default',
        'site-image-upload'     => 'Website image changed',
        'site-image-reset'      => 'Website image reset to default',
        'faqs-save'             => 'FAQ saved',
        'faqs-delete'           => 'FAQ deleted',
        'team-save'             => 'Team member saved',
        'team-delete'           => 'Team member deleted',
        'team-photo'            => 'Team photo changed',
        'users-save'            => 'User account created',
        'users-update'          => 'User account updated',
        'users-delete'          => 'User account deleted',
        'reservations-delete'   => 'Reservation deleted',
        'payments-update'       => 'Payment verification updated',
        'payments-delete'       => 'Payment record deleted',
        'payment-qr-upload'     => 'Payment QR code changed',
        'payment-qr-delete'     => 'Payment QR code removed',
        'reviews-update'        => 'Review updated',
        'reviews-delete'        => 'Review deleted',
        'messages-compose'      => 'Admin sent a message',
        'messages-reply'        => 'Admin replied to a message',
        'send-checkin-reminders'  => 'Check-in reminders sent',
        'send-checkout-reminders' => 'Check-out reminders sent',
        'update-password'       => 'Admin password changed',
        'upload-avatar'         => 'Admin profile photo changed',
    ];

    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        try {
            if (!config('cvr.activity_emails_enabled', true)) return $response;
            if ($request->method() === 'GET' || $request->method() === 'OPTIONS') return $response;

            $path = (string) preg_replace('#^api/admin/#', '', $request->path());
            if ($path === $request->path()) return $response;            // not an admin endpoint
            if (preg_match('/-(list|get)$/', $path)) return $response;   // read-only

            $json = json_decode((string) $response->getContent(), true);
            if (!is_array($json) || empty($json['success'])) return $response; // failed -> nothing changed

            $request->attributes->set('cvr.admin_change', [
                'title'   => self::LABELS[$path] ?? ('System change: ' . str_replace('-', ' ', $path)),
                'actor'   => trim((string) session('first_name') . ' ' . (string) session('last_name')),
                'email'   => (string) session('email'),
                'role'    => (string) session('role'),
                'fields'  => $this->summarise($request),
                'result'  => (string) ($json['message'] ?? ''),
            ]);
        } catch (\Throwable $e) {
            error_log('NotifyAdminOfChanges: ' . $e->getMessage());
        }

        return $response;
    }

    public function terminate(Request $request, $response): void
    {
        $info = $request->attributes->get('cvr.admin_change');
        if (!$info) return;

        $details = [
            'Changed by' => trim($info['actor'] . ($info['email'] !== '' ? ' <' . $info['email'] . '>' : '')),
            'Role'       => $info['role'],
            'Result'     => $info['result'],
        ];
        foreach ($info['fields'] as $label => $value) {
            $details[$label] = $value;
        }

        notify_admin_activity($info['title'], $details);
    }

    /** Safe, short summary of what was submitted (no passwords, files or huge text). */
    private function summarise(Request $request): array
    {
        $body = json_decode($request->getContent(), true);
        if (!is_array($body)) $body = $request->except(['password', 'current_password']);

        $out = [];
        foreach ($body as $key => $value) {
            if (!is_string($key) || preg_match('/pass|token|secret|key|base64|image|photo|file|avatar|data/i', $key)) continue;
            if (is_bool($value)) $value = $value ? 'Yes' : 'No';
            if (!is_scalar($value) || $value === '') continue;
            $value = (string) $value;
            $value = mb_strlen($value) > 300 ? mb_substr($value, 0, 300) . '…' : $value;
            $out[ucfirst(preg_replace('/(?<!^)[A-Z]/', ' $0', (string) $key))] = $value;
            if (count($out) >= 12) break;
        }
        return $out;
    }
}
