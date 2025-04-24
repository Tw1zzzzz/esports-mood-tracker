import mongoose from 'mongoose';

export interface FileDocument extends mongoose.Document {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  mimeType?: string;
  owner: mongoose.Types.ObjectId;
  parentFolder?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Имя файла обязательно"],
      trim: true,
    },
    path: {
      type: String,
      required: [true, "Путь к файлу обязателен"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["file", "folder"],
      required: [true, "Тип файла обязателен"],
    },
    size: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Владелец файла обязателен"],
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Создаем виртуальное свойство для получения детей папки
fileSchema.virtual('children', {
  ref: 'File',
  localField: '_id',
  foreignField: 'parentFolder',
  match: { isDeleted: false }
});

// Метод для преобразования размера файла в человекочитаемый формат
fileSchema.methods.getHumanReadableSize = function (): string {
  const bytes = this.size;
  
  if (bytes === 0) return '0 байт';
  
  const k = 1024;
  const sizes = ['байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Создаем и экспортируем модель
const File = mongoose.model<FileDocument>('File', fileSchema);

export default File; 