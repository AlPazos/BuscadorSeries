# Buscador de Series

Proyecto personal: un buscador de películas y series con catálogo de TMDB y cuentas de usuario propias. Todo corre en capas gratuitas permanentes (es una decisión de diseño, no casualidad).

## Arquitectura

Este es el frontend del proyecto, una SPA React 19 + Vite que se conecta a:

- **Cloudflare Worker (edge)**: proxy de TMDB y de la API de usuarios
- **Backend API**: Quarkus/Java 21 en AWS Lambda

La arquitectura completa consta de tres capas:
1. Frontend: SPA React 19 + Vite con diseño synthwave
2. Edge: Cloudflare Worker que sirve como proxy a TMDB y a la API de usuarios
3. Backend: API REST en Quarkus/Java 21 en AWS Lambda

## Características

- Catálogo de películas y series desde TMDB
- Cuentas de usuario propias con autenticación (registro, login, JWT)
- Verificación de email con Resend
- Login con Google
- Favoritos y preferencias de usuario
- Diseño synthwave

## Estructura del proyecto

El frontend está construido con React 19 + Vite y sigue una estructura modular:

### Rutas principales:
- `/` → Descubrir (pantalla principal con tendencias)
- `/buscar` → Búsqueda de películas/series
- `/mis-favoritos` → Lista de favoritos del usuario
- `/perfil` → Perfil del usuario y gestión de cuenta

### Componentes clave:
- Dock: navegación principal flotante
- CardNav: menú flotante con opciones de navegación
- Autenticación: modal de login con Google
- Vistas: Descubrir, Buscar, Mis favoritos, Detalle, Perfil

### Datos y API:
- Conexión a TMDB mediante proxy en Cloudflare Worker
- API de usuarios a través de Lambda Function URL (no expuesta públicamente)
- Tema sincronizado con backend

## Despliegue

El frontend se despliega como SPA en Cloudflare Pages, mientras que el Worker hace de proxy a la API backend. La infraestructura está configurada para co-locar la Lambda y la base de datos en eu-west-3 (Paris) para reducir latencia.

## Seguridad

- La URL de la Lambda no es pública para evitar denial of wallet
- El Worker utiliza variables de entorno seguras para TMDB y usuarios
- No hay credenciales reales comprometidas en el repositorio
- Los secretos se manejan mediante Cloudflare Workers y AWS Lambda

## Tecnologías utilizadas

- Frontend: React 19, Vite, TypeScript
- Estilos: CSS con variables personalizadas
- Componentes: motion/react, WebGL (Aurora)
- Build: Vite
- Despliegue: Cloudflare Pages + Workers
- Backend: Quarkus/Java 21 en AWS Lambda
