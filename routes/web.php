<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\ReminderJobController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/pages/landing.html');
Route::redirect('/index.html', '/pages/landing.html');

Route::get('/pages/{page}.html', [PageController::class, 'show'])->where('page', '[A-Za-z0-9-]+');
Route::get('/pages/admin/{page}.html', [PageController::class, 'admin'])->where('page', '[A-Za-z0-9-]+');

// Cron-by-URL reminder jobs (protected by ?key=...). The CLI equivalents are `php artisan reminders:checkin|checkout`.
Route::get('/scripts/send-checkin-reminders', [ReminderJobController::class, 'checkin']);
Route::get('/scripts/send-checkout-reminders', [ReminderJobController::class, 'checkout']);

Route::get('/_diag', function () {
    $out = [];
    $key = (string) config('app.key');
    $raw = str_starts_with($key, 'base64:') ? base64_decode(substr($key, 7), true) : $key;
    $out['app_key_set']   = $key !== '';
    $out['app_key_bytes'] = $raw === false ? 'invalid base64' : strlen($raw); // must be 32
    $out['session_driver'] = config('session.driver');
    $dir = storage_path('framework/sessions');
    $out['sessions_dir_exists']   = is_dir($dir);
    $out['sessions_dir_writable'] = is_writable($dir);
    try { app('encrypter'); $out['encrypter'] = 'ok'; }
    catch (\Throwable $e) { $out['encrypter'] = $e->getMessage(); }
    try { \Illuminate\Support\Facades\DB::connection()->getPdo(); $out['db'] = 'ok'; }
    catch (\Throwable $e) { $out['db'] = $e->getMessage(); }
    try { $out['users_table'] = \Illuminate\Support\Facades\Schema::hasTable('users') ? 'exists' : 'MISSING'; }
    catch (\Throwable $e) { $out['users_table'] = $e->getMessage(); }
    return response()->json($out);
});
