<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use PDO;
use PDOException;
use Throwable;
use finfo;

class ChatController extends Controller
{
    /** Ported from api/chat/conversation.php */
    public function conversation(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        if (cvr_chat_is_staff_role($session['role'] ?? '')) {
            json_response(false, 'Staff accounts use the Live Chat inbox in the dashboard.', [], 403);
        }

        $pdo = get_db_connection();
        $conversation = null;
        $messages = [];
        $statuses = [];
        $sig = '';
        try {
            cvr_chat_ensure_tables($pdo);
            cvr_chat_touch_customer_presence($pdo, (int) $session['user_id'], true);
            $conversation = cvr_chat_find_conversation($pdo, (int) $session['user_id']);
            if ($conversation) {
                [$statuses, $sig] = cvr_chat_message_statuses($pdo, (int) $conversation['id'], 'customer');
            }
            $messages = $conversation ? cvr_chat_fetch_messages($pdo, (int) $conversation['id'], 0, 200, 'customer') : [];
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('chat/conversation.php: ' . $e->getMessage());
            json_response(false, 'Could not load chat right now.', [], 500);
        }

        $customer = [
            'first_name' => $session['first_name'] ?? '',
            'last_name' => $session['last_name'] ?? '',
            'email' => $session['email'] ?? '',
        ];

        json_response(true, 'OK', [
            'conversation' => $conversation ? cvr_chat_format_conversation($conversation, $customer) : null,
            'messages' => $messages,
            'statuses' => $statuses,
            'sig' => $sig,
            'presence' => cvr_chat_presence_snapshot($pdo),
        ]);
    }

    /** Ported from api/chat/delete.php */
    public function delete(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $body = get_json_body();

        $messageId = (int) ($body['messageId'] ?? 0);
        $scope = (string) ($body['scope'] ?? 'me');   // 'me' | 'everyone'

        if ($messageId < 1) {
            json_response(false, 'Missing message.', [], 422);
        }

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $message = cvr_chat_delete_message($pdo, $session, $messageId, $scope);

        json_response(true, $scope === 'everyone' ? 'Message deleted for everyone.' : 'Message deleted for you.', [
            'message' => $message,
            'scope' => $scope,
        ]);
    }

    /** Ported from api/chat/file.php */
    public function file(Request $request)
    {
        $query = $request->query->all();
        // Streams a chat attachment, but only to the guest who owns the conversation or to staff.

        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        cvr_release_session();

        $messageId = isset($query['id']) ? (int) $query['id'] : 0;
        if ($messageId < 1) {
            json_response(false, 'Missing file.', [], 422);
        }

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $stmt = $pdo->prepare(
            'SELECT m.msg_type, m.attachment_path, m.attachment_name, m.attachment_mime, m.deleted_for_all,
                    m.deleted_for_customer, m.deleted_for_staff, c.customer_id
             FROM live_chat_messages m
             JOIN live_chat_conversations c ON c.id = m.conversation_id
             WHERE m.id = ?'
        );
        $stmt->execute([$messageId]);
        $row = $stmt->fetch();

        $allowed = $row
            && in_array($row['msg_type'], ['image', 'file'], true)
            && (cvr_chat_is_staff_role($session['role'] ?? '') || (int) $row['customer_id'] === (int) $session['user_id']);

        if ($allowed) {
            $viewerIsStaff = cvr_chat_is_staff_role($session['role'] ?? '');
            if (!empty($row['deleted_for_all'])
                || ($viewerIsStaff ? !empty($row['deleted_for_staff']) : !empty($row['deleted_for_customer']))) {
                $allowed = false;
            }
        }

        if (!$allowed) {
            return response('Not found.', 404);
        }

        $base = realpath(cvr_path(CVR_CHAT_UPLOAD_DIR));
        $path = realpath(cvr_path($row['attachment_path']));
        if (!$base || !$path || strpos($path, $base) !== 0 || !is_file($path)) {
            return response('File not found.', 404);
        }

        $mime = (string) $row['attachment_mime'];
        $inlineOk = in_array($mime, array_values(CVR_CHAT_IMAGE_EXT), true) && empty($query['download']);
        $name = str_replace(['"', "\r", "\n"], '', (string) $row['attachment_name']);

        $response = response()->file($path, [
            'Content-Type' => ($mime !== '' ? $mime : 'application/octet-stream'),
            'X-Content-Type-Options' => 'nosniff',
            'Content-Disposition' => ($inlineOk ? 'inline' : 'attachment') . '; filename="' . $name . '"; filename*=UTF-8\'\'' . rawurlencode($name),
        ]);
        $response->setPrivate();
        $response->setMaxAge(86400);
        return $response;
    }

