import { storage } from './firebase';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Max file size for documents (e.g. 5MB)
const MAX_DOC_SIZE = 5 * 1024 * 1024;

/**
 * Compresses an image using an HTML5 Canvas.
 * @param {File} file - The original image file.
 * @param {number} maxDimension - The maximum width or height.
 * @param {number} quality - JPEG compression quality (0.0 to 1.0).
 * @returns {Promise<File>} A promise that resolves with the compressed file.
 */
export const compressImage = (file, maxDimension = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Uploads a file to Firebase Storage.
 * @param {string} projectId - The ID of the project.
 * @param {File} file - The file to upload.
 * @param {string} type - 'photo' or 'document'.
 * @param {function} onProgress - Optional callback for upload progress.
 * @returns {Promise<Object>} An object containing { url, name, type, path, size }.
 */
export const uploadProjectFile = async (projectId, file, type, onProgress) => {
  let fileToUpload = file;
  
  if (type === 'photo' && file.type.startsWith('image/')) {
    fileToUpload = await compressImage(file);
  } else if (type === 'document' && file.size > MAX_DOC_SIZE) {
    throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
  }

  const ext = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${ext}`;
  const filePath = `projects/${projectId}/${type}s/${fileName}`;
  const storageRef = ref(storage, filePath);

  const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        }
      },
      (error) => {
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            name: file.name,
            path: filePath,
            type: file.type,
            size: fileToUpload.size
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

/**
 * Deletes a file from Firebase Storage.
 * @param {string} filePath - The full path of the file in storage.
 * @returns {Promise<void>}
 */
export const deleteProjectFile = async (filePath) => {
  const storageRef = ref(storage, filePath);
  return deleteObject(storageRef);
};
