<?php

namespace App\Http\Middleware;

use Illuminate\Session\Middleware\StartSession;

/**
 * Laravel session middleware that supports the old session_write_close() behaviour:
 * long-polling endpoints call cvr_release_session() so that, when they finally finish,
 * they do not overwrite session changes made by other requests in the meantime.
 */
class CvrStartSession extends StartSession
{
    protected function saveSession($request)
    {
        if ($request->attributes->get('cvr.session_released')) {
            return;
        }

        parent::saveSession($request);
    }
}
