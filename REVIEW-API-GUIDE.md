# Review API Guide

## Overview

The Review system allows customers to rate and review products they've purchased. Reviews help build trust and provide valuable feedback. The system includes moderation features, helpful votes, and comprehensive statistics.

## Table of Contents

- [Review Model](#review-model)
- [Customer Endpoints](#customer-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Examples](#examples)
- [Integration Guide](#integration-guide)

---

## Review Model

### Review Fields

| Field                | Type     | Required | Description                                               |
| -------------------- | -------- | -------- | --------------------------------------------------------- |
| `user`               | ObjectId | Yes      | Reference to User who wrote the review                    |
| `product`            | ObjectId | Yes      | Reference to Product being reviewed                       |
| `rating`             | Number   | Yes      | Rating from 1 to 5 (whole numbers only)                   |
| `comment`            | String   | Yes      | Review text (10-1000 characters)                          |
| `images`             | Array    | No       | Up to 5 image URLs                                        |
| `isVerifiedPurchase` | Boolean  | No       | Whether user purchased the product (default: false)       |
| `helpful`            | Number   | Auto     | Number of users who found this helpful                    |
| `helpfulBy`          | Array    | Auto     | List of users who marked as helpful                       |
| `status`             | String   | No       | "pending", "approved", or "rejected" (default: "pending") |
| `adminResponse`      | String   | No       | Admin's response to the review                            |
| `rejectionReason`    | String   | No       | Reason for rejection (if rejected)                        |

### Validation Rules

- ✅ One review per user per product
- ✅ Rating must be 1-5 (whole numbers)
- ✅ Comment must be 10-1000 characters
- ✅ Maximum 5 images per review
- ✅ Only approved reviews are publicly visible
- ✅ Users can't mark their own reviews as helpful

---

## Customer Endpoints

### 1. Create Review

**POST** `/api/v1/review/create-review`

Submit a new product review.

**Content-Type:** `application/json` OR `multipart/form-data` (for image uploads)

**Method 1: JSON with Image URLs**

**Request Body:**

```json
{
  "user": "userId123",
  "product": "productId456",
  "rating": 5,
  "comment": "Absolutely love this product! The quality exceeded my expectations and delivery was fast.",
  "images": [
    "https://cloudinary.com/image1.jpg",
    "https://cloudinary.com/image2.jpg"
  ],
  "isVerifiedPurchase": true
}
```

**Method 2: Form Data with File Uploads**

**Request (Form Data):**

- `user`: "userId123"
- `product`: "productId456"
- `rating`: 5
- `comment`: "Absolutely love this product!..."
- `images`: [file1.jpg, file2.jpg] (up to 5 files)
- `isVerifiedPurchase`: true

**Example using JavaScript:**

```javascript
const formData = new FormData();
formData.append("user", "userId123");
formData.append("product", "productId456");
formData.append("rating", 5);
formData.append("comment", "Absolutely love this product!...");
formData.append("images", imageFile1);
formData.append("images", imageFile2);
formData.append("isVerifiedPurchase", true);

await fetch("/api/v1/review/create-review", {
  method: "POST",
  body: formData,
});
```

**Response:**

```json
{
  "success": true,
  "statusCode": 201,
  "status": "success",
  "message": "Review created successfully",
  "data": {
    "_id": "reviewId789",
    "user": {
      "_id": "userId123",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "product": {
      "_id": "productId456",
      "name": "Premium Wireless Headphones",
      "slug": "premium-wireless-headphones",
      "retailPrice": 2500
    },
    "rating": 5,
    "comment": "Absolutely love this product!...",
    "images": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/folder/image1.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1234567891/folder/image2.jpg"
    ],
    "isVerifiedPurchase": true,
    "helpful": 0,
    "status": "pending",
    "createdAt": "2025-11-01T10:00:00.000Z"
  }
}
```

**Error Cases:**

```json
// Already reviewed
{
  "success": false,
  "statusCode": 400,
  "message": "You have already reviewed this product"
}

// Product not found
{
  "success": false,
  "statusCode": 404,
  "message": "Product not found"
}
```

---

### 2. Get Product Reviews

**GET** `/api/v1/review/product/:productId`

Get all reviews for a specific product.

**Query Parameters:**

- `status` (string): Filter by status (default: "approved")
- `rating` (number): Filter by rating (1-5)
- `page` (number): Page number (default: 1)
- `limit` (number): Reviews per page (default: 10)

**Examples:**

```bash
# Get approved reviews for a product
GET /api/v1/review/product/productId456

# Get 5-star reviews
GET /api/v1/review/product/productId456?rating=5

# Get all reviews (admin view)
GET /api/v1/review/product/productId456?status=all

# Pagination
GET /api/v1/review/product/productId456?page=2&limit=20
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Product reviews retrieved successfully",
  "data": {
    "product": {
      "id": "productId456",
      "name": "Premium Wireless Headphones",
      "averageRating": 4.5,
      "totalReviews": 127
    },
    "reviews": [
      {
        "_id": "reviewId789",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "avatar": "https://..."
        },
        "rating": 5,
        "comment": "Absolutely love this product!...",
        "images": [...],
        "isVerifiedPurchase": true,
        "helpful": 23,
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "ratingDistribution": [
      { "_id": 5, "count": 78 },
      { "_id": 4, "count": 32 },
      { "_id": 3, "count": 10 },
      { "_id": 2, "count": 5 },
      { "_id": 1, "count": 2 }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 13,
      "totalReviews": 127,
      "reviewsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3. Get User Reviews

**GET** `/api/v1/review/user/:userId`

Get all reviews written by a specific user.

**Query Parameters:**

- `status` (string): Filter by status
- `page` (number): Page number (default: 1)
- `limit` (number): Reviews per page (default: 10)

**Example:**

```bash
GET /api/v1/review/user/userId123
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "User reviews retrieved successfully",
  "data": {
    "reviews": [
      {
        "_id": "reviewId789",
        "product": {
          "name": "Premium Wireless Headphones",
          "slug": "premium-wireless-headphones",
          "images": [...],
          "retailPrice": 2500,
          "averageRating": 4.5
        },
        "rating": 5,
        "comment": "Absolutely love this product!...",
        "status": "approved",
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### 4. Get Single Review

**GET** `/api/v1/review/review/:reviewId`

Get detailed information about a specific review.

**Example:**

```bash
GET /api/v1/review/review/reviewId789
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review retrieved successfully",
  "data": {
    "_id": "reviewId789",
    "user": {...},
    "product": {...},
    "rating": 5,
    "comment": "Absolutely love this product!...",
    "images": [...],
    "helpful": 23,
    "helpfulBy": [...],
    "status": "approved",
    "adminResponse": "Thank you for your feedback!",
    "createdAt": "2025-11-01T10:00:00.000Z"
  }
}
```

---

### 5. Update Review

**PUT** `/api/v1/review/update-review/:reviewId`

Update your own review (only pending reviews can be edited by users).

**Content-Type:** `application/json` OR `multipart/form-data` (for image uploads)

**Method 1: JSON with Image URLs**

**Request Body:**

```json
{
  "user": "userId123",
  "rating": 4,
  "comment": "Updated my review after using the product for a month. Still great!",
  "images": ["https://cloudinary.com/new-image1.jpg"]
}
```

**Method 2: Form Data with File Uploads**

**Request (Form Data):**

- `user`: "userId123"
- `rating`: 4
- `comment`: "Updated my review after using the product for a month..."
- `images`: [new-image1.jpg, new-image2.jpg] (replaces all old images)

**Note:** When uploading new image files, all old images will be automatically deleted from Cloudinary and replaced with the new ones.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review updated successfully",
  "data": {...}
}
```

**Error Cases:**

```json
// Not your review
{
  "success": false,
  "statusCode": 403,
  "message": "You can only update your own reviews"
}

// Review already approved
{
  "success": false,
  "statusCode": 400,
  "message": "Approved reviews cannot be edited. Contact support for changes."
}
```

---

### 6. Delete Review

**DELETE** `/api/v1/review/delete-review/:reviewId`

Delete your own review (or any review if admin).

**Request Body:**

```json
{
  "user": "userId123",
  "isAdmin": false
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review deleted successfully",
  "data": null
}
```

---

### 7. Mark Review as Helpful

**POST** `/api/v1/review/mark-helpful/:reviewId`

Mark or unmark a review as helpful.

**Request Body:**

```json
{
  "user": "userId123",
  "action": "mark"
}
```

**Actions:**

- `"mark"` - Mark as helpful
- `"unmark"` - Remove helpful mark

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review marked as helpful",
  "data": {
    "_id": "reviewId789",
    "helpful": 24,
    "helpfulBy": [...]
  }
}
```

**Error Cases:**

```json
// Already marked
{
  "success": false,
  "statusCode": 400,
  "message": "You have already marked this review as helpful"
}

// Not approved
{
  "success": false,
  "statusCode": 400,
  "message": "You can only mark approved reviews as helpful"
}
```

---

### 8. Upload Review Images

**POST** `/api/v1/review/upload-images`

Upload images for a review (can be used independently or with create/update review).

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**

- `images` (files): Up to 5 image files

**Example using cURL:**

```bash
curl -X POST http://localhost:PORT/api/v1/review/upload-images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "images=@/path/to/image3.jpg"
```

**Example using JavaScript/Fetch:**

```javascript
const formData = new FormData();
formData.append("images", file1);
formData.append("images", file2);
formData.append("images", file3);

const response = await fetch("/api/v1/review/upload-images", {
  method: "POST",
  body: formData,
});
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review images uploaded successfully",
  "data": {
    "images": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/folder/image1.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1234567891/folder/image2.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1234567892/folder/image3.jpg"
    ],
    "count": 3
  }
}
```

**Error Cases:**

```json
// No images provided
{
  "success": false,
  "statusCode": 400,
  "message": "No images provided for upload"
}

// Too many images
{
  "success": false,
  "statusCode": 400,
  "message": "Maximum 5 images allowed per review"
}
```

---

## Admin Endpoints

### 9. Get All Reviews

**GET** `/api/v1/review/all-reviews`

Get all reviews across all products with filtering.

**Query Parameters:**

- `status` (string): Filter by status (pending/approved/rejected)
- `rating` (number): Filter by rating
- `page` (number): Page number (default: 1)
- `limit` (number): Reviews per page (default: 20)

**Examples:**

```bash
# Get pending reviews
GET /api/v1/review/all-reviews?status=pending

# Get rejected reviews
GET /api/v1/review/all-reviews?status=rejected

# Get 1-star reviews
GET /api/v1/review/all-reviews?rating=1
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Reviews retrieved successfully",
  "data": {
    "reviews": [...],
    "pagination": {...}
  }
}
```

---

### 10. Toggle Review Status

**PATCH** `/api/v1/review/toggle-status/:reviewId`

Approve, reject, or change review status.

**Request Body (Approve):**

```json
{
  "status": "approved",
  "adminResponse": "Thank you for your detailed review!"
}
```

**Request Body (Reject):**

```json
{
  "status": "rejected",
  "rejectionReason": "Review contains inappropriate language.",
  "adminResponse": "Please edit and resubmit your review."
}
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review approved successfully",
  "data": {
    "_id": "reviewId789",
    "status": "approved",
    "adminResponse": "Thank you for your detailed review!",
    ...
  }
}
```

---

### 11. Get Review Statistics

**GET** `/api/v1/review/statistics`

Get comprehensive review statistics across the platform.

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "status": "success",
  "message": "Review statistics retrieved successfully",
  "data": {
    "totalReviews": 1543,
    "averageRating": 4.3,
    "statusDistribution": [
      { "_id": "approved", "count": 1245 },
      { "_id": "pending", "count": 234 },
      { "_id": "rejected", "count": 64 }
    ],
    "ratingDistribution": [
      { "_id": 5, "count": 678 },
      { "_id": 4, "count": 432 },
      { "_id": 3, "count": 134 },
      { "_id": 2, "count": 45 },
      { "_id": 1, "count": 21 }
    ],
    "topReviewedProducts": [
      {
        "productId": "...",
        "productName": "Premium Wireless Headphones",
        "productSlug": "premium-wireless-headphones",
        "reviewCount": 127,
        "averageRating": 4.5
      }
    ]
  }
}
```

---

## Examples

### Example 1: Customer Review Flow

**Step 1: Customer submits review**

```bash
POST /api/v1/review/create-review
{
  "user": "userId123",
  "product": "productId456",
  "rating": 5,
  "comment": "Amazing product! Highly recommend to everyone.",
  "isVerifiedPurchase": true
}
```

**Step 2: Admin approves review**

```bash
PATCH /api/v1/review/toggle-status/reviewId789
{
  "status": "approved",
  "adminResponse": "Thank you for your feedback!"
}
```

**Step 3: Review appears on product page**

```bash
GET /api/v1/review/product/productId456
```

**Step 4: Other customers find it helpful**

```bash
POST /api/v1/review/mark-helpful/reviewId789
{
  "user": "otherUserId",
  "action": "mark"
}
```

---

### Example 2: Admin Moderation Flow

**Step 1: Get pending reviews**

```bash
GET /api/v1/review/all-reviews?status=pending
```

**Step 2: Review inappropriate review**

```bash
GET /api/v1/review/review/reviewId999
```

**Step 3: Reject with reason**

```bash
PATCH /api/v1/review/toggle-status/reviewId999
{
  "status": "rejected",
  "rejectionReason": "Review contains spam/promotional content",
  "adminResponse": "Please provide genuine feedback about the product."
}
```

---

### Example 3: Product Rating Display

**Get product with reviews:**

```bash
GET /api/v1/review/product/productId456?page=1&limit=5
```

**Display on frontend:**

```javascript
// Rating summary
{
  "averageRating": 4.5,
  "totalReviews": 127,
  "breakdown": {
    "5 stars": 78,
    "4 stars": 32,
    "3 stars": 10,
    "2 stars": 5,
    "1 star": 2
  }
}

// Recent reviews with helpful votes
[
  {
    "user": "John D.",
    "rating": 5,
    "comment": "Great product!",
    "helpful": 23,
    "verified": true,
    "date": "2 days ago"
  }
]
```

---

## Integration Guide

### Product Model Integration

The Product model automatically updates when reviews are added/removed/approved:

```javascript
// Product fields
{
  "name": "Premium Wireless Headphones",
  "averageRating": 4.5,  // Auto-calculated
  "totalReviews": 127,   // Auto-updated
  ...
}
```

### Auto-Update Triggers

1. **New review approved** → Updates product rating
2. **Review deleted** → Recalculates product rating
3. **Review status changed** → Updates product statistics

### Review Hooks

```javascript
// In review.model.js

// After save (if approved)
reviewSchema.post("save", async function () {
  if (this.status === "approved") {
    await this.constructor.updateProductRating(this.product);
  }
});

// After delete
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.product);
  }
});
```

---

## Validation Rules

### Review Creation

- ✅ User must exist
- ✅ Product must exist
- ✅ Rating must be 1-5 (integer)
- ✅ Comment must be 10-1000 characters
- ✅ Maximum 5 images
- ✅ One review per user per product

### Review Update

- ✅ Only review owner can update
- ✅ Only pending reviews can be edited by users
- ✅ At least one field must be updated

### Helpful Marking

- ✅ Review must be approved
- ✅ User can't mark own review
- ✅ User can't mark same review twice

### Admin Moderation

- ✅ Rejection requires a reason (min 10 chars)
- ✅ Admin response optional (max 500 chars)

---

## Error Messages

| Error                    | Message                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| Duplicate Review         | "You have already reviewed this product"                          |
| Product Not Found        | "Product not found"                                               |
| Review Not Found         | "Review not found"                                                |
| Unauthorized Update      | "You can only update your own reviews"                            |
| Approved Review Edit     | "Approved reviews cannot be edited. Contact support for changes." |
| Unauthorized Delete      | "You can only delete your own reviews"                            |
| Already Helpful          | "You have already marked this review as helpful"                  |
| Not Marked Helpful       | "You haven't marked this review as helpful"                       |
| Unapproved Helpful       | "You can only mark approved reviews as helpful"                   |
| Missing Rejection Reason | "Rejection reason is required when rejecting a review"            |

---

## Best Practices

### For Customers

1. **Be Specific:** Provide detailed feedback about your experience
2. **Be Honest:** Give genuine ratings and comments
3. **Add Photos:** Include product images if possible
4. **Update Reviews:** Edit if your opinion changes after extended use
5. **Help Others:** Mark helpful reviews to guide other shoppers

### For Admins

1. **Prompt Moderation:** Review pending submissions quickly
2. **Clear Communication:** Provide specific rejection reasons
3. **Engage Positively:** Thank customers for detailed reviews
4. **Monitor Trends:** Use statistics to identify product issues
5. **Protect Integrity:** Remove fake or spam reviews

### For Developers

1. **Verified Purchases:** Mark reviews from actual purchases
2. **Pagination:** Always use pagination for review lists
3. **Image Optimization:** Compress review images before upload (recommended max 2MB per image)
4. **Image Upload Flow:** Use separate upload endpoint first, then include URLs in review, OR upload directly with form data
5. **Cloudinary Cleanup:** Images are automatically deleted when review is deleted or updated
6. **Real-time Updates:** Show latest reviews prominently
7. **Helpful Sorting:** Display most helpful reviews first
8. **Max Images:** Enforce 5 image limit on frontend to improve UX

### Image Upload Best Practices

1. **Client-side Validation:**

   - Maximum 5 images per review
   - Accepted formats: JPG, PNG, WEBP
   - Maximum file size: 2MB per image
   - Minimum dimensions: 300x300px

2. **Upload Strategies:**

   - **Option A:** Upload images separately first, get URLs, then create review with URLs
   - **Option B:** Upload images directly with review using FormData (single request)

3. **Error Handling:**

   - Handle Cloudinary upload failures gracefully
   - Show upload progress for better UX
   - Allow retry on failed uploads

4. **Performance:**
   - Use lazy loading for review images
   - Implement image compression before upload
   - Consider thumbnail generation for gallery views

---

## Display Recommendations

### Product Page Review Section

```javascript
// Sort order priority:
1. Most helpful verified purchases
2. Most recent verified purchases
3. Most helpful unverified reviews
4. Most recent reviews

