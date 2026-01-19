# Arquitectura Técnica - Paw Paw Urban Show

**Versión:** 1.0.0  
**Fecha:** 18-01-2026  
**Autor:** Arquitecto de Software Principal

## 1. Análisis del Contexto y Situación

**Paw Paw Urban Show** busca establecerse como una plataforma líder en e-commerce de moda urbana. El mercado objetivo (jóvenes) exige una experiencia de usuario (UX) impecable, velocidad extrema y una estética visual fuerte (mobile-first).

### Retos Clave
1.  **Time-to-Market vs. Calidad:** Necesitamos lanzar rápido pero con una base sólida.
2.  **Gestión de Contenido:** La moda requiere cambios constantes de catálogo y banners visuales. Un CMS dedicado es crucial para no depender de desarrolladores para cambios de contenido.
3.  **Escalabilidad:** Se esperan picos de tráfico durante "drops" (lanzamientos de colecciones).
4.  **Seguridad:** Manejo de datos sensibles (auth, pagos).

### Estrategia de Solución: "Hybrid Low-Code Core"
Adoptaremos una arquitectura de **Monolito Modular Distribuido**.
-   **Core de Datos:** PostgreSQL como fuente de la verdad.
-   **Aceleradores:** Directus (CMS + Admin) y PostgREST (API de Lectura) para eliminar el 70% del código boilerplate CRUD.
-   **Lógica de Negocio:** Node.js (Express) para flujos complejos (Pagos, Carrito avanzado).
-   **Frontend:** React (Vite) para una SPA (Single Page Application) reactiva y rápida.

---

## 2. Requisitos Arquitectónicos

### Funcionales (Core)
-   Gestión de Catálogo (Productos, Variantes Talla/Color, Stocks).
-   Carrito de Compras Persistente (Redis).
-   Checkout seguro (Stripe).
-   Gestión de Pedidos y Estado.
-   Autenticación Unificada (Usuarios y Admins).

### No Funcionales (RNF)
-   **Performance:** First Contentful Paint (FCP) < 1.5s en 4G. Respuestas de API < 100ms.
-   **Disponibilidad:** 99.9% durante horario comercial.
-   **Escalabilidad:** Soportar +1000 usuarios concurrentes durante lanzamientos.
-   **Seguridad:** Cumplimiento PCI-DSS (delegado a Stripe), OWASP Top 10 mitigado en Gateway.

---

## 3. Propuesta Arquitectónica (C4 Model)

### Diagrama de Contenedores (Nivel 2)

```mermaid
graph TD
    User((Usuario Web/Móvil))
    Admin((Administrador))

    subgraph "Infraestructura Paw Paw (Docker Compose / K8s)"
        Nginx[Nginx Reverse Proxy]
        
        subgraph "Data Layer"
            Postgres[(PostgreSQL\nPrimary DB)]
            Redis[(Redis\nCache & Session)]
        end

        subgraph "Application Layer"
            Kong[Kong API Gateway\n(Auth, Rate Limit, Routing)]
            
            Directus[Directus CMS\n(Headless Management)]
            PostgREST[PostgREST\n(High Perf Read API)]
            NodeAPI[Node.js Express Service\n(Business Logic, Payments)]
        end
    end

    User -->|HTTPS| Nginx
    Admin -->|HTTPS| Nginx
    
    Nginx -->|/api| Kong
    Nginx -->|/admin| Directus
    
    Kong -->|/auth, /content| Directus
    Kong -->|/catalog| PostgREST
    Kong -->|/checkout, /cart| NodeAPI
    
    Directus --> Postgres
    Directus --> Redis
    
    PostgREST --> Postgres
    
    NodeAPI --> Postgres
    NodeAPI --> Redis
    NodeAPI --> StripeAPI[Stripe API]
```

### Descripción de Componentes