    /** Ported from api/chat/gifs.php */
    public function gifs(Request $request)
    {
        $query = $request->query->all();
        // GIF search proxy (keeps the Giphy API key on the server).

        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        require_login();
        cvr_release_session();

        if (trim((string) config('cvr.giphy_api_key')) === '') {
            json_response(false, 'GIF search isn\'t set up yet.', ['code' => 'not_configured']);
        }

        $q = trim((string) ($query['q'] ?? ''));
        $q = mb_substr($q, 0, 60);
        $offset = max(0, min(200, (int) ($query['offset'] ?? 0)));
        $limit = 24;

        $params = [
            'api_key' => config('cvr.giphy_api_key'),
            'limit' => $limit,
            'offset' => $offset,
            'rating' => 'g',
        ];
        if ($q !== '') {
            $params['q'] = $q;
            $params['lang'] = 'en';
        }
        $url = 'https://api.giphy.com/v1/gifs/' . ($q !== '' ? 'search' : 'trending') . '?' . http_build_query($params);

        $raw = false;
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 8,
                CURLOPT_CONNECTTIMEOUT => 4,
                CURLOPT_FOLLOWLOCATION => false,
            ]);
            $raw = curl_exec($ch);
            curl_close($ch);
        } else {
            $raw = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 8]]));
        }

        $decoded = is_string($raw) ? json_decode($raw, true) : null;
        if (!is_array($decoded) || !isset($decoded['data']) || !is_array($decoded['data'])) {
            json_response(false, 'Could not load GIFs right now.', ['code' => 'unavailable']);
        }

        $items = [];
        foreach ($decoded['data'] as $gif) {
            $images = $gif['images'] ?? [];
            $full = $images['downsized']['url'] ?? ($images['original']['url'] ?? '');
            $preview = $images['fixed_width_small']['url'] ?? ($images['fixed_width']['url'] ?? $full);
            if (!cvr_chat_valid_gif_url((string) $full) || !cvr_chat_valid_gif_url((string) $preview)) {
                continue;
            }
            $items[] = [
                'id' => (string) ($gif['id'] ?? ''),
                'title' => mb_substr((string) ($gif['title'] ?? 'GIF'), 0, 120),
                'preview' => $preview,
                'url' => $full,
            ];
        }

        json_response(true, 'OK', [
            'gifs' => $items,
            'nextOffset' => $offset + count($decoded['data']),
            'hasMore' => count($decoded['data']) >= $limit,
        ]);
    }

    /** Ported from api/chat/heartbeat.php */
    public function heartbeat(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);
        $pdo = get_db_connection();
        cvr_chat_touch_presence($pdo, (int) $session['user_id'], true);

        json_response(true, 'OK', cvr_chat_presence_snapshot($pdo));
    }

    /** Ported from api/chat/inbox.php */
    public function inbox(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);
        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);
        cvr_chat_touch_presence($pdo, (int) $session['user_id'], true);

        $stmt = $pdo->query(
            "SELECT c.*, u.first_name, u.last_name, u.email, u.avatar_path" . CVR_CHAT_CUSTOMER_PRESENCE_SELECT . "
             FROM live_chat_conversations c
             JOIN users u ON u.id = c.customer_id" . CVR_CHAT_CUSTOMER_PRESENCE_JOIN . "
             ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.id DESC"
        );
        $rows = $stmt->fetchAll();

        $conversations = [];
        $totalUnread = 0;
        foreach ($rows as $row) {
            $formatted = cvr_chat_format_conversation($row, $row);
            $conversations[] = $formatted;
            $totalUnread += (int) $formatted['staffUnread'];
        }

        json_response(true, 'OK', [
            'conversations' => $conversations,
            'unreadCount' => $totalUnread,
            'presence' => cvr_chat_presence_snapshot($pdo),
            'topics' => cvr_chat_topics_payload(),
        ]);
    }

    /** Ported from api/chat/leave.php */
    public function leave(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        // Called when a tab closes (navigator.sendBeacon). Staff go "away"; guests go offline.
        $session = require_login();
        $pdo = get_db_connection();

        if (cvr_chat_is_staff_role($session['role'] ?? '')) {
            cvr_chat_touch_presence($pdo, (int) $session['user_id'], false);
        } else {
            cvr_chat_touch_customer_presence($pdo, (int) $session['user_id'], false);
        }

        json_response(true, 'OK');
    }

    /** Ported from api/chat/mark-read.php */
    public function markRead(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();
        $body = get_json_body();
        $conversationId = (int) ($body['conversationId'] ?? 0);

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $isStaff = cvr_chat_is_staff_role($session['role'] ?? '');

        if ($isStaff) {
            if ($conversationId < 1) {
                json_response(false, 'Missing conversation.', [], 422);
            }
            $stmt = $pdo->prepare('UPDATE live_chat_conversations SET staff_unread = 0 WHERE id = ?');
            $stmt->execute([$conversationId]);
            cvr_chat_mark_messages_seen($pdo, $conversationId, 'staff');
        } else {
            $conversation = cvr_chat_find_conversation($pdo, (int) $session['user_id']);
            if ($conversation) {
                $stmt = $pdo->prepare('UPDATE live_chat_conversations SET customer_unread = 0 WHERE id = ? AND customer_id = ?');
                $stmt->execute([(int) $conversation['id'], (int) $session['user_id']]);
                cvr_chat_mark_messages_seen($pdo, (int) $conversation['id'], 'customer');
            }
        }

        json_response(true, 'OK');
    }

    /** Ported from api/chat/poll.php */
    public function poll(Request $request)
    {
        $query = $request->query->all();
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login(); 
        cvr_release_session();
        @set_time_limit(25);
        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $afterId = isset($query['afterId']) ? (int) $query['afterId'] : 0;
        $wait = isset($query['wait']) && $query['wait'] === '1';
        $conversationId = isset($query['conversationId']) ? (int) $query['conversationId'] : 0;
        $clientSig = isset($query['sig']) ? (string) $query['sig'] : null;

        $isStaff = cvr_chat_is_staff_role($session['role'] ?? '');
        if ($isStaff) {
            cvr_chat_touch_presence($pdo, (int) $session['user_id'], true);
            if ($conversationId < 1) {
                json_response(false, 'Missing conversation.', [], 422);
            }
            $stmt = $pdo->prepare('SELECT * FROM live_chat_conversations WHERE id = ?');
            $stmt->execute([$conversationId]);
            $conversation = $stmt->fetch();
            if (!$conversation) {
                json_response(false, 'Conversation not found.', [], 404);
            }
        } else {
            cvr_chat_touch_customer_presence($pdo, (int) $session['user_id'], true);
            $conversation = cvr_chat_find_conversation($pdo, (int) $session['user_id']);
            if (!$conversation) {
                json_response(true, 'OK', [
                    'conversationId' => 0,
                    'messages' => [],
                    'presence' => cvr_chat_presence_snapshot($pdo),
                    'unread' => 0,
                ]);
            }
            $conversationId = (int) $conversation['id'];
        }

        $viewer = $isStaff ? 'staff' : 'customer';
        $deadline = time() + ($wait ? 18 : 0);
        $messages = [];
        $statuses = [];
        $sig = '';
        do {
            $messages = cvr_chat_fetch_messages($pdo, $conversationId, $afterId, 200, $viewer);
            [$statuses, $sig] = cvr_chat_message_statuses($pdo, $conversationId, $viewer);
            // Wake up for new messages, or when a message was seen / deleted.
            if ($messages || !$wait || ($clientSig !== null && $clientSig !== $sig)) {
                break;
            }
            usleep(700000);
        } while (time() < $deadline);

        json_response(true, 'OK', [
            'conversationId' => $conversationId,
            'messages' => $messages,
            'statuses' => $statuses,
            'sig' => $sig,
            'presence' => cvr_chat_presence_snapshot($pdo),
            'unread' => $isStaff
                ? (int) ($conversation['staff_unread'] ?? 0)
                : (int) ($conversation['customer_unread'] ?? 0),
        ]);
    }

    /** Ported from api/chat/presence.php */
    public function presence(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $pdo = get_db_connection();
        json_response(true, 'OK', cvr_chat_presence_snapshot($pdo));
    }

    /** Ported from api/chat/profile.php */
    public function profile(Request $request)
    {
        $query = $request->query->all();
        // Account preview for the guest in a live chat conversation. Staff / admin only.

        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);
        $conversationId = isset($query['id']) ? (int) $query['id'] : 0;
        if ($conversationId < 1) {
            json_response(false, 'Missing conversation.', [], 422);
        }

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $stmt = $pdo->prepare(
            "SELECT c.id AS conversation_id, c.topic, c.reservation_id AS chat_reservation_id, c.created_at AS chat_started_at,
                    u.id AS user_id, u.first_name, u.last_name, u.email, u.phone, u.avatar_path,
                    u.is_verified, u.status AS account_status, u.created_at AS member_since"
            . CVR_CHAT_CUSTOMER_PRESENCE_SELECT . "
             FROM live_chat_conversations c
             JOIN users u ON u.id = c.customer_id" . CVR_CHAT_CUSTOMER_PRESENCE_JOIN . "
             WHERE c.id = ?"
        );
        $stmt->execute([$conversationId]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(false, 'Conversation not found.', [], 404);
        }

        // Chat stats
        $stats = $pdo->prepare(
            "SELECT COUNT(*) AS total,
                    SUM(sender_role = 'customer') AS from_guest,
                    MIN(created_at) AS first_at
             FROM live_chat_messages
             WHERE conversation_id = ? AND deleted_for_all = 0"
        );
        $stats->execute([$conversationId]);
        $chat = $stats->fetch() ?: [];

        // Bookings (table may not exist on older installs)
        $reservations = [];
        $reservationCount = 0;
        try {
            $where = 'user_id = ? OR LOWER(email) = LOWER(?)';
            $params = [(int) $row['user_id'], (string) $row['email']];

            $count = $pdo->prepare('SELECT COUNT(*) FROM reservations WHERE ' . $where);
            $count->execute($params);
            $reservationCount = (int) $count->fetchColumn();

            $list = $pdo->prepare(
                'SELECT id, booking_type, room_name, check_in, check_out, preferred_date,
                        reservation_status, payment_status, total_numeric, currency
                 FROM reservations
                 WHERE ' . $where . '
                 ORDER BY updated_at DESC
                 LIMIT 5'
            );
            $list->execute($params);
            foreach ($list->fetchAll() as $r) {
                $reservations[] = [
                    'id' => $r['id'],
                    'type' => $r['booking_type'],
                    'name' => $r['room_name'],
                    'checkIn' => $r['check_in'],
                    'checkOut' => $r['check_out'],
                    'date' => $r['preferred_date'],
                    'status' => $r['reservation_status'],
                    'paymentStatus' => $r['payment_status'],
                    'total' => $r['total_numeric'] !== null ? (float) $r['total_numeric'] : null,
                    'currency' => $r['currency'] ?: 'PHP',
                ];
            }
        } catch (\Throwable $e) {
            if ($e instanceof \Illuminate\Http\Exceptions\HttpResponseException) { throw $e; }
            error_log('chat/profile.php reservations: ' . $e->getMessage());
        }

        $seenAgo = $row['presence_ago'] !== null ? max(0, (int) $row['presence_ago']) : null;
        $online = $seenAgo !== null && !empty($row['presence_available']) && $seenAgo <= CVR_CHAT_PRESENCE_SECONDS;

        json_response(true, 'OK', [
            'profile' => [
                'conversationId' => (int) $row['conversation_id'],
                'userId' => (int) $row['user_id'],
                'name' => trim($row['first_name'] . ' ' . $row['last_name']),
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'email' => $row['email'],
                'phone' => $row['phone'],
                'avatarUrl' => cvr_chat_avatar_url($row['avatar_path']),
                'verified' => (bool) $row['is_verified'],
                'accountStatus' => $row['account_status'],
                'memberSince' => $row['member_since'],
                'online' => $online,
                'seenAgo' => $seenAgo,
                'chat' => [
                    'startedAt' => $row['chat_started_at'],
                    'topic' => $row['topic'],
                    'reservationId' => $row['chat_reservation_id'],
                    'messages' => (int) ($chat['total'] ?? 0),
                    'fromGuest' => (int) ($chat['from_guest'] ?? 0),
                ],
                'reservationCount' => $reservationCount,
                'reservations' => $reservations,
            ],
        ]);
    }

    /** Ported from api/chat/send.php */
    public function send(Request $request)
    {
        if ($request->method() !== 'POST') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_login();

        // A file upload arrives as multipart/form-data; text, stickers and GIFs arrive as JSON.
        $isUpload = !empty($_FILES['file']);
        $body = $isUpload ? $_POST : get_json_body();

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $isStaff = cvr_chat_is_staff_role($session['role'] ?? '');

        if ($isStaff) {
            cvr_chat_touch_presence($pdo, (int) $session['user_id'], true);
            $conversationId = (int) ($body['conversationId'] ?? 0);
            if ($conversationId < 1) {
                json_response(false, 'Missing conversation.', [], 422);
            }
            $stmt = $pdo->prepare('SELECT * FROM live_chat_conversations WHERE id = ?');
            $stmt->execute([$conversationId]);
            $conversation = $stmt->fetch();
            if (!$conversation) {
                json_response(false, 'Conversation not found.', [], 404);
            }
        } else {
            $conversation = cvr_chat_get_or_create_conversation($pdo, (int) $session['user_id']);
            if (!$conversation) {
                json_response(false, 'Could not start the conversation.', [], 500);
            }
        }

        $type = $isUpload ? 'file' : (string) ($body['type'] ?? 'text');
        $text = '';
        $attachment = ['type' => 'text'];

        switch ($type) {
            case 'file':
            case 'image':
                if (!$isUpload) {
                    json_response(false, 'Please choose a file to send.', [], 422);
                }
                $attachment = cvr_chat_store_upload($_FILES['file'], (int) $conversation['id']);
                break;

            case 'sticker':
                $sticker = trim((string) ($body['sticker'] ?? ''));
                if (!cvr_chat_valid_sticker($sticker)) {
                    json_response(false, 'That sticker isn\'t available.', [], 422);
                }
                $text = $sticker;
                $attachment = ['type' => 'sticker'];
                break;

            case 'gif':
                $url = trim((string) ($body['url'] ?? ''));
                if (!cvr_chat_valid_gif_url($url)) {
                    json_response(false, 'That GIF can\'t be sent.', [], 422);
                }
                $title = mb_substr(trim((string) ($body['title'] ?? 'GIF')), 0, 120);
                $attachment = ['type' => 'gif', 'path' => $url, 'name' => $title !== '' ? $title : 'GIF'];
                break;

            case 'text':
            default:
                $text = trim((string) ($body['message'] ?? $body['body'] ?? ''));
                if ($text === '') {
                    json_response(false, 'Please type a message first.', [], 422);
                }
                if (mb_strlen($text) > 2000) {
                    json_response(false, 'Messages must be 2000 characters or fewer.', [], 422);
                }
                $attachment = ['type' => 'text'];
                break;
        }

        $message = cvr_chat_post_message($pdo, $conversation, $session, $text, null, null, $attachment);

        $stmt = $pdo->prepare('SELECT * FROM live_chat_conversations WHERE id = ?');
        $stmt->execute([(int) $conversation['id']]);
        $conversation = $stmt->fetch();

        json_response(true, 'Sent.', [
            'message' => $message,
            'conversation' => cvr_chat_format_conversation($conversation),
            'presence' => cvr_chat_presence_snapshot($pdo),
        ]);
    }

    /** Ported from api/chat/thread.php */
    public function thread(Request $request)
    {
        $query = $request->query->all();
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);
        $conversationId = isset($query['id']) ? (int) $query['id'] : 0;
        if ($conversationId < 1) {
            json_response(false, 'Missing conversation.', [], 422);
        }

        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);
        cvr_chat_touch_presence($pdo, (int) $session['user_id'], true);

        $stmt = $pdo->prepare(
            "SELECT c.*, u.first_name, u.last_name, u.email, u.avatar_path" . CVR_CHAT_CUSTOMER_PRESENCE_SELECT . "
             FROM live_chat_conversations c
             JOIN users u ON u.id = c.customer_id" . CVR_CHAT_CUSTOMER_PRESENCE_JOIN . "
             WHERE c.id = ?"
        );
        $stmt->execute([$conversationId]);
        $row = $stmt->fetch();
        if (!$row) {
            json_response(false, 'Conversation not found.', [], 404);
        }

        $afterId = isset($query['afterId']) ? (int) $query['afterId'] : 0;
        $messages = cvr_chat_fetch_messages($pdo, $conversationId, $afterId, 200, 'staff');
        [$statuses, $sig] = cvr_chat_message_statuses($pdo, $conversationId, 'staff');

        json_response(true, 'OK', [
            'conversation' => cvr_chat_format_conversation($row, $row),
            'messages' => $messages,
            'statuses' => $statuses,
            'sig' => $sig,
            'presence' => cvr_chat_presence_snapshot($pdo),
        ]);
    }

    /** Ported from api/chat/unread.php */
    public function unread(Request $request)
    {
        if ($request->method() !== 'GET') {
            json_response(false, 'Invalid request method.', [], 405);
        }

        $session = require_role(['admin', 'event_manager']);
        $pdo = get_db_connection();
        cvr_chat_ensure_tables($pdo);

        $stmt = $pdo->query('SELECT COALESCE(SUM(staff_unread), 0) FROM live_chat_conversations');
        $unread = (int) $stmt->fetchColumn();

        json_response(true, 'OK', [
            'unreadCount' => $unread,
            'presence' => cvr_chat_presence_snapshot($pdo),
        ]);
    }
}
