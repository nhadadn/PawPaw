# PawPawTRC: Urban Fashion E-commerce 🐾🛹

> **Plataforma de E-commerce de Alto Rendimiento para Moda Urbana.**
> *Drops exclusivos, Pagos seguros y Experiencia de Usuario premium.*

![Version](https://img.shields.io/badge/version-2.1.1-blue.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Tech Stack](https://img.shields.io/badge/stack-PERN-orange.svg)

## 📋 Descripción General

**PawPawTRC** es una solución completa de comercio electrónico diseñada para manejar lanzamientos de productos de alta demanda ("Drops"). El sistema garantiza la integridad del inventario mediante reservas atómicas en tiempo real y ofrece una experiencia de compra fluida y segura.

Actualmente en fase de **Preparación para QA**, el proyecto cuenta con un backend robusto dockerizado y un frontend moderno con soporte para modo oscuro.

---

## ✨ Características Principales (Key Features)

### 🛍️ Experiencia de Compra (Storefront)
*   **Checkout Seguro:** Integración completa con **Stripe Elements** para procesamiento de pagos.
*   **Gestión de Inventario en Tiempo Real:** Sistema de reservas temporales (15 min) que previene sobreventas durante picos de tráfico.
*   **Dark Mode System:** Interfaz adaptable (Claro/Oscuro) con detección automática de preferencias del sistema y persistencia local.
*   **Diseño Responsive:** UI optimizada para móviles (Mobile-First) usando Tailwind CSS.

### 🛡️ Panel de Administración (Backoffice)
*   **Dashboard Interactivo:** Métricas clave de ventas y órdenes en tiempo real.
*   **Gestión de Catálogo:** CRUD completo para Productos y Categorías con soporte de imágenes.
*   **Control de Órdenes:** Visualización detallada de pedidos y estados de pago.
*   **Seguridad:** Autenticación basada en roles (Admin/User) y protección de rutas.

---

## 🏗️ Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura de **Monolito Modular**, separando claramente las responsabilidades pero manteniendo la simplicidad de despliegue.

### Backend (API REST)
*   **Runtime:** Node.js + Express
*   **Lenguaje:** TypeScript
*   **Base de Datos:** PostgreSQL 15 (Gestionado con **Prisma ORM**)
*   **Cache & Bloqueos:** Redis 7 (Para Rate Limiting y control de concurrencia)
*   **Pagos:** Stripe SDK
*   **Testing:** Jest + Supertest (Cobertura de integración completa)

### Frontend (SPA)
*   **Framework:** React 18 + Vite
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS + clsx
*   **Estado:** Zustand (Global Store) + React Context (Theme)
*   **Testing:** Cypress (E2E) + Vitest (Unitarios)

---

## 🚀 Guía de Inicio Rápido (Quick Start)

### Requisitos Previos
*   [Node.js](https://nodejs.org/) (v18 o superior)
*   [Docker Desktop](https://www.docker.com/) (para DB y Redis)
*   [Git](https://git-scm.com/)

### 1. Configuración del Entorno
Clona el repositorio y configura las variables de entorno:

```bash
git clone https://github.com/tu-usuario/pawpaw-trc.git
cd PawPawChuy

# Copiar ejemplos de .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 2. Infraestructura (Base de Datos)
Inicia los servicios de soporte (Postgres y Redis) usando Docker:

```bash
docker-compose up -d
```

### 3. Instalación y Migraciones
Configura el backend y la base de datos:

```bash
cd backend
npm install

# Ejecutar migraciones de Prisma
npx prisma migrate dev

# (Opcional) Popular datos de prueba
npm run seed
```

Configura el frontend:

```bash
cd ../frontend
npm install
```

### 4. Ejecución
Puedes correr ambos servicios en terminales separadas:

**Backend (Puerto 4000):**
```bash
# Desde /backend
npm run dev
```

**Frontend (Puerto 5173):**
```bash
# Desde /frontend
npm run dev
```

Visita `http://localhost:5173` para ver la tienda.

---

## 🧪 Testing

El proyecto cuenta con una estrategia de testing multinivel.

### Backend Tests
Pruebas unitarias y de integración para la API.

```bash
cd backend
npm test
```

### Frontend Tests
Pruebas de componentes y flujos críticos E2E.

```bash
cd frontend
# Unitarios
npm run test

# E2E (Cypress)
npm run cypress:open
```

---

## � Documentación Adicional

Para detalles técnicos profundos, consulta los documentos en la carpeta `docs/`:

*   [**QA Ready Report**](./docs/QA_READY.md): Estado actual de calidad y pasos para QA.
*   [**CHANGELOG Completo**](./CHANGELOG.md): Registro unificado de todos los cambios del proyecto.
*   [**Gestión de Imágenes**](./docs/IMAGE_MANAGEMENT.md): Diagnóstico y flujo técnico de imágenes.
*   [**Admin API Implementation**](./backend/ADMIN_IMPLEMENTATION.md): Detalles de la API administrativa.
*   [**Frontend Changelog**](./FRONTEND_CHANGELOG.md): Registro de cambios recientes en UI.
*   [**Database Design**](./docs/DATABASE_DESIGN.md): Esquema de base de datos.

---

**PawPawTRC Team** - *Built for Speed, Designed for Style.*
