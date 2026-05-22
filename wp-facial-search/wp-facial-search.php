<?php
/**
 * Plugin Name: Facial Search
 * Description: Permite a atletas encontrar sus fotos en eventos deportivos usando reconocimiento facial.
 * Version:     1.0.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: facial-search
 */

defined('ABSPATH') || exit;

define('FACIAL_SEARCH_VERSION', '1.0.0');
define('FACIAL_SEARCH_DIR',     plugin_dir_path(__FILE__));
define('FACIAL_SEARCH_URL',     plugin_dir_url(__FILE__));

require_once FACIAL_SEARCH_DIR . 'includes/class-database.php';
require_once FACIAL_SEARCH_DIR . 'includes/class-api-client.php';
require_once FACIAL_SEARCH_DIR . 'includes/class-athlete.php';
require_once FACIAL_SEARCH_DIR . 'includes/class-event.php';
require_once FACIAL_SEARCH_DIR . 'admin/admin-page.php';
require_once FACIAL_SEARCH_DIR . 'admin/events-page.php';
require_once FACIAL_SEARCH_DIR . 'admin/settings-page.php';

// ── Activation / Deactivation ─────────────────────────────────────────────────

register_activation_hook(__FILE__, ['Facial_Database', 'create_tables']);

// ── Admin Menu ────────────────────────────────────────────────────────────────

add_action('admin_menu', function () {
    add_menu_page(
        'Facial Search', 'Facial Search', 'manage_options',
        'facial-search', 'facial_render_admin_page',
        'dashicons-camera', 30
    );
    add_submenu_page(
        'facial-search', 'Eventos', 'Eventos',
        'manage_options', 'facial-events', 'facial_render_events_page'
    );
    add_submenu_page(
        'facial-search', 'Configuración', 'Configuración',
        'manage_options', 'facial-settings', 'facial_render_settings_page'
    );
});

add_action('admin_init', function () {
    register_setting('facial_search_settings', 'facial_api_url',       ['sanitize_callback' => 'esc_url_raw']);
    register_setting('facial_search_settings', 'facial_api_key',       ['sanitize_callback' => 'sanitize_text_field']);
    register_setting('facial_search_settings', 'facial_primary_color', ['sanitize_callback' => 'sanitize_hex_color', 'default' => '#2563eb']);
    register_setting('facial_search_settings', 'facial_tenant_id',     ['sanitize_callback' => 'sanitize_text_field', 'default' => 'default']);
});

// ── Front-end: enqueue widget ─────────────────────────────────────────────────

add_action('wp_enqueue_scripts', function () {
    wp_enqueue_style(
        'facial-widget',
        FACIAL_SEARCH_URL . 'public/widget.css',
        [],
        FACIAL_SEARCH_VERSION
    );
    wp_enqueue_script(
        'facial-widget',
        FACIAL_SEARCH_URL . 'public/widget.js',
        [],
        FACIAL_SEARCH_VERSION,
        true
    );
    wp_localize_script('facial-widget', 'FacialSearch', [
        'apiRoot'      => esc_url_raw(rest_url('facial-search/v1')),
        'nonce'        => wp_create_nonce('wp_rest'),
        'primaryColor' => get_option('facial_primary_color', '#2563eb'),
    ]);
});

// ── REST API ──────────────────────────────────────────────────────────────────

add_action('rest_api_init', function () {
    register_rest_route('facial-search/v1', '/events', [
        'methods'             => 'GET',
        'callback'            => 'facial_rest_get_events',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('facial-search/v1', '/lookup', [
        'methods'             => 'POST',
        'callback'            => 'facial_rest_lookup',
        'permission_callback' => '__return_true',
        'args'                => [
            'email'    => ['required' => true, 'sanitize_callback' => 'sanitize_email'],
            'event_id' => ['required' => true, 'sanitize_callback' => 'absint'],
            'selfie'   => ['required' => false],
        ],
    ]);
});

function facial_rest_get_events(WP_REST_Request $request): WP_REST_Response {
    return new WP_REST_Response(Facial_Event::get_active_events(), 200);
}

function facial_rest_lookup(WP_REST_Request $request): WP_REST_Response {
    $email    = $request->get_param('email');
    $event_id = (int) $request->get_param('event_id');
    $selfie   = $request->get_param('selfie'); // base64 string or null

    if (!is_email($email)) {
        return new WP_REST_Response(['error' => 'Email inválido'], 400);
    }

    $event = Facial_Event::get_by_id($event_id);
    if (!$event) {
        return new WP_REST_Response(['error' => 'Evento no encontrado'], 404);
    }

    $athlete     = Facial_Athlete::get_by_email($email);
    $is_new      = empty($athlete);
    $face_vector = $is_new ? null : ($athlete['face_vector'] ?? null);

    if ($is_new && empty($selfie)) {
        return new WP_REST_Response([
            'error'       => 'selfie requerida para nuevo usuario',
            'needs_selfie' => true,
        ], 422);
    }

    $photo_urls = facial_get_event_photo_urls($event);
    if (empty($photo_urls)) {
        return new WP_REST_Response(['matches' => [], 'is_new_athlete' => $is_new], 200);
    }

    $api     = new Facial_Api_Client();
    $payload = ['event_photos' => $photo_urls];

    if ($face_vector) {
        $payload['face_vector'] = $face_vector;
    } else {
        $payload['selfie'] = $selfie;
    }

    $result = $api->search($payload);

    if (is_wp_error($result)) {
        return new WP_REST_Response(['error' => $result->get_error_message()], 502);
    }

    // Persist athlete on first match
    if ($is_new && !empty($result['selfie_vector'])) {
        $athlete_id = Facial_Athlete::create($email, $result['selfie_vector']);
        if ($athlete_id) {
            Facial_Athlete::save_results($athlete_id, $event_id, $result['matches'] ?? []);
        }
    } elseif (!$is_new && isset($athlete['id'])) {
        Facial_Athlete::save_results($athlete['id'], $event_id, $result['matches'] ?? []);
    }

    return new WP_REST_Response([
        'matches'        => $result['matches'] ?? [],
        'is_new_athlete' => $is_new,
    ], 200);
}

/**
 * Scans the event's photos_path directory and returns public URLs.
 *
 * @param array $event Row from wp_facial_events.
 * @return string[]
 */
function facial_get_event_photo_urls(array $event): array {
    $path     = rtrim($event['photos_path'] ?? '', '/');
    $base_url = rtrim($event['photos_base_url'] ?? '', '/');

    if (!$path || !$base_url || !is_dir($path)) {
        return [];
    }

    $urls = [];
    foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
        foreach (glob("$path/*.$ext") ?: [] as $file) {
            $urls[] = $base_url . '/' . basename($file);
        }
    }
    return $urls;
}
