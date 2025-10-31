# Review Image Upload - Quick Start Guide

## Overview

The review system now supports direct image uploads to Cloudinary with automatic cleanup and management.

## Features

✅ Upload up to 5 images per review  
✅ Automatic Cloudinary integration  
✅ Auto-delete old images on update  
✅ Auto-cleanup on review deletion  
✅ Support for both multipart/form-data and JSON with URLs

---

## Method 1: Direct Upload with Review (Recommended)

### Create Review with Images

```javascript
const formData = new FormData();
formData.append("user", "userId123");
formData.append("product", "productId456");
formData.append("rating", 5);
formData.append("comment", "Great product! Highly recommend.");
formData.append("images", imageFile1);
formData.append("images", imageFile2);
formData.append("images", imageFile3);

const response = await fetch("/api/v1/review/create-review", {
  method: "POST",
  body: formData,
});
```

### Update Review with New Images

```javascript
const formData = new FormData();
formData.append("user", "userId123");
formData.append("rating", 4);
formData.append("comment", "Updated review after 1 month of use.");
formData.append("images", newImageFile1);
formData.append("images", newImageFile2);

const response = await fetch("/api/v1/review/update-review/reviewId123", {
  method: "PUT",
  body: formData,
});
```

**Note:** Old images are automatically deleted from Cloudinary when updating.

---

## Method 2: Separate Upload (For More Control)

### Step 1: Upload Images First

```javascript
const formData = new FormData();
formData.append("images", imageFile1);
formData.append("images", imageFile2);

const uploadResponse = await fetch("/api/v1/review/upload-images", {
  method: "POST",
  body: formData,
});

const { data } = await uploadResponse.json();
const imageUrls = data.images;
// ["https://res.cloudinary.com/.../image1.jpg", "https://res.cloudinary.com/.../image2.jpg"]
```

### Step 2: Create Review with URLs

```javascript
const response = await fetch("/api/v1/review/create-review", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    user: "userId123",
    product: "productId456",
    rating: 5,
    comment: "Great product!",
    images: imageUrls,
  }),
});
```

---

## HTML Form Example

```html
<form id="reviewForm" enctype="multipart/form-data">
  <input name="user" type="hidden" value="userId123" />
  <input name="product" type="hidden" value="productId456" />

  <select name="rating" required>
    <option value="5">5 Stars</option>
    <option value="4">4 Stars</option>
    <option value="3">3 Stars</option>
    <option value="2">2 Stars</option>
    <option value="1">1 Star</option>
  </select>

  <textarea name="comment" minlength="10" maxlength="1000" required></textarea>

  <input
    type="file"
    name="images"
    accept="image/jpeg,image/png,image/webp"
    multiple
    onchange="validateImages(this)"
  />

  <button type="submit">Submit Review</button>
</form>

<script>
  function validateImages(input) {
    const files = Array.from(input.files);

    if (files.length > 5) {
      alert("Maximum 5 images allowed");
      input.value = "";
      return false;
    }

    for (const file of files) {
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large. Max 2MB per image.`);
        input.value = "";
        return false;
      }
    }

    return true;
  }

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
        }
      } catch (error) {
        alert("Error: " + error.message);
      }
    });
</script>
```

---

## Image Constraints

| Constraint                 | Value                     |
| -------------------------- | ------------------------- |
| Max Images per Review      | 5                         |
| Recommended Max File Size  | 2MB per image             |
| Supported Formats          | JPG, PNG, WEBP            |
| Recommended Min Dimensions | 300x300px                 |
| Storage                    | Cloudinary (auto-managed) |

---

## Automatic Cleanup

### When Review is Deleted

All associated images are automatically deleted from Cloudinary.

```javascript
// When this is called:
await fetch("/api/v1/review/delete-review/reviewId123", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: "userId123" }),
});

// All review images are automatically deleted from Cloudinary
```

### When Review is Updated

Old images are replaced with new ones.

```javascript
// If review has 3 old images and you upload 2 new images:
// - Old 3 images are deleted from Cloudinary
// - New 2 images are uploaded and saved
```

---

## Error Handling

### Common Errors

**No Images Provided**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "No images provided for upload"
}
```

**Too Many Images**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Maximum 5 images allowed per review"
}
```

**Cloudinary Upload Failed**

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Image upload failed: [error details]"
}
```

---

## Best Practices

1. ✅ **Validate on Frontend:** Check file count and size before upload
2. ✅ **Show Progress:** Display upload progress for better UX
3. ✅ **Preview Images:** Show thumbnails before submission
4. ✅ **Compress Images:** Use client-side compression for faster uploads
5. ✅ **Handle Errors:** Show user-friendly error messages
6. ✅ **Lazy Load:** Use lazy loading when displaying review images
7. ✅ **Optimize:** Consider using Cloudinary transformations for thumbnails

---

## Testing

### Test Upload

```bash
curl -X POST http://localhost:3000/api/v1/review/upload-images \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### Test Create with Images

```bash
curl -X POST http://localhost:3000/api/v1/review/create-review \
  -F "user=userId123" \
  -F "product=productId456" \
  -F "rating=5" \
  -F "comment=Great product! Very happy with my purchase." \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

---

## Troubleshooting

**Images not uploading?**

- Check Cloudinary credentials in `.env`
- Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Ensure `public/temp` folder exists and is writable

**Images not deleting?**

- Check Cloudinary URL format
- Verify folder structure matches `CLOUDINARY_FOLDER` in `.env`
- Check server logs for error details

**Upload fails with large images?**

- Check multer file size limits
- Consider adding client-side compression
- Verify Cloudinary account upload limits

---

## Configuration

### Environment Variables Required

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=your_folder_name
```

### File Storage

- Temporary files: `public/temp/` (auto-deleted after upload)
- Permanent storage: Cloudinary (configured folder)

---

## Support

For issues or questions:

1. Check console/server logs for error details
2. Verify Cloudinary configuration
3. Ensure multer middleware is properly configured
4. Review API documentation in REVIEW-API-GUIDE.md
