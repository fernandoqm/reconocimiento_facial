<?php
defined('ABSPATH') || exit;

class Facial_Event {

    /** @return array[] */
    public static function get_active_events(): array {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT id, name, slug, photos_base_url
             FROM {$wpdb->prefix}facial_events
             WHERE active = 1
             ORDER BY created_at DESC",
            ARRAY_A
        ) ?: [];
    }

    /** @return array[] */
    public static function get_all_events(): array {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}facial_events ORDER BY created_at DESC",
            ARRAY_A
        ) ?: [];
    }

    /** @return array|null */
    public static function get_by_id(int $id): ?array {
        global $wpdb;
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}facial_events WHERE id = %d",
                $id
            ),
            ARRAY_A
        );
        return $row ?: null;
    }

    /**
     * @param array $data  Keys: name (required), photos_path, photos_base_url
     * @return int|false
     */
    public static function create(array $data) {
        global $wpdb;
        $name = sanitize_text_field($data['name'] ?? '');
        if (!$name) {
            return false;
        }
        $result = $wpdb->insert(
            $wpdb->prefix . 'facial_events',
            [
                'name'            => $name,
                'slug'            => sanitize_title($name),
                'photos_path'     => sanitize_text_field($data['photos_path'] ?? ''),
                'photos_base_url' => esc_url_raw($data['photos_base_url'] ?? ''),
                'active'          => 1,
                'tenant_id'       => get_option('facial_tenant_id', 'default'),
            ],
            ['%s', '%s', '%s', '%s', '%d', '%s']
        );
        return $result !== false ? $wpdb->insert_id : false;
    }

    public static function toggle_active(int $id, bool $active): void {
        global $wpdb;
        $wpdb->update(
            $wpdb->prefix . 'facial_events',
            ['active' => $active ? 1 : 0],
            ['id'     => $id],
            ['%d'],
            ['%d']
        );
    }

    public static function delete(int $id): void {
        global $wpdb;
        $wpdb->delete($wpdb->prefix . 'facial_events', ['id' => $id], ['%d']);
    }
}
