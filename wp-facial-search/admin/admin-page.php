<?php
defined('ABSPATH') || exit;

function facial_render_admin_page(): void {
    $api      = new Facial_Api_Client();
    $online   = $api->health();
    $athletes = Facial_Athlete::get_all();
    $events   = Facial_Event::get_active_events();
    ?>
    <div class="wrap">
        <h1>Facial Search — Dashboard</h1>

        <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;">
            <div class="card" style="flex:1;min-width:180px;padding:16px;">
                <h2 style="margin-top:0;font-size:15px;">Estado de la API</h2>
                <?php if ($online): ?>
                    <p style="color:#16a34a;font-weight:600;">● Conectada</p>
                <?php else: ?>
                    <p style="color:#dc2626;font-weight:600;">● Desconectada</p>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=facial-settings')); ?>">
                        Configurar →
                    </a>
                <?php endif; ?>
            </div>

            <div class="card" style="flex:1;min-width:180px;padding:16px;">
                <h2 style="margin-top:0;font-size:15px;">Atletas registrados</h2>
                <p style="font-size:2rem;margin:0;font-weight:700;"><?php echo count($athletes); ?></p>
            </div>

            <div class="card" style="flex:1;min-width:180px;padding:16px;">
                <h2 style="margin-top:0;font-size:15px;">Eventos activos</h2>
                <p style="font-size:2rem;margin:0;font-weight:700;"><?php echo count($events); ?></p>
                <a href="<?php echo esc_url(admin_url('admin.php?page=facial-events')); ?>">Gestionar →</a>
            </div>
        </div>

        <?php if (!empty($athletes)): ?>
        <h2>Atletas</h2>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Registrado</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($athletes as $a): ?>
                <tr>
                    <td><?php echo esc_html($a['email']); ?></td>
                    <td><?php echo esc_html($a['name'] ?: '—'); ?></td>
                    <td><?php echo esc_html($a['created_at']); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        <?php else: ?>
            <p>Todavía no hay atletas registrados. El widget en el sitio se encarga del registro automático.</p>
        <?php endif; ?>
    </div>
    <?php
}
