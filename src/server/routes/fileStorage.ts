import express from 'express';
import { protect } from '../middleware/authMiddleware';
import fileController from '../controllers/fileController';
import multer from 'multer';
import path from 'path';

const router = express.Router();

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
});

// Все маршруты хранилища требуют аутентификации
router.use(protect);

// Получение списка файлов/папок в корне или в конкретной папке
router.get('/:folderId?', fileController.getFiles);

// Создание новой папки
router.post('/folder', fileController.createFolder);

// Загрузка файла в конкретную папку
router.post('/upload/:folderId?', fileController.uploadFile);

// Скачивание файла
router.get('/download/:fileId', fileController.downloadFile);

// Удаление файла или папки
router.delete('/:fileId', fileController.deleteFile);

export default router; 