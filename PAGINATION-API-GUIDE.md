# Product Pagination API Guide

## Endpoint

`GET /api/v1/pagination`

## Query Parameters

| Parameter | Type    | Required | Default | Description               |
| --------- | ------- | -------- | ------- | ------------------------- |
| `page`    | integer | No       | 1       | Page number (must be > 0) |
| `perPage` | integer | No       | 12      | Items per page (1-100)    |

## Example Requests

### Default pagination (page 1, 12 items)

```bash
curl -X GET "http://localhost:3000/api/v1/pagination"
```

### Specific page with default items per page

```bash
curl -X GET "http://localhost:3000/api/v1/pagination?page=2"
```

### Custom items per page

```bash
curl -X GET "http://localhost:3000/api/v1/pagination?page=1&perPage=20"
```

### Get page 3 with 24 items per page

```bash
curl -X GET "http://localhost:3000/api/v1/pagination?page=3&perPage=24"
```

### Get first 50 items

```bash
curl -X GET "http://localhost:3000/api/v1/pagination?perPage=50"
```

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Products retrieved successfully",
  "data": {
    "products": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Product Name",
        "description": "Product description",
        "category": {
          "_id": "...",
          "name": "Category Name"
        },
        "subCategory": {
          "_id": "...",
          "name": "SubCategory Name"
        },
        "brand": {
          "_id": "...",
          "name": "Brand Name"
        },
        "variants": [...],
        "discounts": [...],
        "sku": "SKU-001",
        "retailPrice": 99.99,
        "wholesalePrice": 79.99,
        "stock": 100,
        "images": [...],
        "createdAt": "2025-10-31T10:00:00.000Z",
        "updatedAt": "2025-10-31T10:00:00.000Z"
      }
      // ... more products
    ],
    "pagination": {
      "currentPage": 1,
      "perPage": 12,
      "totalPages": 5,
      "totalProducts": 58,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Empty Database Response

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "No products found",
  "data": {
    "products": [],
    "pagination": {
      "currentPage": 1,
      "perPage": 12,
      "totalPages": 0,
      "totalProducts": 0,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### Error Response (Invalid Page)

```json
{
  "success": false,
  "statusCode": 400,
  "status": "error",
  "message": "Page number must be greater than 0"
}
```

### Error Response (Invalid perPage)

```json
{
  "success": false,
  "statusCode": 400,
  "status": "error",
  "message": "Items per page must be between 1 and 100"
}
```

## Features

- ✅ Sequential ordering (newest products first based on `createdAt`)
- ✅ Flexible page number (defaults to 1)
- ✅ Flexible items per page (defaults to 12, max 100)
- ✅ Complete pagination metadata
- ✅ Total items count
- ✅ Total pages calculation
- ✅ Next/previous page indicators
- ✅ Populates all related fields (category, subCategory, brand, variants, discounts)
- ✅ Input validation for page and perPage parameters
- ✅ Handles empty database gracefully

## Pagination Metadata Explained

| Field           | Description                                   |
| --------------- | --------------------------------------------- |
| `currentPage`   | The current page number requested             |
| `perPage`       | Number of items per page                      |
| `totalPages`    | Total number of pages available               |
| `totalProducts` | Total count of all products in database       |
| `hasNextPage`   | Boolean indicating if there's a next page     |
| `hasPrevPage`   | Boolean indicating if there's a previous page |

## Use Cases

### Frontend Pagination Component

```javascript
// Calculate if buttons should be enabled
const canGoPrevious = pagination.hasPrevPage;
const canGoNext = pagination.hasNextPage;

// Show page info
console.log(`Page ${pagination.currentPage} of ${pagination.totalPages}`);
console.log(
  `Showing ${products.length} of ${pagination.totalProducts} products`
);
```

### Load More Pattern

```javascript
// Start with page 1, perPage 12
let currentPage = 1;

// On "Load More" click
currentPage++;
fetch(`/api/v1/pagination?page=${currentPage}&perPage=12`);
```

### Custom Page Size

```javascript
// Allow user to select items per page
const itemsPerPage = 24; // User selected
fetch(`/api/v1/pagination?page=1&perPage=${itemsPerPage}`);
```
