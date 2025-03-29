
/**
 * Convert a file to a base64 data URL
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

/**
 * Validate if a file is an image with acceptable format and size
 */
export const validateImageFile = (file: File, maxSizeMB = 5): string | null => {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (!acceptedTypes.includes(file.type)) {
    return 'File must be a JPEG, PNG, GIF, or WEBP image';
  }
  
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  
  return null;
};
