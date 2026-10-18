<?php

const CVR_CHAT_PRESENCE_SECONDS = 45;
const CVR_CHAT_UNAVAILABLE_COPY = "Send us a message for reservation inquiries and concerns. Our team will respond as soon as available.";

const CVR_CHAT_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const CVR_CHAT_UPLOAD_DIR = 'uploads/chat';

const CVR_CHAT_IMAGE_EXT = [
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
];

const CVR_CHAT_FILE_EXT = [
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls' => 'application/vnd.ms-excel',
    'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt' => 'application/vnd.ms-powerpoint',
    'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt' => 'text/plain',
    'csv' => 'text/csv',
];

const CVR_CHAT_TOPICS = [
    'room_availability' => 'Room availability',
    'event_bookings' => 'Event bookings',
    'reservation_details' => 'Reservation details',
    'requested_changes' => 'Requested changes',
    'payment_verification' => 'Payment verification',
    'other' => 'Other inquiry',
];

function cvr_chat_ensure_tables(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $statements = [
        "CREATE TABLE IF NOT EXISTS live_chat_conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            reservation_id VARCHAR(40) DEFAULT NULL,
            topic VARCHAR(80) DEFAULT NULL,
            last_message_at DATETIME DEFAULT NULL,
            last_message_preview VARCHAR(255) DEFAULT NULL,
            last_sender_role ENUM('customer', 'staff') DEFAULT NULL,
            customer_unread INT NOT NULL DEFAULT 0,
            staff_unread INT NOT NULL DEFAULT 0,
            status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_chat_customer (customer_id),
            INDEX idx_chat_last (last_message_at)
        ) ENGINE=InnoDB",
        "CREATE TABLE IF NOT EXISTS live_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT NOT NULL,
            sender_id INT NOT NULL,
            sender_role ENUM('customer', 'staff') NOT NULL,
            sender_label VARCHAR(191) NOT NULL DEFAULT '',
            body TEXT NOT NULL,
            topic VARCHAR(80) DEFAULT NULL,
            reservation_id VARCHAR(40) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_chat_msg_conv (conversation_id, id)
        ) ENGINE=InnoDB",
        "CREATE TABLE IF NOT EXISTS live_chat_presence (
            user_id INT PRIMARY KEY,
            last_seen_at DATETIME NOT NULL,
            is_available TINYINT(1) NOT NULL DEFAULT 1
        ) ENGINE=InnoDB",
    ];

    try {
        foreach ($statements as $sql) {
            $pdo->exec($sql);
        }
        cvr_chat_ensure_columns($pdo);
        $ready = true;
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('cvr_chat_ensure_tables: ' . $e->getMessage());
        throw $e;
    }
}

/** Adds the attachment columns to older installs (safe to run repeatedly). */
function cvr_chat_ensure_columns(PDO $pdo): void
{
    $wanted = [
        'msg_type' => "VARCHAR(12) NOT NULL DEFAULT 'text'",
        'attachment_path' => 'VARCHAR(255) DEFAULT NULL',
        'attachment_name' => 'VARCHAR(255) DEFAULT NULL',
        'attachment_mime' => 'VARCHAR(120) DEFAULT NULL',
        'attachment_size' => 'INT UNSIGNED DEFAULT NULL',
        // Seen receipts + delete-for-me / delete-for-everyone
        'read_at' => 'DATETIME DEFAULT NULL',
        'deleted_for_customer' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'deleted_for_staff' => 'TINYINT(1) NOT NULL DEFAULT 0',
        'deleted_for_all' => 'TINYINT(1) NOT NULL DEFAULT 0',
    ];
    $existing = [];
    foreach ($pdo->query('SHOW COLUMNS FROM live_chat_messages') as $col) {
        $existing[$col['Field']] = true;
    }
    foreach ($wanted as $name => $definition) {
        if (!isset($existing[$name])) {
            $pdo->exec('ALTER TABLE live_chat_messages ADD COLUMN ' . $name . ' ' . $definition);
        }
    }
}

