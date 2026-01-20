# Admin API Documentation

## Overview
This document details the Admin API endpoints for managing Products, Categories, Orders, Inventory, Users, and Dashboard statistics.
All endpoints are prefixed with `/api/admin` and require authentication with `admin` role.

## Authentication
**Header:** `Authorization: Bearer <token>`

### Login
- **POST** `/login`
- **Body:** `{ "email": "admin@example.com", "password": "..." }`
- **Response:** `{ "token": "..." }`

## Products

### List Products
- **GET** `/products`
- **Query Params:** `page` (default 1), `limit` (default 10)
- **Response:** Array of products with category and variants.

### Get Product
- **GET** `/products/:id`
- **Response:** Product details including variants.

### Create Product
- **POST** `/products`
- **Body:**
  ```json
  {
    "name": "New Product",
    "slug": "new-product",
    "priceCents": 1000,
    "currency": "MXN",
    "categoryId": 1,
    "isActive": true,
    "isDrop": false
  }
  ```

### Update Product
- **PUT** `/products/:id`
- **Body:** Partial product object (e.g., `{ "priceCents": 1200 }`)

### Delete Product
- **DELETE** `/products/:id`
- **Response:** 204 No Content

## Categories

### List Categories
- **GET** `/categories`

### Create Category
- **POST** `/categories`
- **Body:** `{ "name": "T-Shirts", "slug": "t-shirts" }`

## Orders

### List Orders
- **GET** `/orders`
- **Query Params:** `page`, `limit`

### Get Order
- **GET** `/orders/:id`

### Update Order Status
- **PUT** `/orders/:id/status`
- **Body:** `{ "status": "shipped" }`

## Inventory

### Update Inventory
- **PUT** `/inventory/:id`
- **Body:** `{ "initialStock": 100, "reservedStock": 0 }`

## Users

### List Users
- **GET** `/users`

### Update User Status
- **PUT** `/users/:id/status`
- **Body:** `{ "role": "admin" }`

## Dashboard

### Get Stats
- **GET** `/dashboard/stats`
- **Response:**
  ```json
  {
    "totalOrders": 150,
    "totalProducts": 45,
    "totalUsers": 120,
    "totalSales": 500000
  }
  ```
