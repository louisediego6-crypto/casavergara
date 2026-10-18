<?php

const SITE_IMAGE_SLOTS = [
    'landing_hero' => [
        'label' => 'Homepage hero photo',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-1.png',
    ],
    'landing_room_deluxe' => [
        'label' => 'Homepage "Deluxe Room" card photo',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-1.png',
    ],
    'landing_room_single' => [
        'label' => 'Homepage "Single Room" card photo',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-2.png',
    ],
    'landing_room_family' => [
        'label' => 'Homepage "Family Room" card photo',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-3.png',
    ],
    'landing_mosaic_1' => [
        'label' => 'Homepage gallery photo 1',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-1.png',
    ],
    'landing_mosaic_2' => [
        'label' => 'Homepage gallery photo 2',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-2.png',
    ],
    'landing_mosaic_3' => [
        'label' => 'Homepage gallery photo 3',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-3.png',
    ],
    'landing_mosaic_4' => [
        'label' => 'Homepage gallery photo 4',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-4.png',
    ],
    'landing_cta_panel' => [
        'label' => 'Homepage "Join Our Story" panel photo',
        'group' => 'Landing Page',
        'page' => 'pages/landing.html',
        'default' => 'images/booking-photo-2.png',
    ],
    'about_grid_1' => [
        'label' => 'About page photo 1 (lobby)',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'default' => 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
    ],
    'about_grid_2' => [
        'label' => 'About page photo 2 (pool)',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'default' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    ],
    'about_grid_3' => [
        'label' => 'About page photo 3 (garden and grounds)',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'default' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
    ],
    'about_grid_4' => [
        'label' => 'About page photo 4 (dining pavilion)',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'default' => 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    ],
    'about_cta_panel' => [
        'label' => 'About page "Join Our Story" panel photo',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'default' => 'images/booking-photo-1.png',
    ],
];

function site_image_default_url(string $slotKey): ?string
{
    if (!isset(SITE_IMAGE_SLOTS[$slotKey])) return null;
    $default = SITE_IMAGE_SLOTS[$slotKey]['default'];
    if (str_starts_with($default, 'http://') || str_starts_with($default, 'https://')) {
        return $default;
    }
    return config('cvr.site_url') . '/' . $default;
}

function get_site_images(PDO $pdo): array
{
    $overrides = [];
    try {
        foreach ($pdo->query('SELECT slot_key, image_path FROM site_images') as $row) {
            $overrides[$row['slot_key']] = $row['image_path'];
        }
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

        error_log('get_site_images(): site_images table unavailable: ' . $e->getMessage());
    }

    $result = [];
    foreach (SITE_IMAGE_SLOTS as $slotKey => $meta) {
        if (!empty($overrides[$slotKey])) {
            $path = $overrides[$slotKey];
            $result[$slotKey] = (str_starts_with($path, 'http://') || str_starts_with($path, 'https://'))
                ? $path
                : config('cvr.site_url') . '/' . $path;
        } else {
            $result[$slotKey] = site_image_default_url($slotKey);
        }
    }
    return $result;
}
