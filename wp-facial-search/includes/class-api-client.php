<?php
defined('ABSPATH') || exit;

class Facial_Api_Client {

    /** @var string */
    private $api_url;

    /** @var string */
    private $api_key;

    public function __construct() {
        $this->api_url = rtrim((string) get_option('facial_api_url', ''), '/');
        $this->api_key = (string) get_option('facial_api_key', '');
    }

    /**
     * POST /api/search
     *
     * @param array $payload Keys: event_photos (required), selfie OR face_vector (one required).
     * @return array|WP_Error
     */
    public function search(array $payload) {
        return $this->post('/api/search', $payload, 60);
    }

    /**
     * POST /api/index-photo
     *
     * @param string $photo_url
     * @param string $event_id
     * @return array|WP_Error
     */
    public function index_photo(string $photo_url, string $event_id) {
        return $this->post('/api/index-photo', [
            'photo_url' => $photo_url,
            'event_id'  => $event_id,
        ], 30);
    }

    /**
     * GET /api/health
     *
     * @return bool
     */
    public function health(): bool {
        if (empty($this->api_url)) {
            return false;
        }
        $response = wp_remote_get($this->api_url . '/api/health', ['timeout' => 10]);
        return !is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200;
    }

    /**
     * @param string $endpoint  e.g. '/api/search'
     * @param array  $payload
     * @param int    $timeout
     * @return array|WP_Error
     */
    private function post(string $endpoint, array $payload, int $timeout) {
        if (empty($this->api_url) || empty($this->api_key)) {
            return new WP_Error('config', 'API URL o API Key no configurados en Facial Search → Configuración');
        }

        $payload['api_key'] = $this->api_key;

        $response = wp_remote_post(
            $this->api_url . $endpoint,
            [
                'timeout'     => $timeout,
                'headers'     => ['Content-Type' => 'application/json'],
                'body'        => wp_json_encode($payload),
                'data_format' => 'body',
            ]
        );

        if (is_wp_error($response)) {
            return $response;
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = json_decode(wp_remote_retrieve_body($response), true);

        if ($code !== 200) {
            $message = isset($body['error']) ? $body['error'] : "Error HTTP $code";
            return new WP_Error('api_error', $message);
        }

        return is_array($body) ? $body : [];
    }
}
