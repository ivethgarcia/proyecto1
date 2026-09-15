import os
import re

NUEVO_NOMBRE = "Liga de Fútbol García"

# Buscar en todos los archivos HTML y JS
archivos_a_revisar = [f for f in os.listdir('.') if f.endswith(('.html', '.js'))]

for carpeta_js in ['js', 'scripts']:
    if os.path.exists(carpeta_js):
        for f in os.listdir(carpeta_js):
            if f.endswith('.js'):
                archivos_a_revisar.append(os.path.join(carpeta_js, f))

for archivo in archivos_a_revisar:
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()

    # Reemplazar variantes anteriores en la generación de PDF/Documentos
    contenido_nuevo = contenido.replace("LIGA ÉLITE DE FÚTBOL", NUEVO_NOMBRE.upper())
    contenido_nuevo = contenido_nuevo.replace("Liga Élite de Fútbol", NUEVO_NOMBRE)
    contenido_nuevo = contenido_nuevo.replace("Liga Élite", NUEVO_NOMBRE)
    contenido_nuevo = contenido_nuevo.replace("Football League Standings System", NUEVO_NOMBRE)

    if contenido != contenido_nuevo:
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_nuevo)
        print(f"✅ PDF/JS actualizado: {archivo}")

print("\n¡Listo! Ejecuta 'python actualizar.py' en la terminal.")