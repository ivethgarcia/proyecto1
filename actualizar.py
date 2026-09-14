import os
import re

# 1. Corregir duplicaciones de texto en todos los archivos HTML
archivos_html = [f for f in os.listdir('.') if f.endswith('.html')]

for archivo in archivos_html:
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Arregla el error de texto duplicado en el banner
    contenido = contenido.replace("Liga de Fútbol García de Fútbol", "Liga de Fútbol García")
    contenido = contenido.replace("Football League Standings System", "Liga de Fútbol García")
    contenido = contenido.replace("Liga Élite", "Liga de Fútbol García")
    contenido = contenido.replace("Liga Pink Premier", "Liga de Fútbol García")

    with open(archivo, 'w', encoding='utf-8') as f:
        f.write(contenido)
    print(f"✅ Texto corregido en: {archivo}")

# 2. Aplicar Fondo Azul Cielo y Letras Negras en los archivos CSS
rutas_css = ['styles.css', 'css/estilos.css']

estilos_azul_cielo = """

/* --- Ajuste de Banner: Fondo Azul Cielo y Texto Negro --- */
header, .header, .navbar, .banner, .hero, [class*="bg-gradient"], [class*="bg-blue"] {
  background: #87CEEB !important; /* Azul Cielo */
  background-color: #87CEEB !important;
  color: #000000 !important;
}

header h1, .header h1, .navbar h1, .banner h1, .hero h1,
header h2, .header h2, .navbar h2, .banner h2, .hero h2 {
  color: #000000 !important; /* Texto del título en Negro */
  font-weight: bold !important;
}

header span, header p, .header span, .header p {
  color: #1A1A1A !important; /* Subtítulos en gris muy oscuro para excelente contraste */
}
"""

for ruta in rutas_css:
    if os.path.exists(ruta):
        with open(ruta, 'a', encoding='utf-8') as f:
            f.write(estilos_azul_cielo)
        print(f"🎨 Estilos Azul Cielo aplicados en: {ruta}")

print("\n¡Listo! Ejecuta el script para aplicar los cambios.")