<?php

function cv_room_packages(): array
{
    return [
        [
            'title' => 'Standard Room', 'tagline' => 'Good for 2 pax — the resort\'s walk-in rate',
            'pricePerNight' => 1400, 'capacity' => '1–2 guests', 'areaSqm' => null, 'bed' => '1 Double Bed',
            'inclusions' => ['Access to adult & kiddie pools', 'Parking space', 'Fan/AC room'],
            'checkIn' => 'flexible', 'checkOut' => 'flexible',
            'addOns' => ['Public day-use entrance, morning — PHP 150/pax', 'Public day-use entrance, night — PHP 180/pax', 'Table (6 pax) — PHP 400', 'Long table — PHP 600', 'Small cottage — PHP 750', 'Big cottage — PHP 1,000', 'Gazebo — PHP 1,200', 'Function hall (public rate) — PHP 1,500', 'Videoke — PHP 500', 'Public room rate (10 hrs) — PHP 1,500', 'Gas stove use per 6 hrs — PHP 400', 'Extended stay per additional hour — PHP 1,000'],
        ],
        [
            'title' => 'Deluxe Room', 'tagline' => 'Private pool villa with garden views',
            'pricePerNight' => 6500, 'capacity' => '1–4 guests', 'areaSqm' => 85, 'bed' => '1 King Bed',
            'inclusions' => ['Private pool', 'Garden view', 'Butler service', 'Daily housekeeping', 'Wi-Fi'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Late checkout until 2:00 PM — PHP 800', 'In-villa breakfast setup — PHP 1,200', 'Celebration room décor — PHP 1,500'],
        ],
        [
            'title' => 'Single Room', 'tagline' => 'Cozy stay for solo travelers',
            'pricePerNight' => 1800, 'capacity' => '1 guest', 'areaSqm' => 28, 'bed' => '1 Single Bed',
            'inclusions' => ['Workspace', 'Smart TV', 'Coffee/tea', 'Wi-Fi', 'Daily housekeeping'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Late checkout until 1:00 PM — PHP 400', 'Premium bedding upgrade — PHP 350'],
        ],
        [
            'title' => 'Ocean View Suite', 'tagline' => 'Panoramic ocean views with balcony',
            'pricePerNight' => 3800, 'capacity' => '1–3 guests', 'areaSqm' => 65, 'bed' => '1 King or 2 Twin',
            'inclusions' => ['Ocean view', 'Balcony', 'Mini bar', 'Rain shower', 'Wi-Fi'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Balcony breakfast for two — PHP 950', 'Anniversary décor package — PHP 1,200'],
        ],
        [
            'title' => 'Beach Bungalow', 'tagline' => 'Steps from the sand',
            'pricePerNight' => 3200, 'capacity' => '1–2 guests', 'areaSqm' => 50, 'bed' => '1 Queen Bed',
            'inclusions' => ['Beach access', 'Private patio', 'Breakfast included', 'Wi-Fi'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Beach picnic setup — PHP 1,100', 'Private bonfire arrangement — PHP 2,000'],
        ],
        [
            'title' => 'Garden View Room', 'tagline' => 'Tranquil garden outlook',
            'pricePerNight' => 2500, 'capacity' => '1–2 guests', 'areaSqm' => 42, 'bed' => '1 Queen Bed',
            'inclusions' => ['Garden view', 'Smart TV', 'Coffee maker', 'Wi-Fi'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Garden afternoon tea — PHP 650'],
        ],
        [
            'title' => 'Family Room', 'tagline' => 'Two bedrooms and living space',
            'pricePerNight' => 4800, 'capacity' => '2–6 guests', 'areaSqm' => 95, 'bed' => '1 King + 2 Twin',
            'inclusions' => ['2 bathrooms', 'Living area', 'Kitchenette', 'Wi-Fi', 'Sofa bed optional'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Late checkout until 2:00 PM — PHP 900', 'Baby crib & amenities — PHP 500', 'Kids welcome setup — PHP 750'],
        ],
        [
            'title' => 'Honeymoon Suite', 'tagline' => 'Jacuzzi and ocean outlook',
            'pricePerNight' => 5500, 'capacity' => '1–2 guests', 'areaSqm' => 75, 'bed' => '1 King Bed',
            'inclusions' => ['Jacuzzi', 'Ocean view', 'Butler on call', 'Sparkling welcome', 'Wi-Fi'],
            'checkIn' => '15:00', 'checkOut' => 'Anytime (flexible)',
            'addOns' => ['Rose petal turndown — PHP 800', 'Couples spa voucher — PHP 2,500'],
        ],
    ];
}

function cv_event_packages(): array
{
    return [
        [
            'name' => 'Private Venue – Morning (8:00 AM–5:00 PM)', 'price' => 10000, 'pax' => 50,
            'inclusions' => ['Exclusive private use of the resort', '1 adult pool & 1 kiddie pool', 'Function hall, tables & chairs, videoke', '2 family rooms, kitchen space, parking space', 'Add PHP 1,000 per person for 51–100 pax', 'Extended stay: PHP 1,000/hr'],
            'motifs' => ['Tropical Fiesta', 'Simple & Elegant White', 'Rustic Nature', 'Custom motif'],
            'addOnsNote' => 'Flat rate (not scaled by duration selected). Optional: sounds & lights system (PHP 7,500), gas stove use per 6 hrs (PHP 400).',
        ],
        [
            'name' => 'Private Venue – Night (7:00 PM–5:00 AM)', 'price' => 12000, 'pax' => 50,
            'inclusions' => ['Exclusive private use of the resort', '1 adult pool & 1 kiddie pool', 'Function hall, tables & chairs, videoke', '2 family rooms, kitchen space, parking space', 'Add PHP 1,000 per person for 51–100 pax', 'Extended stay: PHP 1,000/hr'],
            'motifs' => ['Tropical Fiesta', 'Simple & Elegant White', 'Rustic Nature', 'Custom motif'],
            'addOnsNote' => 'Flat rate (not scaled by duration selected). Optional: sounds & lights system (PHP 7,500), gas stove use per 6 hrs (PHP 400).',
        ],
        [
            'name' => 'Private Venue – Whole Day (2 Sessions)', 'price' => 17000, 'pax' => 50,
            'inclusions' => ['Both morning and night sessions', '1 adult pool & 1 kiddie pool', 'Function hall, tables & chairs, videoke', '2 family rooms, kitchen space, parking space', 'Add PHP 1,000 per person for 51–100 pax', 'Extended stay: PHP 1,000/hr'],
            'motifs' => ['Tropical Fiesta', 'Simple & Elegant White', 'Rustic Nature', 'Custom motif'],
            'addOnsNote' => 'Flat rate (not scaled by duration selected). Optional: sounds & lights system (PHP 7,500), gas stove use per 6 hrs (PHP 400).',
        ],
        [
            'name' => 'Wedding Package', 'price' => 20000, 'pax' => 100,
            'inclusions' => ['10 hours + 3 hours preparation time', 'Exclusive private use of the resort — pools, function hall, tables & chairs', 'Extended stay: PHP 1,500/hr'],
            'motifs' => ['Rustic Garden Romance', 'Classic White & Gold', 'Blush Garden Elegance', 'Tropical Beach Elegance', 'Custom motif'],
            'addOnsNote' => 'Flat rate. Optional: sounds & lights system (PHP 7,500), gowns rental (ask front desk for current pricing).',
        ],
        [
            'name' => 'Debut Package', 'price' => 17000, 'pax' => 100,
            'inclusions' => ['10 hours + 3 hours preparation time', 'Exclusive private use of the resort — pools, function hall, tables & chairs', 'Extended stay: PHP 1,500/hr'],
            'motifs' => ['Enchanted Garden', 'Hollywood Glam', 'Pastel Dream', 'Modern Minimalist White', 'Custom motif'],
            'addOnsNote' => 'Flat rate. Optional: sounds & lights system (PHP 7,500), gowns rental (ask front desk for current pricing).',
        ],
        [
            'name' => 'Ayesha Package', 'price' => 7500, 'pax' => 50,
            'inclusions' => ['2 panels theme backdrop with lights', 'Celebrant chair', 'Lighted age number', 'Name cut-out', 'Theme character', 'Happy birthday LED', 'Entrance balloons', 'Cake table & souvenir stand', 'Table centerpieces', 'Tables and chairs with cover (50 pax)'],
            'motifs' => ['Pastel Rainbow', 'Princess Pink & Gold', 'Unicorn Dream', 'Royal Blue & Gold', 'Custom motif'],
            'addOnsNote' => 'Optional add-ons: uplighting (PHP 1,500), stage spotlights (PHP 3,000), basic/extra sound (PHP 2,000–500), extra backdrop panel (PHP 1,500), premium balloon arch (PHP 2,000), photo corner (PHP 1,200), enhanced cake table décor (PHP 800).',
        ],
        [
            'name' => 'Anica Package', 'price' => 10000, 'pax' => 50,
            'inclusions' => ['3 panels theme backdrop with lights', 'Upgraded decorations', 'Celebrant chair', 'Lighted age number', 'Happy birthday LED', 'Name cut-out', 'Theme character', 'Celebrant name standee', 'Basic ceiling balloons', 'Entrance arch balloon with garland', 'Cake stand & souvenir stand', 'Buffet table setup & centerpieces', 'Tables and chairs with cover (50 pax)'],
            'motifs' => ['Elegant Gold & White', 'Garden Blush', 'Midnight Glam', 'Tropical Fiesta', 'Custom motif'],
            'addOnsNote' => 'Optional add-ons: fairy light ceiling drape (PHP 2,500), LED dance floor accent (PHP 3,500), premium sound + DJ mixer (PHP 5,000), premium ceiling balloon install (PHP 2,500), additional theme character (PHP 1,800), catering coordination (PHP 2,000).',
        ],
        [
            'name' => 'Amarah Package', 'price' => 5000, 'pax' => 30,
            'inclusions' => ['1 panel basic theme backdrop', 'Celebrant chair', 'Age number standee', 'Name cut-out', 'Theme character', 'Cake stand', 'Entrance balloon standee', 'Table centerpieces', 'Tables and chairs cover (30 pax)'],
            'motifs' => ['Soft Pastel', 'Classic Red & Gold', 'Minimal White & Greenery', 'Custom motif'],
            'addOnsNote' => 'Optional add-ons: uplighting (PHP 1,500), basic sound (PHP 2,000), extra backdrop panel (PHP 2,000), balloon entrance upgrade (PHP 1,500), dessert table styling (PHP 1,000).',
        ],
        [
            'name' => 'Custom Package', 'price' => 3500, 'pax' => 100,
            'inclusions' => ['Venue setup crew & basic tables/chairs', 'On-site event coordinator', 'Post-event cleanup', 'Build-your-own: pick any lighting, sound, motif, and decor add-ons'],
            'motifs' => ['Any motif from the other packages, or fully custom'],
            'addOnsNote' => 'Starts at PHP 3,500 base; guest freely mixes lighting (PHP 1,500–3,500), sound (PHP 500–5,000), backdrop/decor extras (PHP 700–2,000 each), and catering add-ons (PHP 250/pax buffet, PHP 2,000 coordination) on top.',
        ],
    ];
}

function cv_venue_rates(): array
{
    return [
        'private' => [
            'pax' => 50,
            'rates' => [
                'Morning (8:00 AM–5:00 PM)' => 10000,
                'Night (7:00 PM–5:00 AM)' => 12000,
                '2 Sessions (morning + night)' => 17000,
            ],
            'notes' => [
                'Add PHP 1,000 per person for 51–100 pax (up to 100 pax total)',
                'Extended per hour: PHP 1,000',
            ],
        ],
        'public' => [
            'rates' => [
                'Morning (per head)' => 150,
                'Night (per head)' => 180,
            ],
        ],
        'standardRoom' => [
            'pax' => 2,
            'rates' => [
                '3 hours' => 250,
                '12 hours' => 800,
                '24 hours' => 1400,
            ],
        ],
        'cottagesAndRentals' => [
            'Table (6 pax)' => 400,
            'Long table' => 600,
            'Small cottage' => 750,
            'Big cottage' => 1000,
            'Gazebo' => 1200,
            'Function hall' => 1500,
            'Videoke' => 500,
            'Room (10 hours)' => 1500,
        ],
        'wedding' => ['price' => 20000, 'pax' => 100, 'duration' => '10 hours + 3 hours preparation', 'extendedPerHour' => 1500],
        'debut' => ['price' => 17000, 'pax' => 100, 'duration' => '10 hours + 3 hours preparation', 'extendedPerHour' => 1500],
        'availableInResort' => [
            'Sounds & lights' => 'PHP 7,500',
            'Venue decorations' => 'price varies — ask front desk (see the Ayesha/Anica/Amarah decoration packages below for standard options)',
            'Gowns rental' => 'price varies — ask front desk',
        ],
        'amenities' => [
            '1 adult pool', '1 kiddie pool', 'Function hall for all occasions', 'Tables & chairs',
            'Videoke', '2 family rooms', 'Kitchen space (gas stove — add PHP 400 every 6 hrs; refrigerator)', 'Parking space',
        ],
        'policies' => [
            'First come, first served',
            'No down payment, no reservation',
            'All bookings are non-refundable',
            'A deposit of PHP 1,000–2,000 is required for damages/losses, returned if nothing is damaged or lost',
            'Electric appliances/gadgets (speakers, lights, photobooths, etc.) incur a power consumption charge of PHP 500–2,500 depending on size and number of items',
        ],
    ];
}

function cv_render_venue_rates_block(): string
{
    $v = cv_venue_rates();
    $out = "PRIVATE VENUE RENTAL (good for {$v['private']['pax']} pax):\n";
    foreach ($v['private']['rates'] as $label => $price) {
        $out .= '- ' . $label . ': PHP ' . number_format($price) . "\n";
    }
    foreach ($v['private']['notes'] as $note) {
        $out .= '  Note: ' . $note . "\n";
    }
    $out .= "\nPUBLIC DAY-USE ENTRY (per head):\n";
    foreach ($v['public']['rates'] as $label => $price) {
        $out .= '- ' . $label . ': PHP ' . number_format($price) . "\n";
    }
    $out .= "\nSTANDARD ROOM (good for {$v['standardRoom']['pax']} pax):\n";
    foreach ($v['standardRoom']['rates'] as $label => $price) {
        $out .= '- ' . $label . ': PHP ' . number_format($price) . "\n";
    }
    $out .= "\nCOTTAGES & À LA CARTE RENTALS:\n";
    foreach ($v['cottagesAndRentals'] as $label => $price) {
        $out .= '- ' . $label . ': PHP ' . number_format($price) . "\n";
    }
    $out .= "\nWEDDING PACKAGE: PHP " . number_format($v['wedding']['price']) . ', good for ' . $v['wedding']['pax'] . ' pax, ' . $v['wedding']['duration'] . '. Extended per hour: PHP ' . number_format($v['wedding']['extendedPerHour']) . ".\n";
    $out .= "DEBUT PACKAGE: PHP " . number_format($v['debut']['price']) . ', good for ' . $v['debut']['pax'] . ' pax, ' . $v['debut']['duration'] . '. Extended per hour: PHP ' . number_format($v['debut']['extendedPerHour']) . ".\n";
    $out .= "\nALSO AVAILABLE IN RESORT:\n";
    foreach ($v['availableInResort'] as $label => $price) {
        $out .= '- ' . $label . ': ' . $price . "\n";
    }
    $out .= "\nRESORT AMENITIES:\n- " . implode(", ", $v['amenities']) . ".\n";
    $out .= "\nBOOKING POLICIES:\n";
    foreach ($v['policies'] as $p) {
        $out .= '- ' . $p . "\n";
    }
    $out .= "\nNote: the Standard Room, Private Venue (Morning/Night/Whole Day), Wedding, and Debut rates are bookable directly through the website's reservation form. Public day-use entry and cottage/table rentals are offered as add-ons when booking a Standard Room.\n";
    return $out;
}

function cv_render_room_packages_block(): string
{
    $out = '';
    foreach (cv_room_packages() as $r) {
        $out .= '- ' . $r['title'] . ' ("' . $r['tagline'] . '"): PHP ' . number_format($r['pricePerNight'], 2) . ' per night, '
            . $r['capacity'] . ', ' . $r['areaSqm'] . ' m², ' . $r['bed'] . '. Includes: ' . implode(', ', $r['inclusions']) . '. '
            . 'Check-in ' . $r['checkIn'] . ', check-out ' . $r['checkOut'] . '. '
            . 'Optional add-ons: ' . implode('; ', $r['addOns']) . ".\n";
    }
    return $out;
}

function cv_render_event_packages_block(): string
{
    $out = '';
    foreach (cv_event_packages() as $e) {
        $out .= '- ' . $e['name'] . ': PHP ' . number_format($e['price'], 2) . ' base, includes ' . $e['pax'] . ' pax. Inclusions: '
            . implode(', ', $e['inclusions']) . '. Motif choices: ' . implode(', ', $e['motifs']) . '. '
            . $e['addOnsNote'] . "\n";
    }
    return $out;
}
