<?php

/*
|--------------------------------------------------------------------------
| Casa Vergara settings
|--------------------------------------------------------------------------
| Everything that used to live in config/config.php, config/mail.php and
| config/secrets.php of the plain-PHP version. Values come from .env.
*/

return [

    // Public address of the site (no trailing slash). Used to build avatar / upload URLs and e-mail links.
    'site_url'  => rtrim((string) env('CVR_SITE_URL', env('APP_URL', 'http://localhost:8000')), '/'),
    'site_name' => env('CVR_SITE_NAME', 'Casa Vergara'),

    // Sign-up / verification / password reset
    'verification_token_ttl_hours'  => 24,
    'verification_code_ttl_minutes' => 15,
    'reset_token_ttl_hours'         => 2,
    'reset_code_ttl_minutes'        => 15,

    // "Remember me" / saved accounts
    'remember_me_days'     => 30,
    'remember_cookie_name' => 'cvr_remember',

    // Login lock-out
    'login_max_attempts'    => 5,
    'login_lockout_minutes' => 15,

    // Password-reset OTP lock-out
    'reset_otp_max_attempts' => 5,
    'reset_otp_block_hours'  => 24,

    'max_accounts_per_phone' => 1,

    // Mailbox probe on registration (needs outbound port 25 - leave off on most hosts)
    'email_smtp_probe_enabled' => (bool) env('CVR_EMAIL_SMTP_PROBE_ENABLED', env('EMAIL_SMTP_PROBE_ENABLED', false)),
    'email_smtp_probe_timeout' => 2,
    'email_smtp_probe_helo'    => 'localhost',
    'email_smtp_probe_from'    => 'postmaster@localhost',

    // Live chat GIF picker (https://developers.giphy.com). Empty = GIF search disabled.
    'giphy_api_key' => env('CVR_GIPHY_API_KEY', ''),

    // Reminder jobs
    'checkin_reminder_days_before'   => 1,
    'checkin_reminder_secret'        => env('CVR_CHECKIN_REMINDER_SECRET', 'change-me-cvr-reminder-key'),
    'checkout_reminder_hours_before' => 1,
    'checkout_reminder_secret'       => env('CVR_CHECKOUT_REMINDER_SECRET', 'change-me-cvr-checkout-reminder-key'),

    // E-mail (sent through Gmail SMTP - see MAIL_* in .env and config/mail.php)
    'mail_from_name'     => env('CVR_MAIL_FROM_NAME', 'Casa Vergara'),
    'admin_notify_email' => env('CVR_ADMIN_NOTIFY_EMAIL', 'casavergararesort@gmail.com'),
    'admin_notify_name'  => env('CVR_ADMIN_NOTIFY_NAME', 'Casa Vergara Admin'),
    'mail_from_email'    => env('CVR_MAIL_FROM_EMAIL', env('MAIL_FROM_ADDRESS', env('CVR_ADMIN_NOTIFY_EMAIL', 'casavergararesort@gmail.com'))),
    'mail_debug'         => false,
    'mail_logo_cid'      => 'casa_vergara_logo',
    'mail_logo_url'      => env('CVR_MAIL_LOGO_URL', ''),

    // Email the admin about every user activity (register, login, booking, review...). false = off.
    'activity_emails_enabled' => filter_var(env('CVR_ACTIVITY_EMAILS', true), FILTER_VALIDATE_BOOLEAN),

    // AI assistant (Google AI Studio / Gemini)
    'ai_api_key' => env('CVR_AI_API_KEY', ''),
    'ai_api_url' => env('CVR_AI_API_URL', 'https://generativelanguage.googleapis.com/v1beta/models/'),
    'ai_model'   => env('CVR_AI_MODEL', 'gemini-3.8-flash'),
];
