<?php
defined('ABSPATH') || exit;

function facial_render_settings_page(): void {
    $api    = new Facial_Api_Client();
    $online = $api->health();
    ?>
    <div class="wrap">
        <h1>Configuración — Facial Search</h1>

        <form method="post" action="options.php">
            <?php settings_fields('facial_search_settings'); ?>
            <table class="form-table" role="presentation">
                <tr>
                    <th scope="row"><label for="facial_api_url">URL de la API</label></th>
                    <td>
                        <input type="url" id="facial_api_url" name="facial_api_url" class="large-text"
                               value="<?php echo esc_attr(get_option('facial_api_url', '')); ?>"
                               placeholder="https://tu-proyecto.vercel.app">
                        <p class="description">URL base del proyecto Next.js desplegado en Vercel.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="facial_api_key">API Key</label></th>
                    <td>
                        <input type="password" id="facial_api_key" name="facial_api_key" class="regular-text"
                               value="<?php echo esc_attr(get_option('facial_api_key', '')); ?>">
                        <p class="description">Clave de acceso configurada en el archivo .env de la API.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="facial_primary_color">Color del widget</label></th>
                    <td>
                        <input type="color" id="facial_primary_color" name="facial_primary_color"
                               value="<?php echo esc_attr(get_option('facial_primary_color', '#2563eb')); ?>">
                        <p class="description">Color primario de la burbuja flotante y botones.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="facial_tenant_id">Tenant ID</label></th>
                    <td>
                        <input type="text" id="facial_tenant_id" name="facial_tenant_id" class="regular-text"
                               value="<?php echo esc_attr(get_option('facial_tenant_id', 'default')); ?>">
                        <p class="description">Identificador de este cliente para futura arquitectura multi-tenant.</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Guardar configuración'); ?>
        </form>

        <hr>
        <h2>Prueba de conexión</h2>
        <?php if ($online): ?>
            <p><span style="color:#16a34a;font-weight:600;">● API respondiendo correctamente.</span></p>
        <?php else: ?>
            <p><span style="color:#dc2626;font-weight:600;">● No se puede conectar con la API.</span>
            Verifica que la URL y la API Key sean correctas y que el proyecto esté desplegado.</p>
        <?php endif; ?>
    </div>
    <?php
}
