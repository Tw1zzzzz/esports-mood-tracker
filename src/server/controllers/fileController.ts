import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import File from '../models/File';
import { AuthRequest } from '../middleware/types';

interface FolderDocument {
  _id: string;
  name: string;
  folder: string | null;
  user: {
    toString: () => string;
  };
  save: () => Promise<any>;
}

// Заглушка для модели Folder
const Folder = {
  findOne: async (filter: any): Promise<FolderDocument | null> => {
    // Реальная реализация должна использовать MongoDB
    return null;
  },
  findById: async (id: string): Promise<FolderDocument | null> => {
    // Реальная реализация должна использовать MongoDB
    return null;
  },
  countDocuments: async (filter: any): Promise<number> => {
    // Реальная реализация должна использовать MongoDB
    return 0;
  },
  find: async (filter: any) => {
    // Возвращаем массив, который можно сортировать
    return Promise.resolve([]);
  }
};

// Настройка хранилища и ограничений для multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
}).single('file');

/**
 * Получение списка файлов и папок с пагинацией
 */
export const getFiles = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const folderId = req.query.folderId as string;
    
    const filter: any = {};
    
    // Добавляем фильтр по папке, если указан
    if (folderId) {
      filter.folder = folderId === 'root' ? null : folderId;
    } else {
      filter.folder = null; // По умолчанию показываем файлы в корневой папке
    }
    
    // Добавляем поиск по имени, если указан
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    // Ограничиваем доступ к файлам в зависимости от роли пользователя
    if (!req.user.isStaff) {
      filter.owner = req.user._id; // Используем owner вместо user, если так определено в модели
    }
    
    // Получаем файлы и папки
    const [files, folders, totalFiles, totalFolders] = await Promise.all([
      File.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('owner', 'username'),
      // Получаем папки отдельно и применяем сортировку после получения данных
      Folder.find(filter).then(folders => {
        return folders.sort((a, b) => {
          // Сортировка по убыванию даты создания (предполагаем, что есть поле createdAt)
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }).slice(skip, skip + limit);
      }),
      File.countDocuments(filter),
      Folder.countDocuments(filter)
    ]);
    
    const total = totalFiles + totalFolders;
    
    return res.json({
      files,
      folders,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка при получении файлов:', error);
    return res.status(500).json({ message: 'Не удалось получить файлы' });
  }
};

/**
 * Создание новой папки
 */
export const createFolder = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { name, parentFolder } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Имя папки обязательно' });
    }
    
    // Проверяем, существует ли папка с таким именем в том же родителе
    const filter: any = { name, owner: req.user._id }; // Используем owner вместо user
    if (parentFolder) {
      filter.folder = parentFolder;
    } else {
      filter.folder = null;
    }
    
    const existingFolder = await Folder.findOne(filter);
    if (existingFolder) {
      return res.status(400).json({ message: 'Папка с таким именем уже существует' });
    }
    
    // Проверяем существование родительской папки, если указана
    if (parentFolder) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) {
        return res.status(400).json({ message: 'Родительская папка не найдена' });
      }
      
      // Проверяем, принадлежит ли родительская папка текущему пользователю
      if (parent.user.toString() !== req.user._id.toString() && !req.user.isStaff) {
        return res.status(403).json({ message: 'Нет доступа к родительской папке' });
      }
    }
    
    // Создаем новую папку (используя File модель, если Folder не существует)
    const folder = new File({
      name,
      folder: parentFolder || null,
      owner: req.user._id, // Используем owner вместо user
      type: 'folder' // Добавляем тип, если он требуется для File модели
    });
    
    await folder.save();
    
    return res.status(201).json(folder);
  } catch (error) {
    console.error('Ошибка при создании папки:', error);
    return res.status(500).json({ message: 'Не удалось создать папку' });
  }
};

