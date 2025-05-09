import axios from 'axios';

// Базовый URL для API
const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  readableSize?: string;
  path: string;
  mimeType?: string;
  owner: any;
  parentFolder: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface FileResponse {
  status: string;
  data: {
    files: FileItem[];
    pagination: PaginationData;
  };
}

interface CreateFolderResponse {
  status: string;
  data: {
    folder: FileItem;
  };
}

interface UploadFileResponse {
  status: string;
  data: {
    file: FileItem;
  };
}

const fileService = {
  /**
   * Получение списка файлов и папок
   */
  getFiles: async (
    parentFolderId?: string, 
    search?: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<{ files: FileItem[], pagination: PaginationData }> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      const params: any = { page, limit };
      
      if (parentFolderId) {
        params.parentFolderId = parentFolderId;
      }
      
      if (search) {
        params.search = search;
      }
      
      const response = await axios.get<FileResponse>(`${API_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Ошибка при получении списка файлов:', error);
      throw error;
    }
  },
  
  /**
   * Создание новой папки
   */
  createFolder: async (name: string, parentFolderId?: string): Promise<FileItem> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      const response = await axios.post<CreateFolderResponse>(
        `${API_URL}/api/files/folder`,
        { name, parentFolderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.data.folder;
    } catch (error) {
      console.error('Ошибка при создании папки:', error);
      throw error;
    }
  },
  
  /**
   * Загрузка файла
   */
  uploadFile: async (file: File, parentFolderId?: string): Promise<FileItem> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      if (parentFolderId) {
        formData.append('parentFolderId', parentFolderId);
      }
      
      const response = await axios.post<UploadFileResponse>(
        `${API_URL}/api/files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data.data.file;
    } catch (error) {
      console.error('Ошибка при загрузке файла:', error);
      throw error;
    }
  },
  
  /**
   * Получение URL для скачивания файла
   */
  getDownloadUrl: (fileId: string): string => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Не авторизован');
    }
    
    return `${API_URL}/api/files/download/${fileId}?token=${token}`;
  },
  
  /**
   * Удаление файла или папки
   */
  deleteFile: async (fileId: string): Promise<void> => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Не авторизован');
      }
      
      await axios.delete(`${API_URL}/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
      throw error;
    }
  }
};

export default fileService; 