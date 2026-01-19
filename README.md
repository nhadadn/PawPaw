# Paw Paw Urban Show 🐾🛹

> **E-commerce de moda urbana para la nueva generación.**
> *Estilo, velocidad y cultura.*

## 🏗 Arquitectura del Sistema

Este proyecto utiliza una arquitectura de **Monolito Modular Distribuido**, optimizada para velocidad de desarrollo y alto rendimiento.

### Stack Tecnológico

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS.
*   **CMS & Admin:** [Directus](https://directus.io/) (Headless CMS).
*   **Database:** PostgreSQL 15.
*   **Cache:** Redis 7.
*   **API Layer:** PostgREST (Lectura rápida) + Node.js (Lógica de negocio).
*   **Gateway:** Kong / Nginx.

### Estructura del Repositorio

```bash
/
├── docs/           # Documentación de Arquitectura (ADRs, Diagramas)
├── backend/        # Servicio Node.js (Express) para lógica de negocio compleja
├── frontend/       # Aplicación React (Vite)
├── database/       # Scripts SQL, migraciones y seeds
└── docker-compose.yml # Orquestación de infraestructura local
```

## 🚀 Quick Start

1.  **Requisitos:** Docker y Docker Compose instalados.
2.  **Iniciar Infraestructura:**
    ```bash
    docker-compose up -d
    ```
3.  **Acceder a Servicios:**
    *   **Directus Admin:** [http://localhost:8055](http://localhost:8055) (Admin: admin@pawpaw.com / admin123)
    *   **PostgREST API:** [http://localhost:3000](http://localhost:3000)
    *   **Base de Datos:** `localhost:5432`

## 📖 Documentación

Consulta [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) para detalles profundos sobre las decisiones técnicas, diagrama C4 y roadmap.

---
**Paw Paw Urban Show Team** - *Architected for Scale.*
