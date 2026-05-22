<?php
defined('ABSPATH') || exit;

class Facial_Athlete {

    /**
     * @return array|null  Keys: id, email, name, face_vector (decoded array)
     */
    public static function get_by_email(string $email): ?array {
        global $wpdb;
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT id, email, name, face_vector
                 FROM {$wpdb->prefix}facial_athletes
                 WHERE email = %s",
                $email
            ),
            ARRAY_A
        );
        if (!$row) {
            return null;
        }
        $row['face_vector'] = json_decode($row['face_vector'], true);
        return $row;
    }

    /**
     * @param string  $email
     * @param float[] $face_vector  128-element descriptor
     * @param string  $name
     * @return int|false  Inserted ID or false on failure
     */
    public static function create(string $email, array $face_vector, string $name = '') {
        global $wpdb;
        $result = $wpdb->insert(
            $wpdb->prefix . 'facial_athletes',
            [
                'email'       => $email,
                'name'        => $name,
                'face_vector' => wp_json_encode($face_vector),
                'tenant_id'   => get_option('facial_tenant_id', 'default'),
            ],
            ['%s', '%s', '%s', '%s']
        );
        return $result !== false ? $wpdb->insert_id : false;
    }

    /**
     * Replace the stored face vector for an athlete.
     */
    public static function update_vector(int $id, array $face_vector): bool {
        global $wpdb;
        return (bool) $wpdb->update(
            $wpdb->prefix . 'facial_athletes',
            ['face_vector' => wp_json_encode($face_vector)],
            ['id' => $id],
            ['%s'],
            ['%d']
        );
    }

    /**
     * Upsert search results for an athlete/event pair.
     *
     * @param string[] $photos  Array of photo URLs
     */
    public static function save_results(int $athlete_id, int $event_id, array $photos): void {
        global $wpdb;
        $table = $wpdb->prefix . 'facial_results';

        $exists = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT id FROM $table WHERE athlete_id = %d AND event_id = %d",
                $athlete_id,
                $event_id
            )
        );

        $data = [
            'matched_photos' => wp_json_encode($photos),
            'searched_at'    => current_time('mysql'),
        ];

        if ($exists) {
            $wpdb->update(
                $table,
                $data,
                ['athlete_id' => $athlete_id, 'event_id' => $event_id],
                ['%s', '%s'],
                ['%d', '%d']
            );
        } else {
            $wpdb->insert(
                $table,
                array_merge($data, ['athlete_id' => $athlete_id, 'event_id' => $event_id]),
                ['%s', '%s', '%d', '%d']
            );
        }
    }

    /**
     * @return array[]  All athletes (no face vectors — for display only)
     */
    public static function get_all(): array {
        global $wpdb;
        return $wpdb->get_results(
            "SELECT id, email, name, created_at
             FROM {$wpdb->prefix}facial_athletes
             ORDER BY created_at DESC",
            ARRAY_A
        ) ?: [];
    }
}
