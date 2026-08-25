import os
from flask import Flask, render_template_string, request, redirect, url_for
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = os.path.abspath('users_sites')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Plantilla HTML limpia y directa para que el usuario suba su web estática
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Sovereign Cloud — Despliegue Comunitario</title>
    <style>
        body { font-family: monospace; background: #0f172a; color: #38bdf8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: #1e293b; padding: 30px; border-radius: 8px; border: 1px solid #334155; width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
        h2 { color: #f8fafc; margin-top: 0; font-size: 1.2rem; }
        input[type="text"], input[type="file"] { width: 100%; padding: 10px; margin: 10px 0; background: #0f172a; border: 1px solid #475569; color: #fff; border-radius: 4px; box-sizing: border-box;}
        button { background: #0284c7; color: white; border: none; padding: 10px; width: 100%; border-radius: 4px; cursor: pointer; font-weight: bold; }
        button:hover { background: #0369a1; }
        .footer { margin-top: 15px; font-size: 0.8rem; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <h2>🚀 Sovereign Cloud Onboarding</h2>
        <p style="font-size: 0.9rem; color: #cbd5e1;">Despliega tu sitio estático libre de corporaciones.</p>
        <form method="POST" action="/deploy" enctype="multipart/form-data">
            <label>Nombre de tu Subdominio:</label>
            <input type="text" name="subdomain" placeholder="ej. miprojecto" required>
            <label>Sube tu archivo .zip o HTML:</label>
            <input type="file" name="site_file" required>
            <button type="submit">Desplegar en la Red</button>
        </form>
        <div class="footer">Infraestructura Autónoma Pro-Latam</div>
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/deploy', methods=['POST'])
def deploy():
    subdomain = request.form.get('subdomain')
    file = request.files.get('site_file')
    
    if subdomain and file:
        safe_sub = secure_filename(subdomain)
        user_dir = os.path.join(app.config['UPLOAD_FOLDER'], safe_sub)
        os.makedirs(user_dir, exist_ok=True)
        
        filepath = os.path.join(user_dir, secure_filename(file.filename))
        file.save(filepath)
        
        return f"""
        <body style="font-family: monospace; background: #0f172a; color: #4ade80; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <div style="background: #1e293b; padding: 30px; border-radius: 8px; border: 1px solid #334155; text-align: center;">
                <h2>¡Despliegue Exitoso!</h2>
                <p>Tu sitio ha sido asignado al subdominio soberano:</p>
                <code style="background: #0f172a; padding: 5px 10px; color: #38bdf8; display: block; margin: 15px 0;">http://{safe_sub}.chronoshield.cloud</code>
                <p style="color: #94a3b8; font-size: 0.85rem;">Contenedor aislado y activo en la red mesh.</p>
                <a href="/" style="color: #38bdf8; text-decoration: none; display: inline-block; margin-top: 15px;">← Volver al inicio</a>
            </div>
        </body>
        """
    return "Error en los datos de despliegue", 400

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    print("[+] Servidor de Onboarding Real iniciado en puerto 5000...")
    app.run(host='0.0.0.0', port=5000)