/**
 * Загрузка файла
 */
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    return new Promise<void>((resolve, reject) => {
      upload(req as Request, res, async (err) => {
        if (err) {
          console.error('Ошибка при загрузке файла:', err);
          res.status(400).json({ message: 'Ошибка при загрузке файла' });
          return resolve();
        }
        
        if (!req.file) {
          res.status(400).json({ message: 'Файл не найден' });
          return resolve();
        }
        
        const { originalname, filename, path: filePath, size, mimetype } = req.file;
        const { folderId } = req.body;
        
        try {
          // Проверяем, существует ли файл с таким именем в той же папке
          const filter: any = { name: originalname, owner: req.user!._id }; // Используем owner вместо user
          if (folderId) {
            filter.folder = folderId;
          } else {
            filter.folder = null;
          }
          
          const existingFile = await File.findOne(filter);
          if (existingFile) {
            // Удаляем загруженный файл
            fs.unlinkSync(filePath);
            res.status(400).json({ message: 'Файл с таким именем уже существует' });
            return resolve();
          }
          
          // Проверяем существование папки, если указана
          if (folderId) {
            const folder = await Folder.findById(folderId);
            if (!folder) {
              // Удаляем загруженный файл
              fs.unlinkSync(filePath);
              res.status(400).json({ message: 'Папка не найдена' });
              return resolve();
            }
            
            // Проверяем, принадлежит ли папка текущему пользователю
            if (folder.user.toString() !== req.user!._id.toString() && !req.user!.isStaff) {
              // Удаляем загруженный файл
              fs.unlinkSync(filePath);
              res.status(403).json({ message: 'Нет доступа к папке' });
              return resolve();
            }
          }
          
          // Создаем запись о файле в базе данных
          const file = new File({
            name: originalname,
            filename,
            path: filePath,
            size,
            mimeType: mimetype, // Используем mimeType вместо mimetype
            folder: folderId || null,
            owner: req.user!._id, // Используем owner вместо user
            type: 'file' // Добавляем тип, если он требуется для File модели
          });
          
          await file.save();
          
          res.status(201).json(file);
          return resolve();
        } catch (error) {
          console.error('Ошибка при сохранении файла:', error);
          res.status(500).json({ message: 'Не удалось сохранить файл' });
          return resolve();
        }
      });
    });
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    return res.status(500).json({ message: 'Не удалось загрузить файл' });
  }
};

/**
 * Скачивание файла
 */
export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ message: 'ID файла не указан' });
    }
    
    // Получаем файл из базы данных
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ message: 'Файл не найден' });
    }
    
    // Проверяем доступ к файлу
    if (file.owner.toString() !== req.user._id.toString() && !req.user.isStaff) {
      return res.status(403).json({ message: 'Нет доступа к файлу' });
    }
    
    // Проверяем, что это действительно файл, а не папка
    if (file.type === 'folder') {
      return res.status(400).json({ message: 'Нельзя скачать папку' });
    }
    
    // Проверяем существование файла на диске
    if (!fs.existsSync(file.path)) {
      return res.status(404).json({ message: 'Файл не найден на диске' });
    }
    
    // Отправляем файл пользователю
    return res.download(file.path, file.name);
  } catch (error) {
    console.error('Ошибка при скачивании файла:', error);
    return res.status(500).json({ message: 'Не удалось скачать файл' });
  }
};

/**
 * Удаление файла или папки
 */
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Не авторизован' });
    }

    const { fileId } = req.params;
    
    // Находим файл или папку в базе данных
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'Файл или папка не найдены' });
    }
    
    // Проверяем, принадлежит ли файл или папка текущему пользователю
    if (file.owner.toString() !== req.user._id.toString() && !req.user.isStaff) {
      return res.status(403).json({ message: 'Нет доступа к файлу или папке' });
    }
    
    // Если это папка, удаляем все файлы и подпапки внутри
    if (file.type === 'folder') {
      // Находим все файлы и подпапки в этой папке
      const children = await File.find({ folder: fileId });
      
      // Рекурсивно удаляем все содержимое
      for (const child of children) {
        await File.findByIdAndDelete(child._id);
        
        // Если это файл, удаляем его с диска
        if (child.type === 'file' && fs.existsSync(child.path)) {
          fs.unlinkSync(child.path);
        }
      }
    } else if (file.type === 'file') {
      // Если это файл, удаляем его с диска
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    }
    
    // Удаляем запись из базы данных
    await File.findByIdAndDelete(fileId);
    
    return res.json({ message: 'Файл или папка успешно удалены' });
  } catch (error) {
    console.error('Ошибка при удалении файла или папки:', error);
    return res.status(500).json({ message: 'Не удалось удалить файл или папку' });
  }
};

export default {
  getFiles,
  createFolder,
  uploadFile,
  downloadFile,
  deleteFile
};