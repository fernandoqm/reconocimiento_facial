<?php
defined('ABSPATH') || exit;

class Facial_Database {

    public static function create_tables(): void {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta("CREATE TABLE {$wpdb->prefix}facial_athletes (
            id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email      VARCHAR(255) NOT NULL,
            name       VARCHAR(255) DEFAULT '',
            face_vector JSON NOT NULL,
            tenant_id  VARCHAR(100) NOT NULL DEFAULT 'default',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_email (email)
        ) $charset;");

        dbDelta("CREATE TABLE {$wpdb->prefix}facial_events (
            id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name            VARCHAR(255) NOT NULL,
            slug            VARCHAR(255) NOT NULL,
            photos_path     VARCHAR(500) DEFAULT '',
            photos_base_url VARCHAR(500) DEFAULT '',
            active          TINYINT(1)   DEFAULT 1,
            tenant_id       VARCHAR(100) NOT NULL DEFAULT 'default',
            created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_slug (slug)
        ) $charset;");

        dbDelta("CREATE TABLE {$wpdb->prefix}facial_results (
            id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            athlete_id     BIGINT UNSIGNED NOT NULL,
            event_id       BIGINT UNSIGNED NOT NULL,
            matched_photos JSON,
            searched_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY idx_athlete_event (athlete_id, event_id)
        ) $charset;");
    }
}
