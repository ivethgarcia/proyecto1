import os
import re

archivo_login = 'login.html'

if os.path.exists(archivo_login):
    with open(archivo_login, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Elimina el bloque entero que contiene "Modo de Acceso:"
    # Busca la etiqueta <div> que encierra la alerta de credenciales
    patron = r'<div[^>]*>(?:(?!</div>).)*?Modo de Acceso:(?:(?!</div>).)*?</div>'
    contenido_nuevo = re.sub(patron, '', contenido, flags=re.DOTALL)

    # Si la etiqueta exterior es más amplia o usa otra estructura, elimina por frases clave
    contenido_nuevo = contenido_nuevo.replace("Si aún no configuras Supabase, usa las credenciales de prueba:", "")
    contenido_nuevo = contenido_nuevo.replace("Email: admin@torneo.com", "")
    contenido_nuevo = contenido_nuevo.replace("Password: admin123", "")
    contenido_nuevo = contenido_nuevo.replace("Modo de Acceso:", "")

    with open(archivo_login, 'w', encoding='utf-8') as f:
        f.write(contenido_nuevo)
    print(f"✅ Recuadro de credenciales removido con éxito de: {archivo_login}")
else:
    print(f"⚠️ No se encontró el archivo {archivo_login}")

# Regla CSS adicional para ocultar cualquier recuadro sobrante de tipo alert o info en login
estilos_ocultar = """

/* --- Ocultar tarjeta de credenciales de prueba --- */
.bg-amber-50, .bg-blue-50, .bg-yellow-50, [class*="border-amber"], [class*="border-yellow"] {
  display: none !important;
}
"""

rutas_css = ['styles.css', 'css/estilos.css']
for ruta in rutas_css:
    if os.path.exists(ruta):
        with open(ruta, 'a', encoding='utf-8') as f:
            f.write(estilos_ocultar)
        print(f"🎨 Ocultamiento forzado en CSS: {ruta}")

print("\n¡Listo! Corre el script en la terminal para aplicar el cambio.")