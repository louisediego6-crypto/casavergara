<?php

use App\Http\Middleware\CvrStartSession;
use App\Http\Middleware\NotifyAdminOfChanges;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull;
use Illuminate\Foundation\Http\Middleware\TrimStrings;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        then: function () {
            // Public pages: stateless, no session needed (they were plain .html files).
            Route::group([], base_path('routes/web.php'));

            // JSON API: same URLs as the old api/*.php scripts, minus the ".php".
            Route::middleware('cvr.api')->prefix('api')->group(base_path('routes/cvr_api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // The old endpoints read raw request values; keep them untouched.
        $middleware->remove([TrimStrings::class, ConvertEmptyStringsToNull::class]);

        // Cookie + session handling for the JSON API (no CSRF token, like the original).
        $middleware->group('cvr.api', [
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            CvrStartSession::class,
            NotifyAdminOfChanges::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Early exits from json_response() are not errors.
        $exceptions->dontReport(HttpResponseException::class);

        // Keep the {success, message} JSON shape for anything unexpected on /api.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (!$request->is('api/*') || $e instanceof HttpResponseException) {
                return null;
            }
            if ($e instanceof NotFoundHttpException) {
                return response()->json(['success' => false, 'message' => 'Not found.'], 404);
            }
            $status = $e instanceof HttpExceptionInterface ? $e->getStatusCode() : 500;
            return response()->json([
                'success' => false,
                'message' => $status === 405 ? 'Invalid request method.' : 'Something went wrong on the server. Please try again.',
            ], $status);
        });
    })->create();
