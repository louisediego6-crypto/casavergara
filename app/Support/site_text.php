<?php

const SITE_TEXT_FIELDS = [

    'footer_tagline' => [
        'label' => 'Footer tagline',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'textarea',
        'default' => 'Experience luxury and tranquility at our exclusive pool resort. Where every moment becomes a cherished memory.',
    ],
    'footer_address' => [
        'label' => 'Address',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => 'Purok 3, Barangay Langkiwa, Biñan, Laguna',
    ],
    'footer_phone' => [
        'label' => 'Phone number',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => '0970 323 6544',
    ],
    'footer_email' => [
        'label' => 'Email address',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => 'starboxresortandhotel@yahoo.com',
    ],
    'footer_facebook_url' => [
        'label' => 'Facebook page link',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => 'https://www.facebook.com/profile.php?id=100064171831065',
    ],
    'footer_hours' => [
        'label' => 'Footer contact line',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => 'We will respond as soon as available',
    ],
    'footer_copyright_name' => [
        'label' => 'Resort name (copyright line)',
        'group' => 'Global (Footer)',
        'page' => 'components/footer.html',
        'type' => 'text',
        'default' => 'Casa Vergara Resort',
    ],

    'landing_hero_kicker' => [
        'label' => 'Hero kicker (small text above heading)',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'text',
        'default' => 'Casa Vergara Resort',
    ],
    'landing_hero_title_line1' => [
        'label' => 'Hero heading — line 1',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'text',
        'default' => 'Your Next',
    ],
    'landing_hero_title_highlight' => [
        'label' => 'Hero heading — highlighted line',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'text',
        'default' => 'Coastal Escape',
    ],
    'landing_hero_title_line2' => [
        'label' => 'Hero heading — line 3',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'text',
        'default' => 'Awaits',
    ],
    'landing_hero_description' => [
        'label' => 'Hero description',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'textarea',
        'default' => 'Relax and unwind at Casa Vergara Resort. Enjoy comfortable rooms, refreshing pools, and peaceful surroundings.',
    ],
    'landing_cta_heading' => [
        'label' => '"Ready for your dream vacation" heading',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'text',
        'default' => 'Ready for Your Dream Vacation?',
    ],
    'landing_cta_text' => [
        'label' => 'Closing call-to-action text',
        'group' => 'Home Page',
        'page' => 'pages/landing.html',
        'type' => 'textarea',
        'default' => 'Book your stay today and experience luxury like never before — from sunrise pool days to unforgettable evening gatherings.',
    ],

    'about_hero_kicker' => [
        'label' => 'Hero kicker',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'text',
        'default' => 'About Casa Vergara',
    ],
    'about_hero_title' => [
        'label' => 'Hero heading',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'text',
        'default' => 'Where Luxury Meets Paradise',
    ],
    'about_hero_subtitle' => [
        'label' => 'Hero subheading',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'textarea',
        'default' => 'A family-run resort in Biñan, Laguna — welcoming guests since 2021',
    ],
    'about_story_heading' => [
        'label' => '"Our Story" heading',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'text',
        'default' => 'Excellence Since 2021',
    ],
    'about_story_para1' => [
        'label' => '"Our Story" paragraph 1',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'textarea',
        'default' => 'Founded with a vision to create an oasis of luxury and tranquility, Casa Vergara Resort has become a premier destination for travelers seeking the extraordinary.',
    ],
    'about_story_para2' => [
        'label' => '"Our Story" paragraph 2',
        'group' => 'About Page',
        'page' => 'pages/about.html',
        'type' => 'textarea',
        'default' => 'Our resort combines timeless elegance with modern comfort, offering guests an unforgettable experience in a breathtaking tropical setting.',
    ],

    'contact_hero_kicker' => [
        'label' => 'Hero kicker',
        'group' => 'Contact Page',
        'page' => 'pages/contact.html',
        'type' => 'text',
        'default' => 'Get in touch',
    ],
    'contact_hero_title' => [
        'label' => 'Hero heading',
        'group' => 'Contact Page',
        'page' => 'pages/contact.html',
        'type' => 'text',
        'default' => "We're here to help",
    ],

    'faq_hero_kicker' => [
        'label' => 'Hero kicker',
        'group' => 'FAQ Page',
        'page' => 'pages/faq.html',
        'type' => 'text',
        'default' => 'Help center',
    ],
    'faq_hero_title' => [
        'label' => 'Hero heading',
        'group' => 'FAQ Page',
        'page' => 'pages/faq.html',
        'type' => 'text',
        'default' => 'Frequently asked questions',
    ],
];

function site_text_default(string $key): ?string
{
    return SITE_TEXT_FIELDS[$key]['default'] ?? null;
}

function get_site_text(PDO $pdo): array
{
    $overrides = [];
    try {
        foreach ($pdo->query('SELECT text_key, text_value FROM site_text') as $row) {
            $overrides[$row['text_key']] = $row['text_value'];
        }
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }

        error_log('get_site_text(): site_text table unavailable: ' . $e->getMessage());
    }

    $result = [];
    foreach (SITE_TEXT_FIELDS as $key => $meta) {
        $result[$key] = $overrides[$key] ?? $meta['default'];
    }
    $hours = (string) ($result['footer_hours'] ?? '');
    if (preg_match('/24\\s*\\/?\\s*7|24\\s*hours|anytime|round[- ]the[- ]clock/i', $hours)) {
        $result['footer_hours'] = SITE_TEXT_FIELDS['footer_hours']['default'];
    }
    return $result;
}