// Default display:
- Show 5 reviews initially
- "Load More" button for pagination
- Filter by rating (5★, 4★, etc.)
- Sort by: Most Helpful, Most Recent, Highest/Lowest Rating
```

### Review Summary Widget

```javascript
// Display:
- Average rating (4.5 ★★★★☆)
- Total reviews (127 reviews)
- Rating breakdown bar chart
- Verified purchase percentage
- Call-to-action: "Write a Review"
```

---

## Frontend Integration Example

### Submit Review Form with Image Upload

```html
<form id="reviewForm" enctype="multipart/form-data">
  <input name="user" type="hidden" value="userId123" />
  <input name="product" type="hidden" value="productId456" />

  <label>Rating</label>
  <select name="rating" required>
    <option value="5">5 Stars - Excellent</option>
    <option value="4">4 Stars - Good</option>
    <option value="3">3 Stars - Average</option>
    <option value="2">2 Stars - Poor</option>
    <option value="1">1 Star - Terrible</option>
  </select>

  <label>Your Review</label>
  <textarea name="comment" minlength="10" maxlength="1000" required></textarea>

  <label>Upload Photos (Optional - Max 5)</label>
  <input
    type="file"
    name="images"
    accept="image/jpeg,image/png,image/webp"
    multiple
    id="imageInput"
  />
  <div id="imagePreview"></div>

  <button type="submit">Submit Review</button>
