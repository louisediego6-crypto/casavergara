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
