import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// Generate unique filename with timestamp
const generateFileName = (originalName: string, prefix: string = 'movie'): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${prefix}/${timestamp}_${randomString}.${extension}`;
};

// Upload image to Firebase Storage
export const uploadImage = async (
  file: File, 
  path: string = 'movies',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const fileName = generateFileName(file.name, path);
    const storageRef = ref(storage, fileName);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
};

// Delete image from Firebase Storage
export const deleteImage = async (url: string): Promise<void> => {
  try {
    // Extract file path from URL
    const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
    if (url.startsWith(baseUrl)) {
      const filePath = decodeURIComponent(
        url.replace(baseUrl, '').split('?')[0]
      );
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error for delete operations as they're not critical
  }
};

// Validate image file
export const validateImageFile = (file: File): string | null => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'Please select an image file';
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'Image must be smaller than 5MB';
  }
  
  // Check file dimensions (optional)
  return null;
};

export type ImageUploadResult = {
  url: string;
  name: string;
  size: number;
};