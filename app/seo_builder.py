"""
Chrono SEO Generator - Optimización automática para visibilidad web soberana.
"""
import os

def generate_seo_meta(subdomain, site_title="Sitio Soberano"):
    seo_template = f"""
    <!-- SEO Optimizado por Sovereign Cloud -->
    <title>{site_title} | {subdomain}.chronoshield.cloud</title>
    <meta name="description" content="Sitio web de alto rendimiento desplegado en la red soberana y descentralizada.">
    <meta name="robots" content="index, follow">
    <meta property="og:title" content="{site_title}">
    <meta property="og:url" content="https://{subdomain}.chronoshield.cloud">
    <link rel="canonical" href="https://{subdomain}.chronoshield.cloud">
    """
    return seo_template
