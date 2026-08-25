"""
Sovereign Marketplace Config - Conexión de Datos y Nodos
"""
import os

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://tu-proyecto.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY", "tu-clave-anonima")
PLATFORM_MODE = "SOVEREIGN_MESH"

print(f"[*] Configuración cargada para modo: {PLATFORM_MODE}")
