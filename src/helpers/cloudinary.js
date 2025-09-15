import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import CustomError from '../utils/customError.js';
dotenv.config();

export async function uploadImage(filePath) {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Upload an image
     const uploadResult = await cloudinary.uploader
       .upload(
           filePath, {
               resource_type: 'image',
               auto: 'format',
               fetch_format: 'auto',
               quality: 'auto',
               folder: process.env.CLOUDINARY_FOLDER,
           }
       )
       .catch((error) => {
           throw new CustomError(500, "Cloudinary upload failed", error.message);
       });

    // Remove file from server after upload
    fs.unlinkSync(filePath);

    return cloudinary.url(uploadResult.public_id);
};

export async function deleteImage(fileLink) {
    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Extract public ID properly including folder path
    const urlParts = fileLink.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
        throw new CustomError(400, "Invalid Cloudinary URL");
    }
    
    // Get everything after 'upload/v1/' and remove query params
    const publicIdWithFolder = urlParts.slice(uploadIndex + 2).join('/').split('?')[0];
    
    console.log(`Attempting to delete public ID: ${publicIdWithFolder}`);

    // Delete the image
    const result = await cloudinary.uploader.destroy(publicIdWithFolder, { 
        resource_type: 'image' 
    }).catch((error) => {
        throw new CustomError(500, "Cloudinary delete failed", error.message);
    });

    console.log(`Delete result:`, result);
    
    if (result.result !== 'ok') {
        throw new CustomError(500, `Failed to delete image: ${result.result}`);
    }
    
    console.log(`Image with public ID ${publicIdWithFolder} deleted from Cloudinary.`);
}
