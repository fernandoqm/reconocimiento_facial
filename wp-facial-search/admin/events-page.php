<?php
defined('ABSPATH') || exit;

function facial_render_events_page(): void {
    $notice = null;

    if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('facial_events_action')) {
        $action = sanitize_key($_POST['facial_action'] ?? '');

        switch ($action) {
            case 'create':
                $id = Facial_Event::create($_POST);
                $notice = $id
                    ? ['type' => 'success', 'msg' => 'Evento creado correctamente.']
                    : ['type' => 'error',   'msg' => 'Error al crear el evento. ¿El nombre ya existe?'];
                break;

            case 'delete':
                Facial_Event::delete((int) ($_POST['event_id'] ?? 0));
                $notice = ['type' => 'success', 'msg' => 'Evento eliminado.'];
                break;

            case 'toggle':
                Facial_Event::toggle_active(
                    (int) ($_POST['event_id'] ?? 0),
                    (bool) (int) ($_POST['active'] ?? 0)
                );
                $notice = ['type' => 'success', 'msg' => 'Estado actualizado.'];
                break;
        }
    }

    $events = Facial_Event::get_all_events();
    ?>
    <div class="wrap">
        <h1>Eventos</h1>

        <?php if ($notice): ?>
            <div class="notice notice-<?php echo esc_attr($notice['type']); ?> is-dismissible">
                <p><?php echo esc_html($notice['msg']); ?></p>
            </div>
        <?php endif; ?>

        <!-- ── New event form ── -->
        <div class="card" style="max-width:640px;padding:20px;margin-bottom:28px;">
            <h2 style="margin-top:0;">Nuevo Evento</h2>
            <form method="post">
                <?php wp_nonce_field('facial_events_action'); ?>
                <input type="hidden" name="facial_action" value="create">
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><label for="ev-name">Nombre del evento</label></th>
                        <td>
                            <input type="text" id="ev-name" name="name" class="regular-text" required
                                   placeholder="Torneo Nacional 2026">
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ev-path">Ruta de fotos (servidor)</label></th>
                        <td>
                            <input type="text" id="ev-path" name="photos_path" class="large-text"
                                   placeholder="/var/www/html/wp-content/uploads/eventos/torneo-2026">
                            <p class="description">Ruta absoluta en el servidor donde viven los archivos de imagen.</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="ev-url">URL pública base</label></th>
                        <td>
                            <input type="url" id="ev-url" name="photos_base_url" class="large-text"
                                   placeholder="https://mastkd.com/wp-content/uploads/eventos/torneo-2026">
                            <p class="description">URL accesible desde internet para esa misma carpeta.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button('Crear Evento'); ?>
            </form>
        </div>

        <!-- ── Events list ── -->
        <h2>Eventos existentes</h2>
        <?php if (empty($events)): ?>
            <p>No hay eventos todavía.</p>
        <?php else: ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Slug</th>
                    <th>URL fotos</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($events as $e): ?>
                <tr>
                    <td><?php echo esc_html($e['name']); ?></td>
                    <td><code><?php echo esc_html($e['slug']); ?></code></td>
                    <td style="word-break:break-all;font-size:12px;">
                        <?php echo esc_html($e['photos_base_url'] ?: '—'); ?>
                    </td>
                    <td>
                        <?php if ($e['active']): ?>
                            <span style="color:#16a34a;font-weight:600;">Activo</span>
                        <?php else: ?>
                            <span style="color:#6b7280;">Inactivo</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <form method="post" style="display:inline-block;margin-right:4px;">
                            <?php wp_nonce_field('facial_events_action'); ?>
                            <input type="hidden" name="facial_action" value="toggle">
                            <input type="hidden" name="event_id" value="<?php echo (int) $e['id']; ?>">
                            <input type="hidden" name="active" value="<?php echo $e['active'] ? '0' : '1'; ?>">
                            <button class="button button-small">
                                <?php echo $e['active'] ? 'Desactivar' : 'Activar'; ?>
                            </button>
                        </form>
                        <form method="post" style="display:inline-block;"
                              onsubmit="return confirm('¿Eliminar el evento <?php echo esc_js($e['name']); ?>?')">
                            <?php wp_nonce_field('facial_events_action'); ?>
                            <input type="hidden" name="facial_action" value="delete">
                            <input type="hidden" name="event_id" value="<?php echo (int) $e['id']; ?>">
                            <button class="button button-small button-link-delete">Eliminar</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>
    </div>
    <?php
}
