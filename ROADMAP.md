# Chrono Cloud — Roadmap

Este documento consolida la especificación conceptual de Chrono Cloud (67 secciones)
con el estado real de CSN, y define el orden de construcción.

## Estado actual vs spec

| Capa del spec | Estado real |
|---|---|
| Control Plane / Identity / RBAC | No existe unificado — cada servicio tiene auth propio |
| Chrono Storage / Database / Vector DB | No construido — brecha más grande |
| Chrono Network / DNS privado | Parcial: chrono-backbone (BGP/FRR, ASN propio) cubre routing |
| Chrono Edge / Nodes / Mesh | Existe: Chrono Mesh Node (hardware) + Chrono Shield Mesh Dashboard |
| VPN / Network privado | Existe: wireguard-vpn-provisioning (ChronoLink en Rust) |
| Security / Observability básica | Existe: Chrono Guardian, AAP, Chrono Sentinel |
| Offline / Chrono Sync | No construido |
| Chrono AI (local/híbrida) | No construido — mayor oportunidad de diferenciación |
| Multi-tenant / Billing | No construido |
| Chrono Orbital (satélite/failover) | Existe — no está en el spec original, es ventaja adicional de CSN |

## Prioridades de construcción

### 1. Chrono Storage
- Object Storage: MinIO (S3-compatible) sobre infraestructura propia
- Metadata DB: tabla simple (file_id, org_id, hash, path, storage_node) en Postgres o SQLite
- Replicación mínima entre 2 nodos (ej. CR-BOG-01 + uno adicional)
- Versionado: nativo en MinIO, solo requiere configuración

### 2. Consolidar Identity / Control Plane
- Unificar auth entre mesh dashboard, network hub, vortex y demás servicios
- Base para vender "una plataforma", no herramientas sueltas

### 3. Chrono Database managed
- Envolver Postgres/Redis con provisioning automático
- Reusar patrones de csn-environment

### 4. Vector DB + Chrono AI básica
- Diferenciador clave frente a AWS/GCP: AI local/offline
- Extender lo ya construido con Guardian/AAP en Termux

### 5. Chrono Offline formalizado
- Empaquetar la capacidad de nodos sin internet como feature vendible

### 6. Multi-tenant y Billing
- Dejar para el final — solo relevante con clientes pagando por Storage/Compute

## Diferenciadores frente a AWS/GCP/Azure en LATAM
1. Chrono Offline — nodos operativos sin internet
2. Chrono Orbital — failover satelital/multi-operador
3. Hardware soberano vendible — Chrono Mesh Node físico
