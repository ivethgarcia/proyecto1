import os
import re

archivo_login = 'login.html'

if os.path.exists(archivo_login):
    with open(archivo_login, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Oculta o remueve los bloques comunes que contienen texto de credenciales de prueba
    # 1. Remueve divs con texto de credenciales/demo/ejemplo
    contenido_limpio = re.sub(
        r'<div[^>]*>(?:(?!</div>).)*?(?:credenciales|demo|admin@|contraseña|password)(?:(?!</div>).)*?</div>',
        '',
        contenido,
        flags=re.IGNORECASE | re.DOTALL
    )

    with open(archivo_login, 'w', encoding='utf-8') as f:
        f.write(contenido_limpio)
    print(f"✅ Credenciales removidas de: {archivo_login}")

# CSS de respaldo para ocultar cualquier contenedor de credenciales o avisos en login
estilos_ocultar_credenciales = """

/* --- Ocultar tarjeta/bloque de credenciales en Login --- */
.credentials-box, .demo-credentials, #demo-credentials, .alert-info, .bg-blue-50 {
  display: none !important;
}
"""

rutas_css = ['styles.css', 'css/estilos.css']
for ruta in rutas_css:
    if os.path.exists(ruta):
        with open(ruta, 'a', encoding='utf-8') as f:
            f.write(estilos_ocultar_credenciales)
        print(f"🎨 Regla de ocultamiento CSS aplicada en: {ruta}")

print("\n¡Listo! Ejecuta el script para actualizar el login.")