# Coupon API Guide

## Overview

The Coupon system allows admins to create discount coupons that customers can apply to their cart for discounts. Coupons support both percentage-based and fixed amount discounts with various validation rules.

## Table of Contents

- [Coupon Model](#coupon-model)
- [Admin Endpoints](#admin-endpoints)
- [Customer Endpoints](#customer-endpoints)
- [Cart Integration](#cart-integration)
- [Examples](#examples)

---

## Coupon Model

### Coupon Fields

| Field                | Type    | Required | Description                                    |
| -------------------- | ------- | -------- | ---------------------------------------------- |
| `code`               | String  | Yes      | Unique coupon code (uppercase, e.g., "SAVE20") |
| `slug`               | String  | Auto     | URL-friendly version of code                   |
| `description`        | String  | No       | Coupon description                             |
| `discountType`       | String  | Yes      | "percentage" or "fixed"                        |
| `discountValue`      | Number  | Yes      | Discount amount (% or ৳)                       |
| `minPurchaseAmount`  | Number  | No       | Minimum cart total required (default: 0)       |
| `maxDiscountAmount`  | Number  | No       | Maximum discount cap for percentage            |
| `expireAt`           | Date    | Yes      | Expiration date                                |
| `usageLimit`         | Number  | No       | Max number of uses (null = unlimited)          |
| `usedCount`          | Number  | Auto     | Times coupon has been used                     |
| `isActive`           | Boolean | No       | Whether coupon is active (default: true)       |
| `applicableTo`       | String  | No       | "all", "products", or "cart" (default: "all")  |
| `applicableProducts` | Array   | No       | Specific product IDs if applicable             |

---

## Admin Endpoints

### 1. Create Coupon

**POST** `/api/v1/coupon/create-coupon`

Create a new discount coupon.

**Request Body:**

```json
{
  "code": "SAVE20",
  "description": "20% off on all items",
  "discountType": "percentage",
  "discountValue": 20,
  "minPurchaseAmount": 500,
  "maxDiscountAmount": 200,
  "expireAt": "2025-12-31T23:59:59.000Z",
  "usageLimit": 100,
  "applicableTo": "all"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 201,
  "status": "success",
  "message": "Coupon created successfully",
  "data": {
    "_id": "...",
    "code": "SAVE20",
    "slug": "save20",
    "discountType": "percentage",
    "discountValue": 20,
    "minPurchaseAmount": 500,
    "maxDiscountAmount": 200,
    "expireAt": "2025-12-31T23:59:59.000Z",
    "usageLimit": 100,
    "usedCount": 0,
    "isActive": true,
    "applicableTo": "all",
    "createdAt": "2025-10-31T10:00:00.000Z"
  }
}
```

---

### 2. Get All Coupons

**GET** `/api/v1/coupon/coupons`

Retrieve all coupons with optional filtering.

**Query Parameters:**

- `isActive` (boolean): Filter by active status
- `discountType` (string): Filter by type (percentage/fixed)

**Examples:**

```bash
# Get all coupons
GET /api/v1/coupon/coupons

# Get only active coupons
GET /api/v1/coupon/coupons?isActive=true

# Get percentage coupons
GET /api/v1/coupon/coupons?discountType=percentage
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupons retrieved successfully",
  "data": [
    {
      "_id": "...",
      "code": "SAVE20",
      "slug": "save20",
      "discountType": "percentage",
      "discountValue": 20,
      "usedCount": 45,
      "usageLimit": 100,
      "isActive": true,
      "expireAt": "2025-12-31T23:59:59.000Z"
    }
  ]
}
```

---

### 3. Get Active Coupons Only

**GET** `/api/v1/coupon/active-coupons`

Get only active and non-expired coupons.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Active coupons retrieved successfully",
  "data": [...]
}
```

---

### 4. Get Coupon by Slug

**GET** `/api/v1/coupon/coupon-slug/:slug`

Retrieve a specific coupon by its slug.

**Example:**

```bash
GET /api/v1/coupon/coupon-slug/save20
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon retrieved successfully",
  "data": {
    "_id": "...",
    "code": "SAVE20",
    "slug": "save20",
    "discountType": "percentage",
    "discountValue": 20,
    "applicableProducts": [...]
  }
}
```

---

### 5. Update Coupon

**PUT** `/api/v1/coupon/update-coupon/:slug`

Update an existing coupon.

**Request Body:**

```json
{
  "discountValue": 25,
  "usageLimit": 150,
  "expireAt": "2026-01-31T23:59:59.000Z"
}
```

**Note:** Cannot change code if coupon has been used.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon updated successfully",
  "data": {...}
}
```

---

### 6. Delete Coupon

**DELETE** `/api/v1/coupon/delete-coupon/:slug`

Delete a coupon. Only unused coupons can be deleted.

**Example:**

```bash
DELETE /api/v1/coupon/delete-coupon/save20
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon deleted successfully",
  "data": null
}
```

---

### 7. Toggle Coupon Status

**PATCH** `/api/v1/coupon/toggle-status/:slug`

Activate or deactivate a coupon.

**Request Body:**

```json
{
  "isActive": false
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon deactivated successfully",
  "data": {...}
}
```

---

## Customer Endpoints

### 8. Get Coupon by Code

**GET** `/api/v1/coupon/coupon-code/:code`

Check if a coupon code is valid (for customer use).

**Example:**

```bash
GET /api/v1/coupon/coupon-code/SAVE20
```

**Response (Valid):**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon is valid",
  "data": {
    "code": "SAVE20",
    "discountType": "percentage",
    "discountValue": 20,
    "minPurchaseAmount": 500
  }
}
```

**Response (Invalid):**

```json
{
  "success": false,
  "statusCode": 400,
  "status": "error",
  "message": "This coupon has expired"
}
```

---

### 9. Verify Coupon

**POST** `/api/v1/coupon/verify-coupon`

Verify a coupon and calculate discount before applying.

**Request Body:**

```json
{
  "code": "SAVE20",
  "cartTotal": 1000,
  "productIds": ["prod1", "prod2"]
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon is valid",
  "data": {
    "coupon": {
      "code": "SAVE20",
      "discountType": "percentage",
      "discountValue": 20
    },
    "discountAmount": 200,
    "finalAmount": 800,
    "savings": 200
  }
}
```

---

## Cart Integration

### 10. Apply Coupon to Cart

**POST** `/api/v1/cart/apply-coupon`

Apply a coupon to user's cart.

**Request Body:**

```json
{
  "user": "userId123",
  "code": "SAVE20"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon applied successfully",
  "data": {
    "cart": {
      "_id": "...",
      "user": "userId123",
      "products": [...],
      "coupon": "couponId",
      "discountAmount": 200,
      "discountType": "percentage"
    },
    "cartTotal": 1000,
    "discountAmount": 200,
    "finalAmount": 800,
    "savings": 200
  }
}
```

---

### 11. Remove Coupon from Cart

**POST** `/api/v1/cart/remove-coupon`

Remove applied coupon from cart.

**Request Body:**

```json
{
  "user": "userId123"
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Coupon removed successfully",
  "data": {
    "cart": {...}
  }
}
```

---

## Examples

### Example 1: Percentage Discount Coupon

```json
{
  "code": "SAVE20",
  "discountType": "percentage",
  "discountValue": 20,
  "minPurchaseAmount": 500,
  "maxDiscountAmount": 300,
  "expireAt": "2025-12-31T23:59:59.000Z",
  "usageLimit": 100
}
```

**Scenario:**

- Cart Total: ৳1000
- Discount: 20% = ৳200
- Final Amount: ৳800

### Example 2: Fixed Amount Coupon

```json
{
  "code": "FLAT100",
  "discountType": "fixed",
  "discountValue": 100,
  "minPurchaseAmount": 500,
  "expireAt": "2025-12-31T23:59:59.000Z"
}
```

**Scenario:**

- Cart Total: ৳750
- Discount: ৳100
- Final Amount: ৳650

### Example 3: Product-Specific Coupon

```json
{
  "code": "TECH15",
  "discountType": "percentage",
  "discountValue": 15,
  "applicableTo": "products",
  "applicableProducts": ["prod1", "prod2", "prod3"],
  "expireAt": "2025-12-31T23:59:59.000Z"
}
```

Only applies if cart contains at least one of the specified products.

### Example 4: Unlimited Usage Coupon

```json
{
  "code": "WELCOME10",
  "discountType": "percentage",
  "discountValue": 10,
  "usageLimit": null,
  "expireAt": "2025-12-31T23:59:59.000Z"
}
```

Can be used unlimited times.

---

## Validation Rules

### Coupon Creation

- ✅ Code must be unique
- ✅ Percentage discount cannot exceed 100%
- ✅ Expiration date must be in the future
- ✅ Usage limit must be at least 1 (if set)
- ✅ Minimum purchase amount cannot be negative

### Coupon Application

- ✅ Coupon must be active (`isActive: true`)
- ✅ Coupon must not be expired
- ✅ Usage limit must not be reached
- ✅ Cart total must meet minimum purchase amount
- ✅ Cart must contain applicable products (if product-specific)

---

## Error Messages

| Error              | Message                                               |
| ------------------ | ----------------------------------------------------- |
| Invalid Code       | "Invalid coupon code"                                 |
| Inactive           | "This coupon is not active"                           |
| Expired            | "This coupon has expired"                             |
| Usage Limit        | "This coupon has reached its usage limit"             |
| Min Purchase       | "Minimum purchase amount of ৳X is required"           |
| Not Applicable     | "This coupon is not applicable to items in your cart" |
| Empty Cart         | "Cart is empty"                                       |
| Cannot Delete      | "Cannot delete a coupon that has been used"           |
| Cannot Change Code | "Cannot change code of a coupon that has been used"   |

---

## Best Practices

1. **Percentage Coupons:** Always set `maxDiscountAmount` to prevent excessive discounts
2. **Fixed Coupons:** Set appropriate `minPurchaseAmount` to ensure profitability
3. **Product-Specific:** Use for promotions on specific categories or items
4. **Expiration:** Set realistic expiration dates for marketing campaigns
5. **Usage Limits:** Use for limited-time offers or first-time customer promotions
6. **Deactivation:** Instead of deleting used coupons, deactivate them for record-keeping

---

## Complete Workflow Example

### Admin Creates Coupon

```bash
POST /api/v1/coupon/create-coupon
{
  "code": "FLASH50",
  "discountType": "fixed",
  "discountValue": 50,
  "minPurchaseAmount": 300,
  "expireAt": "2025-11-15T23:59:59.000Z",
  "usageLimit": 500
}
```

### Customer Verifies Coupon

```bash
POST /api/v1/coupon/verify-coupon
{
  "code": "FLASH50",
  "cartTotal": 450
}
```

### Customer Applies to Cart

```bash
POST /api/v1/cart/apply-coupon
{
  "user": "userId123",
  "code": "FLASH50"
}
```

### Admin Monitors Usage

```bash
GET /api/v1/coupon/coupon-slug/flash50
# Check usedCount field
```

### Admin Deactivates When Limit Reached

```bash
PATCH /api/v1/coupon/toggle-status/flash50
{
  "isActive": false
}
```

---

## Integration Notes

### Cart Total Calculation

When displaying cart to users:

```javascript
const cartSubtotal = products.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

const discountAmount = cart.discountAmount || 0;
const finalTotal = cartSubtotal - discountAmount;
```

### Checkout Flow

1. User adds items to cart
2. User applies coupon code
3. System validates coupon
4. Discount is applied and shown
5. User proceeds to checkout with final amount
6. On order completion, coupon `usedCount` is incremented

---

## Testing Checklist

- [ ] Create percentage coupon
- [ ] Create fixed amount coupon
- [ ] Apply valid coupon to cart
- [ ] Try applying expired coupon
- [ ] Try applying inactive coupon
- [ ] Try applying coupon below min purchase
- [ ] Try applying coupon that reached usage limit
- [ ] Apply product-specific coupon to valid cart
- [ ] Apply product-specific coupon to invalid cart
- [ ] Remove coupon from cart
- [ ] Update coupon details
- [ ] Toggle coupon status
- [ ] Delete unused coupon
- [ ] Try deleting used coupon

---

## Support

For issues or questions about the Coupon API, contact the development team.