</form>

<script>
  // Handle image preview
  document
    .getElementById("imageInput")
    .addEventListener("change", function (e) {
      const files = Array.from(e.target.files);
      const previewDiv = document.getElementById("imagePreview");
      previewDiv.innerHTML = "";

      if (files.length > 5) {
        alert("Maximum 5 images allowed");
        e.target.value = "";
        return;
      }

      files.forEach((file) => {
        if (file.size > 2 * 1024 * 1024) {
          alert(`${file.name} is too large. Max 2MB per image.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          const img = document.createElement("img");
          img.src = e.target.result;
          img.style.width = "100px";
          img.style.margin = "5px";
          previewDiv.appendChild(img);
        };
        reader.readAsDataURL(file);
      });
    });

  // Submit form with images
  document
    .getElementById("reviewForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(this);

      try {
        const response = await fetch("/api/v1/review/create-review", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          alert("Review submitted successfully!");
          this.reset();
          document.getElementById("imagePreview").innerHTML = "";
        } else {
          alert("Error: " + result.message);
        }
      } catch (error) {
        alert("Error submitting review: " + error.message);
      }
    });
</script>
```

### Alternative: Upload Images Separately First

```javascript
// Step 1: Upload images first
async function uploadReviewImages(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await fetch("/api/v1/review/upload-images", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  return result.data.images; // Array of Cloudinary URLs
}

// Step 2: Create review with image URLs
async function submitReview(reviewData, imageFiles) {
  let imageUrls = [];

  if (imageFiles && imageFiles.length > 0) {
    imageUrls = await uploadReviewImages(imageFiles);
  }

  const response = await fetch("/api/v1/review/create-review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...reviewData,
      images: imageUrls,
    }),
  });

  return await response.json();
}

// Usage
const files = document.getElementById("imageInput").files;
const result = await submitReview(
  {
    user: "userId123",
    product: "productId456",
    rating: 5,
    comment: "Great product!",
  },
  files
);
```

### Display Reviews with Images

```javascript
// Fetch product reviews
const response = await fetch(
  "/api/v1/review/product/productId456?page=1&limit=5"
);
const { data } = await response.json();

// Render reviews with images
data.reviews.forEach((review) => {
  const reviewHTML = `
    <div class="review">
      <div class="rating">${"★".repeat(review.rating)}${"☆".repeat(
    5 - review.rating
  )}</div>
      <p>${review.comment}</p>
      ${
        review.isVerifiedPurchase
          ? '<span class="verified">✓ Verified Purchase</span>'
          : ""
      }
      
      ${
        review.images && review.images.length > 0
          ? `
        <div class="review-images">
          ${review.images
            .map(
              (img) => `
            <img src="${img}" alt="Review image" loading="lazy" />
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
      
      <div class="helpful">
        ${review.helpful} people found this helpful
        <button onclick="markHelpful('${review._id}')">👍 Helpful</button>
      </div>
    </div>
  `;

  document.getElementById("reviews-container").innerHTML += reviewHTML;
});
```

---

## Testing Checklist

- [ ] Create review for a product
- [ ] Create review with image uploads (1-5 images)
- [ ] Try uploading more than 5 images (should fail)
- [ ] Upload images separately using upload-images endpoint
- [ ] Try creating duplicate review (should fail)
- [ ] Update own pending review
- [ ] Update review with new images (old images should be deleted)
- [ ] Try updating approved review (should fail)
- [ ] Delete own review (images should be deleted from Cloudinary)
- [ ] Mark review as helpful
- [ ] Try marking same review twice (should fail)
- [ ] Unmark helpful review
- [ ] Admin approve review
- [ ] Admin reject review with reason
- [ ] Get product reviews with pagination
- [ ] Get user reviews
- [ ] Filter reviews by rating
- [ ] Get review statistics
- [ ] Verify product rating auto-updates
- [ ] Verify images display correctly in review responses
- [ ] Check Cloudinary for orphaned images after deletion
- [ ] Get top reviewed products

---

## Support

For issues or questions about the Review API, contact the development team.
