<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\View;

/** Serves the site's pages at their original URLs (/pages/login.html, /pages/admin/dashboard.html, ...). */
class PageController extends Controller
{
    public function show(string $page)
    {
        abort_unless(View::exists('pages.' . $page), 404);

        return response()->view('pages.' . $page);
    }

    public function admin(string $page)
    {
        abort_unless(View::exists('pages.admin.' . $page), 404);

        return response()->view('pages.admin.' . $page);
    }
}
