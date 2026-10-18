<?php

function team_default_members(): array
{
    return [
        [
            'name' => 'Maria Vergara',
            'role' => 'Founder & CEO',
            'email' => 'maria.vergara@casavergararesort.com',
            'photo' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80',
            'bio' => 'Maria founded Casa Vergara in 2021 with a simple belief: guests should feel at home the moment they arrive. She still greets arrivals personally most weekends.',
            'facts' => "15+ years in hospitality leadership\nDrives our sustainability program\nHospitality Excellence awardee, 2023",
        ],
        [
            'name' => 'Carlos Rodriguez',
            'role' => 'General Manager',
            'email' => 'carlos.rodriguez@casavergararesort.com',
            'photo' => 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80',
            'bio' => 'Carlos keeps every corner of the resort running smoothly, from housekeeping standards to large event turnovers, without ever losing the warm welcome.',
            'facts' => "Oversees daily resort operations\nLeads a team of 120+ staff\nCertified Hotel Administrator",
        ],
        [
            'name' => 'Isabella Santos',
            'role' => 'Guest Relations',
            'email' => 'isabella.santos@casavergararesort.com',
            'photo' => 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=80',
            'bio' => 'Isabella is the person behind the little touches: the anniversary cake, the early check-in, the room with the better sunset view.',
            'facts' => "Handles VIP and event guests\nSpeaks English, Filipino and Spanish\n98% guest satisfaction rating",
        ],
        [
            'name' => 'David Chen',
            'role' => 'Executive Chef',
            'email' => 'david.chen@casavergararesort.com',
            'photo' => 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=900&q=80',
            'bio' => 'David builds our menus around what local farmers and fishers bring in that morning, blending Filipino flavors with modern technique.',
            'facts' => "Leads all resort dining outlets\nFarm-to-table sourcing advocate\nTrained in Singapore and Manila",
        ],
    ];
}

function ensure_team_members_ready(PDO $pdo): void
{
    try {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS team_members (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                role VARCHAR(150) NOT NULL,
                email VARCHAR(190) NOT NULL DEFAULT \'\',
                photo_url VARCHAR(500) NOT NULL DEFAULT \'\',
                bio TEXT NULL,
                facts TEXT NULL,
                sort_order INT NOT NULL DEFAULT 0,
                is_visible TINYINT(1) NOT NULL DEFAULT 1,
                updated_by INT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB'
        );

        try {
            $pdo->exec("ALTER TABLE team_members ADD COLUMN IF NOT EXISTS email VARCHAR(190) NOT NULL DEFAULT '' AFTER role");
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('ensure_team_members_ready: add email column: ' . $e->getMessage());
        }

        $count = (int) $pdo->query('SELECT COUNT(*) FROM team_members')->fetchColumn();
        if ($count > 0) {
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO team_members (name, role, email, photo_url, bio, facts, sort_order, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
        );
        $order = 1;
        foreach (team_default_members() as $member) {
            $stmt->execute([
                $member['name'],
                $member['role'],
                $member['email'] ?? '',
                $member['photo'],
                $member['bio'],
                $member['facts'],
                $order++,
            ]);
        }
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('ensure_team_members_ready: ' . $e->getMessage());
    }
}
