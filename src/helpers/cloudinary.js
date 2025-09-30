import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import CustomError from '../utils/customError.js';
dotenv.config();

// Configure Cloudinary once
const configureCloudinary = () => {
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

// Helper function to extract public ID from Cloudinary URL
const extractPublicId = (fileLink) => {
    const urlParts = fileLink.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1) {
        throw new CustomError(400, "Invalid Cloudinary URL");
    }
    
    return urlParts.slice(uploadIndex + 2).join('/').split('?')[0];
};

// Generalized upload function - handles both single file and array of files
export async function uploadImage(files) {
    configureCloudinary();
    
    // Normalize input to array
    const fileArray = Array.isArray(files) ? files : [files];
    const isMultiple = Array.isArray(files);
    
    const uploadedUrls = []; // Track successfully uploaded URLs for cleanup
    
    try {
        for (let i = 0; i < fileArray.length; i++) {
            const filePath = fileArray[i];
            
            try {
                const uploadResult = await cloudinary.uploader.upload(
                    filePath, {
                        resource_type: 'image',
                        auto: 'format',
                        fetch_format: 'auto',
                        quality: 'auto',
                        folder: process.env.CLOUDINARY_FOLDER,
                    }
                );

                // Remove file from server after successful upload
                fs.unlinkSync(filePath);

                const uploadedUrl = cloudinary.url(uploadResult.public_id);
                uploadedUrls.push(uploadedUrl);
                
            } catch (error) {
                // Clean up current file
                try {
                    fs.unlinkSync(filePath);
                } catch (unlinkError) {
                    console.error(`Failed to delete file ${filePath}:`, unlinkError);
                }
                
                // If this is a batch operation and we have already uploaded some files, clean them up
                if (isMultiple && uploadedUrls.length > 0) {
                    console.log(`Upload failed for ${filePath}, cleaning up ${uploadedUrls.length} previously uploaded images...`);
                    try {
                        await deleteImage(uploadedUrls);
                    } catch (cleanupError) {
                        console.error('Failed to cleanup uploaded images:', cleanupError);
                    }
                }
                
                // Clean up remaining files that weren't processed yet
                for (let j = i + 1; j < fileArray.length; j++) {
                    try {
                        fs.unlinkSync(fileArray[j]);
                    } catch (unlinkError) {
                        console.error(`Failed to delete remaining file ${fileArray[j]}:`, unlinkError);
                    }
                }
                
                throw new CustomError(500, `Image upload failed: ${error.message}${isMultiple ? ` (${uploadedUrls.length} previously uploaded images have been cleaned up)` : ''}`);
            }
        }
        
        // Return single result for single file, array for multiple files
        return isMultiple ? uploadedUrls : uploadedUrls[0];
        
    } catch (error) {
        // Re-throw CustomError as-is, wrap other errors
        throw error instanceof CustomError ? error : new CustomError(500, `Upload operation failed: ${error.message}`);
    }
}

// Generalized delete function - handles both single URL and array of URLs
export async function deleteImage(fileLinks) {
    configureCloudinary();
    
    // Normalize input to array
    const linkArray = Array.isArray(fileLinks) ? fileLinks : [fileLinks];
    const isMultiple = Array.isArray(fileLinks);
    
    const deletedPublicIds = []; // Track successfully deleted IDs (for potential undo, though Cloudinary doesn't support restore)
    
    try {
        for (let i = 0; i < linkArray.length; i++) {
            const fileLink = linkArray[i];
            
            try {
                const publicIdWithFolder = extractPublicId(fileLink);
                
                console.log(`Attempting to delete public ID: ${publicIdWithFolder}`);

                const result = await cloudinary.uploader.destroy(publicIdWithFolder, { 
                    resource_type: 'image' 
                });

                console.log(`Delete result for ${publicIdWithFolder}:`, result);
                
                if (result.result !== 'ok') {
                    throw new CustomError(500, `Failed to delete image ${publicIdWithFolder}: ${result.result}`);
                } else {
                    console.log(`Image with public ID ${publicIdWithFolder} deleted from Cloudinary.`);
                    deletedPublicIds.push(publicIdWithFolder);
                }
                
            } catch (error) {
                console.error(`Error deleting image ${fileLink}:`, error);
                
                // For batch operations, if one fails, throw error with details
                if (isMultiple && deletedPublicIds.length > 0) {
                    const errorMessage = `Image deletion failed for ${fileLink}: ${error.message}. ${deletedPublicIds.length} images were already deleted and cannot be restored: [${deletedPublicIds.join(', ')}]`;
                    throw new CustomError(500, errorMessage);
                }
                
                // For single operations or first failure, throw the error directly
                throw error instanceof CustomError ? error : new CustomError(500, `Cloudinary delete failed: ${error.message}`);
            }
        }
        
        // If we get here, all deletions were successful
        const results = deletedPublicIds.map(id => ({ result: 'ok', publicId: id }));
        
        // Return single result for single file, array for multiple files
        return isMultiple ? results : results[0];
        
    } catch (error) {
        // Re-throw CustomError as-is, wrap other errors
        throw error instanceof CustomError ? error : new CustomError(500, `Delete operation failed: ${error.message}`);
    }
}