| Componente | Tecnología | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Client App** | React + Vite | UI/UX, Estado global (Zustand), Interacción. |
| **Reverse Proxy** | Nginx | Terminación SSL, Compresión Gzip/Brotli, Routing estático. |
| **API Gateway** | Kong | Unificación de APIs, Rate Limiting, Validación JWT centralizada. |
| **CMS / Auth** | Directus | Gestión de catálogo, Auth provider, Gestión de medios (imágenes). |
| **Data API** | PostgREST | API REST instantánea sobre la DB. Ideal para listar productos, filtros y búsquedas. |
| **Business Service** | Node.js | Lógica compleja: Cálculo de impuestos, Integración Stripe, Validaciones de stock atómico. |
| **Database** | PostgreSQL | Almacenamiento relacional, integridad referencial, funciones SQL. |
| **Cache** | Redis | Caché de respuestas API, Sesiones de carrito, Colas de tareas (bull). |

---

## 4. Decisiones Técnicas y Justificación

### 1. ¿Por qué Directus + PostgREST?
*   **Justificación:** Escribir APIs CRUD (Create, Read, Update, Delete) para un catálogo de productos es repetitivo y propenso a errores. Directus nos da el Panel de Admin GRATIS y una API robusta. PostgREST es significativamente más rápido que una API Node.js tradicional para lecturas, ya que convierte HTTP directamente a SQL optimizado.
*   **Trade-off:** Menos control "línea por línea" en la capa de lectura, pero se mitiga moviendo lógica compleja a SQL o al servicio Node.js.

### 2. ¿Por qué PostgreSQL como única fuente de verdad?
*   **Justificación:** La integridad de los datos de pedidos e inventario es crítica. NoSQL (Mongo) podría complicar las transacciones y relaciones (Producto -> Categoría -> Variante). JSONB en Postgres nos permite flexibilidad si la necesitamos.

### 3. ¿Por qué Kong Gateway?
*   **Justificación:** Necesitamos exponer múltiples servicios (Directus, PostgREST, Node) como una sola API coherente (`/api/v1/...`). Kong maneja esto, más seguridad (CORS, JWT verify) sin ensuciar el código de los microservicios.

### 4. Estrategia de Autenticación
*   Usaremos el sistema de Auth de **Directus** para generar JWTs.
*   Kong validará la firma del JWT antes de dejar pasar la petición a los servicios internos.

---

## 5. Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
| :--- | :--- | :--- | :--- |
| **Complejidad de Infraestructura Local** | Alta | Medio | Crear scripts de `init` robustos y un `docker-compose` bien documentado. |
| **Consistencia de Datos en Caché** | Media | Alto | Implementar invalidación de caché por eventos (Webhook de Directus -> Redis flush). |
| **Dependencia de Directus** | Baja | Alto | Mantener la lógica de negocio core desacoplada (en SQL o Node), usando Directus principalmente como UI de datos. |

---

## 6. Roadmap de Implementación

### Fase 1: Fundamentos (Sprints 1-2)
-   Setup de Docker Compose (Postgres, Directus, Redis).
-   Diseño del esquema de base de datos (Productos, Categorías).
-   Configuración de Directus para gestión de catálogo.

### Fase 2: API & Frontend Read-Only (Sprints 3-4)
-   Configurar PostgREST para exponer el catálogo público.
-   Desarrollo de Frontend: Home, Listado de Productos (PLP), Detalle de Producto (PDP).
-   Búsqueda y Filtros.

### Fase 3: Transaccionalidad (Sprints 5-6)
-   Implementar Servicio Node.js.
-   Lógica de Carrito (Redis).
-   Integración Stripe (Checkout).
-   Creación de Pedidos en DB.

### Fase 4: Hardening & Launch (Sprint 7)
-   Configurar Kong Gateway (Rate limiting, Security).
-   Load Testing.
-   Despliegue a Staging.

---

## 7. Recomendaciones para el Equipo

-   **Frontend:** Usar `TanStack Query` para el manejo de estado asíncrono (server state). Usar componentes atómicos.
-   **Backend:** Mantener los controladores "delgados" (thin controllers). Mover lógica de negocio a Servicios o Casos de Uso.
-   **Database:** NUNCA usar `SELECT *` en producción. Crear índices para todas las claves foráneas y columnas de filtro.
-   **Git:** Usar Conventional Commits (`feat:`, `fix:`, `chore:`).
