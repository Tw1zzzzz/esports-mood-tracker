import React, { useState, useEffect, useRef } from 'react';
import { FolderOpen, FileText, Upload, Download, Trash2, Search, Plus, Filter, Cloud, File, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { COLORS } from "@/styles/theme";
import fileService from '@/utils/fileService';

interface FileItem {
  _id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  readableSize?: string;
  path: string;
  mimeType?: string;
  owner: {
    _id: string;
    name: string;
  };
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

const FileStorage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>(['Главная']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 20, pages: 0 });
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Загрузка файлов при изменении папки или поискового запроса
  useEffect(() => {
    fetchFiles();
  }, [currentFolderId, searchQuery, pagination.page]);

  // Функция загрузки файлов с сервера
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { files: fetchedFiles, pagination: newPagination } = await fileService.getFiles(
        currentFolderId || undefined,
        searchQuery || undefined,
        pagination.page,
        pagination.limit
      );
      
      setFiles(fetchedFiles);
      setPagination(newPagination);
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файлы. Пожалуйста, попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработчик выбора файла или папки
  const handleItemClick = (id: string) => {
    const file = files.find(f => f._id === id);
    if (file?.type === 'folder') {
      setCurrentFolderId(file._id);
      setCurrentPath([...currentPath, file.name]);
      setSelectedItems([]);
    } else if (file?.type === 'file') {
      // Скачивание файла
      window.open(fileService.getDownloadUrl(file._id), '_blank');
    }
  };

  // Обработчик выбора файлов (множественный выбор)
  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Обработчик навигации по пути
  const handlePathClick = (index: number) => {
    if (index === 0) {
      // Клик на "Главная" - возвращаемся в корневую директорию
      setCurrentFolderId(null);
      setCurrentPath(['Главная']);
    } else {
      // Промежуточное нажатие - навигация до указанной папки
      // Из-за отсутствия прямой ссылки на ID промежуточных папок, лучше просто обрезать путь
      setCurrentPath(currentPath.slice(0, index + 1));
      
      // Если есть history состояний, можно было бы вернуться к соответствующему ID папки
      // На данном этапе просто возвращаемся в корень, т.к. хранение истории не реализовано
      setCurrentFolderId(null);
    }
  };

  // Обработчик создания новой папки
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите имя папки",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingFolder(true);
      await fileService.createFolder(newFolderName, currentFolderId || undefined);
      
      // Закрываем диалоговое окно и очищаем поле ввода
      setIsDialogOpen(false);
      setNewFolderName('');
      
      // Обновляем список файлов
      fetchFiles();
      
      toast({
        title: "Успех",
        description: "Папка успешно создана",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось создать папку",
        variant: "destructive"
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  // Обработчик загрузки файла
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Обработчик после выбора файла в окне диалога
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFile(true);
      const file = files[0];
      
      await fileService.uploadFile(file, currentFolderId || undefined);
      
      // Обновляем список файлов
      fetchFiles();
      
      toast({
        title: "Успех",
        description: "Файл успешно загружен",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось загрузить файл",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(false);
      
      // Очищаем input, чтобы можно было повторно загрузить тот же файл
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Обработчик скачивания файла
  const handleDownload = () => {
    if (selectedItems.length !== 1) {
      toast({
        title: "Информация",
        description: "Пожалуйста, выберите один файл для скачивания",
      });
      return;
    }

    const file = files.find(f => f._id === selectedItems[0]);
    
    if (!file || file.type === 'folder') {
      toast({
        title: "Информация",
        description: "Невозможно скачать папку",
      });
      return;
    }

    window.open(fileService.getDownloadUrl(file._id), '_blank');
  };

  // Обработчик удаления файла или папки
  const handleDelete = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Информация",
        description: "Пожалуйста, выберите файлы для удаления",
      });
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить выбранные элементы (${selectedItems.length})?`)) {
      return;
    }

    try {
      // Последовательно удаляем все выбранные элементы
      for (const id of selectedItems) {
        await fileService.deleteFile(id);
      }
      
      // Обновляем список файлов
      fetchFiles();
      
      // Очищаем выбранные элементы
      setSelectedItems([]);
      
      toast({
        title: "Успех",
        description: "Файлы успешно удалены",
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.response?.data?.message || "Не удалось удалить файлы",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col space-y-4">
        {/* Заголовок и кнопки действий */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg shadow-sm mb-2" 
             style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <div className="flex flex-col mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold tracking-tight flex items-center" style={{ color: COLORS.textColor }}>
              <Cloud className="h-6 w-6 mr-2" style={{ color: COLORS.primary }} />
              Файловое хранилище
            </h1>
            <p className="text-sm" style={{ color: COLORS.textColorSecondary }}>Загрузка и управление файлами команды</p>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center" 
              disabled={selectedItems.length !== 1}
              onClick={handleDownload}
              style={{ 
                backgroundColor: 'transparent',
                borderColor: COLORS.borderColor, 
                color: COLORS.primary, 
                boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.2)" 
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Скачать
            </Button>
            <Button 
              size="sm" 
              className="flex items-center" 
              onClick={handleFileUpload}
              disabled={uploadingFile}
              style={{ 
                backgroundColor: COLORS.primary, 
                color: COLORS.textColor,
                boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.4)"
              }}
            >
              {uploadingFile ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Загрузить
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: COLORS.borderColor, 
                      color: COLORS.primary,
                      boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.2)"  
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Создать папку
                </Button>
              </DialogTrigger>
              <DialogContent 
                className="border rounded-lg shadow-lg" 
                style={{ 
                  backgroundColor: COLORS.cardBackground, 
                  borderColor: COLORS.borderColor,
                  maxWidth: '400px'
                }}
              >
                <DialogHeader>
                  <DialogTitle 
                    className="flex items-center text-lg font-medium"
                    style={{ color: COLORS.textColor }}
                  >
                    <FolderOpen className="h-5 w-5 mr-2" style={{ color: COLORS.primary }} />
                    Создать новую папку
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <label 
                    htmlFor="folder-name"
                    className="block text-sm mb-2" 
                    style={{ color: COLORS.textColorSecondary }}
                  >
                    Введите имя для новой папки
                  </label>
                  <Input
                    id="folder-name"
                    placeholder="Имя папки"
                    className="w-full"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    style={{ 
                      backgroundColor: COLORS.backgroundColor, 
                      color: COLORS.textColor, 
                      borderColor: COLORS.borderColor 
                    }}
                  />
                </div>
                <DialogFooter className="flex justify-end gap-2 mt-2">
                  <DialogClose asChild>
                    <Button 
                      variant="outline" 
                      className="rounded-md"
                      style={{ 
                        backgroundColor: 'transparent', 
                        color: COLORS.textColorSecondary,
                        borderColor: COLORS.borderColor
                      }}
                    >
                      Отмена
                    </Button>
                  </DialogClose>
                  <Button 
                    onClick={handleCreateFolder} 
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="rounded-md" 
                    style={{ 
                      backgroundColor: COLORS.primary, 
                      color: COLORS.textColor 
                    }}
                  >
                    {creatingFolder ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-1" />
                    )}
                    Создать
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {selectedItems.length > 0 && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex items-center"
                onClick={handleDelete}
                style={{ 
                  backgroundColor: 'transparent',
                  borderColor: 'red', 
                  color: 'red'
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Удалить
              </Button>
            )}
          </div>
        </div>

        {/* Инструменты поиска и фильтрации */}
        <div className="flex flex-wrap justify-between items-center p-3 rounded-lg shadow-sm mb-2"
             style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          <div className="flex items-center space-x-2 mb-2 sm:mb-0 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: COLORS.textColorSecondary }} />
              <Input
                placeholder="Поиск файлов..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ backgroundColor: COLORS.backgroundColor, color: COLORS.textColor, borderColor: COLORS.borderColor }}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-500"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Tabs 
              defaultValue="list" 
              value={viewType} 
              onValueChange={(value) => setViewType(value as 'list' | 'grid')}
            >
              <TabsList className="border-b" style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
                <TabsTrigger 
                  value="list" 
                  className={viewType === 'list' ? 'data-[state=active]:bg-primary data-[state=active]:text-white' : ''}
                  style={{ 
                    color: viewType === 'list' ? COLORS.textColor : COLORS.textColorSecondary, 
                    backgroundColor: viewType === 'list' ? COLORS.primary : 'transparent' 
                  }}
                >
                  Список
                </TabsTrigger>
                <TabsTrigger 
                  value="grid"
                  className={viewType === 'grid' ? 'data-[state=active]:bg-primary data-[state=active]:text-white' : ''}
                  style={{ 
                    color: viewType === 'grid' ? COLORS.textColor : COLORS.textColorSecondary, 
                    backgroundColor: viewType === 'grid' ? COLORS.primary : 'transparent' 
                  }}
                >
                  Сетка
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Навигация по папкам (хлебные крошки) */}
        <div className="flex items-center p-2 rounded-lg text-sm mb-2 overflow-x-auto"
             style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor }}>
          {currentPath.map((folder, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-1" style={{ color: COLORS.textColorSecondary }}>/</span>}
              <button
                onClick={() => handlePathClick(index)}
                className={`hover:text-primary px-1 ${
                  index === currentPath.length - 1 ? 'font-semibold' : ''
                }`}
                style={{ color: index === currentPath.length - 1 ? COLORS.primary : COLORS.textColor }}
              >
                {folder}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Список файлов и папок */}
        <Card style={{ backgroundColor: COLORS.cardBackground, borderColor: COLORS.borderColor, boxShadow: "0 1px 20px 0 rgba(0,0,0,.1)" }}>
          <CardHeader className="pb-2">
            <CardTitle className="py-1 px-1" style={{ color: COLORS.textColor }}>Содержимое</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: COLORS.primary }} />
              </div>
            ) : (
              viewType === 'list' ? (
                <div className="divide-y" style={{ borderColor: COLORS.borderColor }}>
                  <div className="grid grid-cols-12 py-2 px-1 font-medium text-sm" style={{ color: COLORS.textColorSecondary }}>
                    <div className="col-span-5">Название</div>
                    <div className="col-span-2">Размер</div>
                    <div className="col-span-3">Дата изменения</div>
                    <div className="col-span-2">Владелец</div>
                  </div>
                  {files.length > 0 ? (
                    files.map((file) => (
                      <div 
                        key={file._id} 
                        style={{ 
                          backgroundColor: selectedItems.includes(file._id) ? 'rgba(29, 140, 248, 0.2)' : 'transparent'
                        }}
                        className={`grid grid-cols-12 py-2 px-1 rounded-md cursor-pointer transition-colors ${
                          selectedItems.includes(file._id) ? 'bg-blue-900/30' : ''
                        } hover:bg-opacity-10 hover:bg-primary`}
                        onClick={() => handleItemClick(file._id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleSelectItem(file._id);
                        }}
                      >
                        <div className="col-span-5 flex items-center">
                          {file.type === 'folder' ? (
                            <FolderOpen className="h-5 w-5 mr-2" style={{ color: COLORS.primary }} />
                          ) : (
                            <FileText className="h-5 w-5 mr-2" style={{ color: COLORS.textColorSecondary }} />
                          )}
                          <span style={{ color: COLORS.textColor }}>{file.name}</span>
                        </div>
                        <div className="col-span-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
                          {file.readableSize || '-'}
                        </div>
                        <div className="col-span-3 text-sm" style={{ color: COLORS.textColorSecondary }}>
                          {new Date(file.updatedAt).toLocaleDateString('ru-RU')}
                        </div>
                        <div className="col-span-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
                          {file.owner?.name || 'Н/Д'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center" style={{ color: COLORS.textColorSecondary }}>
                      {searchQuery ? 'Файлы не найдены по запросу' : 'Папка пуста'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.length > 0 ? (
                    files.map((file) => (
                      <div
                        key={file._id}
                        style={{ 
                          backgroundColor: selectedItems.includes(file._id) ? 'rgba(29, 140, 248, 0.2)' : 'transparent'
                        }}
                        className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedItems.includes(file._id) ? 'bg-blue-900/30' : ''
                        } hover:bg-opacity-10 hover:bg-primary`}
                        onClick={() => handleItemClick(file._id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          handleSelectItem(file._id);
                        }}
                      >
                        {file.type === 'folder' ? (
                          <FolderOpen className="h-12 w-12 mb-2" style={{ color: COLORS.primary }} />
                        ) : (
                          <FileText className="h-12 w-12 mb-2" style={{ color: COLORS.textColorSecondary }} />
                        )}
                        <span className="text-sm font-medium text-center break-all" style={{ color: COLORS.textColor }}>
                          {file.name}
                        </span>
                        <span className="text-xs mt-1" style={{ color: COLORS.textColorSecondary }}>
                          {file.readableSize || '-'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center" style={{ color: COLORS.textColorSecondary }}>
                      {searchQuery ? 'Файлы не найдены по запросу' : 'Папка пуста'}
                    </div>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Скрытый input для загрузки файлов */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default FileStorage; 