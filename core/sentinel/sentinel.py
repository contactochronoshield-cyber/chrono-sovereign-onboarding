#!/usr/bin/env python3
"""
Sentinel Core - IA Centinela Soberana
Detecta anomalías, bloquea tráfico malicioso de infraestructuras corporativas (AWS/Azure)
y gestiona la salud de los nodos hermanos en la red mesh.
"""
import sys
import json
import time

# Lista simulada de ASNs / IPs corporativas a rechazar por soberanía
CORPORATE_BLACKLIST_NETWORKS = ["amazon", "microsoft-azure", "google-cloud", "cloudflare-bot"]

def analyze_traffic(source_ip, user_agent, asn_owner):
    print(f"[*] [Sentinel AI] Analizando tráfico entrante desde IP: {source_ip} (ASN: {asn_owner})")
    
    # Comprobación heurística anti-corporativa
    for corp in CORPORATE_BLACKLIST_NETWORKS:
        if corp in asn_owner.lower():
            print(f"🚨 [ALERTA CENTINELA] Intrusión detectada de infraestructura corporativa ({corp}). ¡EXPULSADO!")
            block_node(source_ip)
            return False
            
    print("✅ [Sentinel AI] Tráfico limpio y comunitario. Acceso concedido a la red mesh.")
    return True

def block_node(ip):
    # Aquí aplicaría la regla de iptables o bloqueo en el proxy Caddy local
    print(f"🔒 [DEFENSA] IP {ip} añadida a la lista negra del nodo soberano.")

if __name__ == "__main__":
    # Prueba rápida del centinela
    print("🛡️ Iniciando Sentinel Core v1.0 - Modo Pro-Latam Activo...")
    # Simulación de una prueba de conexión
    analyze_traffic("54.230.14.12", "Mozilla/5.0", "Amazon.com Inc. (AWS)")
