"""
Chrono Sovereign & Sovereign Cloud - User Registration Portal
------------------------------------------------------------
Author: Daniel Gonzales Martínez
Project: Chrono Shield Networks / ChronoGrid Enterprise Architecture
Description: 
    Handles user onboarding where registrants choose between the grassroots 
    'Sovereign Cloud' (tangible, community, free) or the institutional 
    'Chrono Sovereign Cloud' (B2B, corporate, formal) tier for their dynamic deployments.
"""

import time
import json
import hashlib

class UserRegistrationPortal:
    def __init__(self):
        self.official_domain = "chronoshieldnetworks.com"
        self.available_clouds = {
            "1": {"name": "Sovereign Cloud", "desc": "Libre, tangible y comunitaria (Ideal para devs y nodos locales)"},
            "2": {"name": "Chrono Sovereign Cloud", "desc": "Institucional y corporativa (Ideal para empresas y B2B)"}
        }

    def register_new_user(self, username, project_name, choice_cloud_key, runtime_type):
        """
        Simulates a user selecting their cloud tier during registration 
        and provisioning their dynamic runtime container.
        """
        print(f"\n[*] [Registration Portal] Procesando registro para el usuario: '{username}'...")
        
        if choice_cloud_key not in self.available_clouds:
            choice_cloud_key = "1" # Default to Sovereign Cloud

        selected_cloud = self.available_clouds[choice_cloud_key]
        print(f"  [+] El usuario eligió la rama: {selected_cloud['name']} ({selected_cloud['desc']})")

        # Generar subdominio según la elección del usuario
        subdomain_prefix = f"node-{project_name}" if choice_cloud_key == "1" else f"corp-{project_name}"
        user_endpoint = f"https://{subdomain_prefix}.{self.official_domain}"

        account_id = hashlib.sha256(f"{username}-{time.time()}".encode('utf-8')).hexdigest()[:10]

        registration_manifest = {
            "account_id": account_id,
            "username": username,
            "cloud_choice": selected_cloud["name"],
            "project": project_name,
            "runtime": runtime_type,
            "assigned_endpoint": user_endpoint,
            "status": "ACTIVE_AND_DEPLOYED"
        }

        print(f"  [+] ¡Registro exitoso! Contenedor dinámico compilado ({runtime_type}).")
        print(f"  [+] Tu sitio ya está en línea y soberano en: {user_endpoint}")
        return registration_manifest

if __name__ == "__main__":
    portal = UserRegistrationPortal()
    
    # Simulación de usuario registrándose eligiendo la opción comunitaria/tangible (Sovereign Cloud)
    portal.register_new_user(
        username="carlos_dev",
        project_name="mi-app-libre",
        choice_cloud_key="1",
        runtime_type="nextjs"
    )