function cvr_chat_is_staff_role(?string $role): bool
{
    return in_array((string) $role, ['admin', 'event_manager'], true);
}

function cvr_chat_sender_label(array $session): string
{
    $first = trim((string) ($session['first_name'] ?? ''));
    $last = trim((string) ($session['last_name'] ?? ''));
    $name = trim($first . ' ' . $last);
    if ($name === '') {
        $name = (string) ($session['email'] ?? 'Guest');
    }

    return $name;
}

function cvr_chat_presence_snapshot(PDO $pdo): array
{
    cvr_chat_ensure_tables($pdo);

    $stmt = $pdo->prepare(
        "SELECT p.user_id, p.last_seen_at, u.first_name, u.last_name, u.role
         FROM live_chat_presence p
         JOIN users u ON u.id = p.user_id
         WHERE p.is_available = 1
           AND p.last_seen_at >= (NOW() - INTERVAL " . (int) CVR_CHAT_PRESENCE_SECONDS . " SECOND)
           AND u.role IN ('admin', 'event_manager')
           AND u.status = 'active'"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $agents = [];
    foreach ($rows as $row) {
        $name = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
        $agents[] = [
            'id' => (int) $row['user_id'],
            'name' => $name !== '' ? $name : 'Resort team',
            'role' => 'team',
        ];
    }

    return [
        'staffOnline' => count($agents) > 0,
        'onlineCount' => count($agents),
        'agents' => $agents,
        'unavailableMessage' => CVR_CHAT_UNAVAILABLE_COPY,
    ];
}

function cvr_chat_touch_presence(PDO $pdo, int $userId, bool $available = true): void
{
    cvr_chat_ensure_tables($pdo);
    $stmt = $pdo->prepare(
        'INSERT INTO live_chat_presence (user_id, last_seen_at, is_available)
         VALUES (?, NOW(), ?)
         ON DUPLICATE KEY UPDATE last_seen_at = NOW(), is_available = VALUES(is_available)'
    );
    $stmt->execute([$userId, $available ? 1 : 0]);
}

/**
 * Marks a guest as online. Called on every guest poll, so the write is throttled
 * to roughly once per 10 seconds unless the online/offline state actually changes.
 */
function cvr_chat_touch_customer_presence(PDO $pdo, int $userId, bool $available = true): void
{
    cvr_chat_ensure_tables($pdo);
    $stmt = $pdo->prepare(
        'INSERT INTO live_chat_presence (user_id, last_seen_at, is_available)
         VALUES (?, NOW(), ?)
         ON DUPLICATE KEY UPDATE
            last_seen_at = IF(is_available <> VALUES(is_available) OR last_seen_at < (NOW() - INTERVAL 10 SECOND), NOW(), last_seen_at),
            is_available = VALUES(is_available)'
    );
    $stmt->execute([$userId, $available ? 1 : 0]);
}

/** SQL fragment that adds the guest's presence to a query on live_chat_conversations c. */
const CVR_CHAT_CUSTOMER_PRESENCE_SELECT =
    ', p.is_available AS presence_available,
       IF(p.last_seen_at IS NULL, NULL, TIMESTAMPDIFF(SECOND, p.last_seen_at, NOW())) AS presence_ago';
const CVR_CHAT_CUSTOMER_PRESENCE_JOIN =
    ' LEFT JOIN live_chat_presence p ON p.user_id = c.customer_id';

function cvr_chat_find_conversation(PDO $pdo, int $customerId): ?array
{
    cvr_chat_ensure_tables($pdo);
    $stmt = $pdo->prepare('SELECT * FROM live_chat_conversations WHERE customer_id = ?');
    $stmt->execute([$customerId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function cvr_chat_get_or_create_conversation(PDO $pdo, int $customerId): array
{
    $row = cvr_chat_find_conversation($pdo, $customerId);
    if ($row) {
        return $row;
    }

    try {
        $ins = $pdo->prepare('INSERT INTO live_chat_conversations (customer_id, status) VALUES (?, "open")');
        $ins->execute([$customerId]);
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        
    }
    $row = cvr_chat_find_conversation($pdo, $customerId);
    return $row ?: [];
}

function cvr_chat_format_message(array $row): array
{
    $deleted = !empty($row['deleted_for_all']);
    $type = (string) ($row['msg_type'] ?? 'text');
    if (!in_array($type, ['text', 'sticker', 'gif', 'image', 'file'], true)) {
        $type = 'text';
    }

    $attachment = null;
    if ($deleted) {
        // "Delete for everyone": the content is never sent to either side again.
        $type = 'text';
    } elseif ($type === 'gif') {
        $attachment = [
            'url' => (string) ($row['attachment_path'] ?? ''),
            'name' => (string) ($row['attachment_name'] ?? 'GIF'),
        ];
    } elseif ($type === 'image' || $type === 'file') {
        $attachment = [
            'name' => (string) ($row['attachment_name'] ?? 'file'),
            'mime' => (string) ($row['attachment_mime'] ?? ''),
            'size' => (int) ($row['attachment_size'] ?? 0),
        ];
    }

    return [
        'id' => (int) $row['id'],
        'conversationId' => (int) $row['conversation_id'],
        'senderId' => (int) $row['sender_id'],
        'senderRole' => $row['sender_role'] === 'staff' ? 'staff' : 'customer',
        'senderLabel' => $row['sender_label'] ?: ($row['sender_role'] === 'staff' ? 'Resort team' : 'Guest'),
        'type' => $type,
        'body' => $deleted ? '' : $row['body'],
        'attachment' => $attachment,
        'topic' => $row['topic'] ?: null,
        'reservationId' => $row['reservation_id'] ?: null,
        'createdAt' => $row['created_at'],
        'readAt' => $row['read_at'] ?? null,
        'deleted' => $deleted,
        'senderAvatarUrl' => cvr_chat_avatar_url($row['sender_avatar'] ?? null),
    ];
}

/** Public URL of a profile photo stored in users.avatar_path, or null. */
function cvr_chat_avatar_url(?string $path): ?string
{
    $path = trim((string) $path);
    if ($path === '' || strpos($path, '..') !== false) {
        return null;
    }
    return rtrim(config('cvr.site_url'), '/') . '/' . ltrim($path, '/');
}

/** One message with the sender's profile photo joined in. */
function cvr_chat_load_message(PDO $pdo, int $messageId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT m.*, u.avatar_path AS sender_avatar
         FROM live_chat_messages m
         LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.id = ?'
    );
    $stmt->execute([$messageId]);
    $row = $stmt->fetch();
    return $row ? cvr_chat_format_message($row) : null;
}

function cvr_chat_format_conversation(array $row, ?array $customer = null): array
{
    $customerName = '';
    if ($customer) {
        $customerName = trim(($customer['first_name'] ?? '') . ' ' . ($customer['last_name'] ?? ''));
    }

    // Guest presence (only present when the query joined live_chat_presence)
    $seenAgo = isset($row['presence_ago']) && $row['presence_ago'] !== null ? max(0, (int) $row['presence_ago']) : null;
    $customerOnline = $seenAgo !== null
        && !empty($row['presence_available'])
        && $seenAgo <= CVR_CHAT_PRESENCE_SECONDS;

    return [
        'id' => (int) $row['id'],
        'customerId' => (int) $row['customer_id'],
        'customerName' => $customerName,
        'customerEmail' => $customer['email'] ?? null,
        'reservationId' => $row['reservation_id'] ?: null,
        'topic' => $row['topic'] ?: null,
        'lastMessageAt' => $row['last_message_at'],
        'lastMessagePreview' => $row['last_message_preview'],
        'lastSenderRole' => $row['last_sender_role'],
        'customerUnread' => (int) $row['customer_unread'],
        'staffUnread' => (int) $row['staff_unread'],
        'status' => $row['status'] ?: 'open',
        'createdAt' => $row['created_at'] ?? null,
        'customerOnline' => $customerOnline,
        'customerSeenAgo' => $seenAgo,
        'customerAvatarUrl' => cvr_chat_avatar_url($customer['avatar_path'] ?? null),
    ];
}

/**
 * $viewer = 'customer' | 'staff' hides messages that side chose to "delete for me".
 */
function cvr_chat_fetch_messages(PDO $pdo, int $conversationId, int $afterId = 0, int $limit = 200, ?string $viewer = null): array
{
    $hidden = '';
    if ($viewer === 'customer') {
        $hidden = ' AND m.deleted_for_customer = 0';
    } elseif ($viewer === 'staff') {
        $hidden = ' AND m.deleted_for_staff = 0';
    }

    $select = 'SELECT m.*, u.avatar_path AS sender_avatar
               FROM live_chat_messages m
               LEFT JOIN users u ON u.id = m.sender_id';

    if ($afterId > 0) {
        $stmt = $pdo->prepare(
            $select . '
             WHERE m.conversation_id = ? AND m.id > ?' . $hidden . '
             ORDER BY m.id ASC
             LIMIT ' . (int) $limit
        );
        $stmt->execute([$conversationId, $afterId]);
    } else {
        $stmt = $pdo->prepare(
            $select . '
             WHERE m.conversation_id = ?' . $hidden . '
             ORDER BY m.id ASC
             LIMIT ' . (int) $limit
        );
        $stmt->execute([$conversationId]);
    }

    return array_map('cvr_chat_format_message', $stmt->fetchAll());
}

/**
 * Status changes the client can't see from "new messages only" polling:
 * seen time, deleted-for-everyone, and hidden-for-me. Only notable rows are returned.
 * Returns [statuses, signature]; the signature lets long-polling wake up on a change.
 */
function cvr_chat_message_statuses(PDO $pdo, int $conversationId, string $viewer, int $limit = 300): array
{
    $stmt = $pdo->prepare(
        'SELECT id, read_at, deleted_for_all, deleted_for_customer, deleted_for_staff
         FROM live_chat_messages
         WHERE conversation_id = ?
         ORDER BY id DESC
         LIMIT ' . (int) $limit
    );
    $stmt->execute([$conversationId]);

    $statuses = [];
    foreach ($stmt->fetchAll() as $row) {
        $hidden = $viewer === 'staff' ? !empty($row['deleted_for_staff']) : !empty($row['deleted_for_customer']);
        $deleted = !empty($row['deleted_for_all']);
        if ($row['read_at'] === null && !$hidden && !$deleted) {
            continue;
        }
        $statuses[] = [
            'id' => (int) $row['id'],
            'readAt' => $row['read_at'],
            'deleted' => $deleted,
            'hidden' => $hidden,
        ];
    }

    return [$statuses, md5(json_encode($statuses))];
}

/** Stamps the other side's unread messages as seen. $viewer = who just opened the chat. */
function cvr_chat_mark_messages_seen(PDO $pdo, int $conversationId, string $viewer): void
{
    $otherRole = $viewer === 'staff' ? 'customer' : 'staff';
    $stmt = $pdo->prepare(
        'UPDATE live_chat_messages
         SET read_at = NOW()
         WHERE conversation_id = ? AND sender_role = ? AND read_at IS NULL'
    );
    $stmt->execute([$conversationId, $otherRole]);
}

/**
 * Deletes a message.
 *  scope 'me'       -> hides it only for the person deleting (their side of the chat)
 *  scope 'everyone' -> only the sender; the content is wiped for both sides
 * Returns the formatted message, or sends a JSON error.
 */
function cvr_chat_delete_message(PDO $pdo, array $session, int $messageId, string $scope): array
{
    $isStaff = cvr_chat_is_staff_role($session['role'] ?? '');
    $userId = (int) $session['user_id'];

    $stmt = $pdo->prepare(
        'SELECT m.*, c.customer_id
         FROM live_chat_messages m
         JOIN live_chat_conversations c ON c.id = m.conversation_id
         WHERE m.id = ?'
    );
    $stmt->execute([$messageId]);
    $row = $stmt->fetch();

    if (!$row || (!$isStaff && (int) $row['customer_id'] !== $userId)) {
        json_response(false, 'Message not found.', [], 404);
    }

    $convId = (int) $row['conversation_id'];

    if ($scope === 'me') {
        $column = $isStaff ? 'deleted_for_staff' : 'deleted_for_customer';
        $pdo->prepare('UPDATE live_chat_messages SET ' . $column . ' = 1 WHERE id = ?')->execute([$messageId]);
    } elseif ($scope === 'everyone') {
        if ((int) $row['sender_id'] !== $userId) {
            json_response(false, 'You can only delete your own messages for everyone.', [], 403);
        }
        if (empty($row['deleted_for_all'])) {
            // Remove the stored upload from disk
            if (in_array($row['msg_type'], ['image', 'file'], true) && !empty($row['attachment_path'])) {
                $base = realpath(cvr_path(CVR_CHAT_UPLOAD_DIR));
                $path = realpath(cvr_path($row['attachment_path']));
                if ($base && $path && strpos($path, $base) === 0 && is_file($path)) {
                    @unlink($path);
                }
            }
            $pdo->prepare(
                'UPDATE live_chat_messages
                 SET deleted_for_all = 1, body = "", attachment_path = NULL, attachment_name = NULL,
                     attachment_mime = NULL, attachment_size = NULL
                 WHERE id = ?'
            )->execute([$messageId]);

            // An unseen message that no longer exists shouldn't keep the other side's unread badge up.
            if ($row['read_at'] === null) {
                $counter = $row['sender_role'] === 'staff' ? 'customer_unread' : 'staff_unread';
                $pdo->prepare(
                    'UPDATE live_chat_conversations SET ' . $counter . ' = GREATEST(' . $counter . ' - 1, 0) WHERE id = ?'
                )->execute([$convId]);
            }

            // If it was the newest message, fix the inbox preview.
            $latest = $pdo->prepare('SELECT MAX(id) FROM live_chat_messages WHERE conversation_id = ?');
            $latest->execute([$convId]);
            if ((int) $latest->fetchColumn() === $messageId) {
                $pdo->prepare('UPDATE live_chat_conversations SET last_message_preview = ? WHERE id = ?')
                    ->execute(['This message was deleted', $convId]);
            }
        }
    } else {
        json_response(false, 'Invalid delete option.', [], 422);
    }

    return cvr_chat_load_message($pdo, $messageId) ?? [];
}

function cvr_chat_post_message(
    PDO $pdo,
    array $conversation,
    array $session,
    string $body,
    ?string $topic,
    ?string $reservationId,
    array $attachment = []
): array {
    $type = (string) ($attachment['type'] ?? 'text');
    $senderRole = cvr_chat_is_staff_role($session['role'] ?? '') ? 'staff' : 'customer';
    $senderId = (int) $session['user_id'];
    $label = cvr_chat_sender_label($session);
    $preview = cvr_chat_preview_text($type, $body, (string) ($attachment['name'] ?? ''));
    $convId = (int) $conversation['id'];

    $stmt = $pdo->prepare(
        'INSERT INTO live_chat_messages
            (conversation_id, sender_id, sender_role, sender_label, body, topic, reservation_id,
             msg_type, attachment_path, attachment_name, attachment_mime, attachment_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $convId,
        $senderId,
        $senderRole,
        $label,
        $body,
        $topic,
        $reservationId,
        $type,
        $attachment['path'] ?? null,
        $attachment['name'] ?? null,
        $attachment['mime'] ?? null,
        isset($attachment['size']) ? (int) $attachment['size'] : null,
    ]);
    $messageId = (int) $pdo->lastInsertId();

    if ($senderRole === 'customer') {
        $upd = $pdo->prepare(
            'UPDATE live_chat_conversations
             SET last_message_at = NOW(),
                 last_message_preview = ?,
                 last_sender_role = "customer",
                 staff_unread = staff_unread + 1,
                 reservation_id = COALESCE(?, reservation_id),
                 topic = COALESCE(?, topic),
                 status = "open"
             WHERE id = ?'
        );
        $upd->execute([$preview, $reservationId, $topic, $convId]);
        if ((int) ($conversation['staff_unread'] ?? 0) === 0) {
            cvr_chat_notify_staff($pdo, $convId, $label, $preview);
        }
    } else {
        $upd = $pdo->prepare(
            'UPDATE live_chat_conversations
             SET last_message_at = NOW(),
                 last_message_preview = ?,
                 last_sender_role = "staff",
                 customer_unread = customer_unread + 1,
                 status = "open"
             WHERE id = ?'
        );
        $upd->execute([$preview, $convId]);
        if ((int) ($conversation['customer_unread'] ?? 0) === 0) {
            cvr_chat_notify_customer($pdo, $conversation, $label, $preview);
        }
    }

    return cvr_chat_load_message($pdo, $messageId) ?? [];
}

function cvr_chat_notify_staff(PDO $pdo, int $conversationId, string $guestName, string $preview): void
{
    try {
        $pdo->prepare(
            "INSERT INTO notifications (user_id, audience, title, message, link)
             SELECT id, 'staff', ?, ?, ?
             FROM users
             WHERE role IN ('admin', 'event_manager') AND status = 'active'"
        )->execute([
            'New live chat message',
            $guestName . ': ' . $preview,
            'live-chat.html?c=' . $conversationId,
        ]);
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('cvr_chat_notify_staff: ' . $e->getMessage());
    }
}

function cvr_chat_notify_customer(PDO $pdo, array $conversation, string $staffLabel, string $preview): void
{
    $customerId = (int) ($conversation['customer_id'] ?? 0);
    if ($customerId < 1) {
        return;
    }
    try {
        $pdo->prepare(
            "INSERT INTO notifications (user_id, audience, title, message, link)
             VALUES (?, 'customer', ?, ?, ?)"
        )->execute([
            $customerId,
            'Reply from resort staff',
            $staffLabel . ': ' . $preview,
            'customer-dashboard.html#live-chat',
        ]);
    } catch (\Throwable $e) {
        if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
        error_log('cvr_chat_notify_customer: ' . $e->getMessage());
    }
}

function cvr_chat_topics_payload(): array
{
    $items = [];
    foreach (CVR_CHAT_TOPICS as $id => $label) {
        $items[] = ['id' => $id, 'label' => $label];
    }
    return $items;
}


function cvr_chat_preview_text(string $type, string $body, string $name = ''): string
{
    switch ($type) {
        case 'image':
            return 'Sent a photo';
        case 'gif':
            return 'Sent a GIF';
        case 'sticker':
            return 'Sent a sticker ' . $body;
        case 'file':
            return 'Sent a file: ' . mb_substr($name !== '' ? $name : 'attachment', 0, 120);
        default:
            return mb_substr((string) preg_replace('/\s+/', ' ', $body), 0, 180);
    }
}

/** Only a single emoji-style sticker is accepted (no letters, digits, punctuation or markup). */
function cvr_chat_valid_sticker(string $value): bool
{
    $value = trim($value);
    if ($value === '' || mb_strlen($value) > 20) {
        return false;
    }
    return (bool) preg_match('/^(?:[\x{200D}\x{FE0F}]|[^\p{L}\p{N}\p{P}\p{Z}\p{C}])+$/u', $value);
}

/** GIFs must be https links hosted by Giphy. */
function cvr_chat_valid_gif_url(string $url): bool
{
    if (mb_strlen($url) > 255 || !preg_match('#^https://#i', $url)) {
        return false;
    }
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    return (bool) preg_match('/^(?:[a-z0-9-]+\.)*giphy\.com$/', $host);
}

function cvr_chat_clean_filename(string $name): string
{
    $name = basename(str_replace('\\', '/', $name));
    $name = preg_replace('/[\x00-\x1F\x7F<>:"|?*]+/', '', $name);
    $name = trim((string) $name);
    if ($name === '') {
        $name = 'file';
    }
    return mb_substr($name, 0, 120);
}

/**
 * Validates and stores an uploaded chat file. Returns the attachment descriptor
 * (type, path, name, mime, size) or sends a JSON error.
 */
function cvr_chat_store_upload(array $file, int $conversationId): array
{
    $err = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($err === UPLOAD_ERR_INI_SIZE || $err === UPLOAD_ERR_FORM_SIZE) {
        json_response(false, 'That file is too large. The maximum size is 8 MB (your server limit is ' . ini_get('upload_max_filesize') . ').', [], 422);
    }
    if ($err !== UPLOAD_ERR_OK || empty($file['tmp_name'])) {
        json_response(false, 'The file could not be uploaded. Please try again.', [], 422);
    }
    $size = (int) ($file['size'] ?? 0);
    if ($size < 1) {
        json_response(false, 'That file is empty.', [], 422);
    }
    if ($size > CVR_CHAT_MAX_UPLOAD_BYTES) {
        json_response(false, 'That file is too large. The maximum size is 8 MB.', [], 422);
    }

    $original = cvr_chat_clean_filename((string) ($file['name'] ?? 'file'));
    $parts = explode('.', $original);
    $ext = count($parts) > 1 ? strtolower((string) array_pop($parts)) : '';

    $isImage = isset(CVR_CHAT_IMAGE_EXT[$ext]);
    $isFile = isset(CVR_CHAT_FILE_EXT[$ext]);
    if (!$isImage && !$isFile) {
        json_response(false, 'That file type isn\'t allowed. You can send photos, PDF, Word, Excel, PowerPoint, TXT or CSV files.', [], 422);
    }

    if ($isImage) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $realMime = (string) $finfo->file($file['tmp_name']);
        if (!in_array($realMime, array_values(CVR_CHAT_IMAGE_EXT), true) || @getimagesize($file['tmp_name']) === false) {
            json_response(false, 'That image looks damaged or isn\'t a real photo.', [], 422);
        }
        $mime = $realMime;
        $type = 'image';
    } else {
        $mime = CVR_CHAT_FILE_EXT[$ext];
        $type = 'file';
    }

    $dir = cvr_path(CVR_CHAT_UPLOAD_DIR);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        json_response(false, 'Could not create the chat upload folder.', [], 500);
    }
    $guard = $dir . '/.htaccess';
    if (!is_file($guard)) {
        @file_put_contents(
            $guard,
            "# Chat files are served through api/chat/file.php only\n"
            . "<IfModule mod_authz_core.c>\n    Require all denied\n</IfModule>\n"
            . "<IfModule !mod_authz_core.c>\n    Order deny,allow\n    Deny from all\n</IfModule>\n"
        );
    }

    $stored = 'chat_' . $conversationId . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . '/' . $stored)) {
        json_response(false, 'Could not save the file. Please try again.', [], 500);
    }

    return [
        'type' => $type,
        'path' => CVR_CHAT_UPLOAD_DIR . '/' . $stored,
        'name' => $original,
        'mime' => $mime,
        'size' => $size,
    ];
}
