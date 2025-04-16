import React, { useState } from 'react';
import { FolderOpen, FileText, Upload, Download, Trash2, Search, Plus, Filter, Cloud, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COLORS } from "@/styles/theme";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  owner: string;
}

const FileStorage: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string[]>(['Главная']);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewType, setViewType] = useState<'list' | 'grid'>('list');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Демо-данные для отображения файлов и папок
  const demoFiles: FileItem[] = [
    { id: '1', name: 'Документы', type: 'folder', modified: '2024-04-01', owner: 'Админ' },
    { id: '2', name: 'Изображения', type: 'folder', modified: '2024-04-02', owner: 'Админ' },
    { id: '3', name: 'Видео', type: 'folder', modified: '2024-04-03', owner: 'Админ' },
    { id: '4', name: 'Инструкция.pdf', type: 'file', size: '2.4 МБ', modified: '2024-03-28', owner: 'Nbl' },
    { id: '5', name: 'Расписание тренировок.xlsx', type: 'file', size: '1.1 МБ', modified: '2024-03-30', owner: 'Area' },
    { id: '6', name: 'Тактика.docx', type: 'file', size: '3.5 МБ', modified: '2024-04-01', owner: 'Twizz' },
    { id: '7', name: 'Презентация.pptx', type: 'file', size: '5.2 МБ', modified: '2024-03-25', owner: 'Rejen' },
    { id: '8', name: 'Логотип.png', type: 'file', size: '0.8 МБ', modified: '2024-03-22', owner: 'Sxd' },
  ];

  // Фильтрация файлов по поисковому запросу
  const filteredFiles = demoFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Обработчик выбора файла или папки
  const handleItemClick = (id: string) => {
    const file = demoFiles.find(f => f.id === id);
    if (file?.type === 'folder') {
      setCurrentPath([...currentPath, file.name]);
    } else {
      // Здесь будет логика просмотра файла
      console.log(`Открыт файл: ${file?.name}`);
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
    setCurrentPath(currentPath.slice(0, index + 1));
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
            <Button size="sm" variant="outline" className="flex items-center" 
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: COLORS.borderColor, 
                      color: COLORS.primary, 
                      boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.2)" 
                    }}>
              <Download className="h-4 w-4 mr-1" />
              Скачать
            </Button>
            <Button size="sm" className="flex items-center" 
                    style={{ 
                      backgroundColor: COLORS.primary, 
                      color: COLORS.textColor,
                      boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.4)"
                    }}>
              <Upload className="h-4 w-4 mr-1" />
              Загрузить
            </Button>
            <Button size="sm" variant="outline" className="flex items-center"
                    style={{ 
                      backgroundColor: 'transparent',
                      borderColor: COLORS.borderColor, 
                      color: COLORS.primary,
                      boxShadow: "0 2px 6px 0 rgba(29, 140, 248, 0.2)"  
                    }}>
              <Plus className="h-4 w-4 mr-1" />
              Создать
            </Button>
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
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button size="sm" variant="ghost" className="flex items-center"
                   style={{ color: COLORS.primary }}>
              <Filter className="h-4 w-4 mr-1" />
              Фильтры
            </Button>
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
            {viewType === 'list' ? (
              <div className="divide-y" style={{ borderColor: COLORS.borderColor }}>
                <div className="grid grid-cols-12 py-2 px-1 font-medium text-sm" style={{ color: COLORS.textColorSecondary }}>
                  <div className="col-span-5">Название</div>
                  <div className="col-span-2">Размер</div>
                  <div className="col-span-3">Дата изменения</div>
                  <div className="col-span-2">Владелец</div>
                </div>
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <div 
                      key={file.id} 
                      style={{ 
                        backgroundColor: selectedItems.includes(file.id) ? 'rgba(29, 140, 248, 0.2)' : 'transparent'
                      }}
                      className={`grid grid-cols-12 py-2 px-1 rounded-md cursor-pointer transition-colors ${
                        selectedItems.includes(file.id) ? 'bg-blue-900/30' : ''
                      } hover:bg-opacity-10 hover:bg-primary`}
                      onClick={() => handleItemClick(file.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleSelectItem(file.id);
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
                        {file.size || '-'}
                      </div>
                      <div className="col-span-3 text-sm" style={{ color: COLORS.textColorSecondary }}>
                        {new Date(file.modified).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="col-span-2 text-sm" style={{ color: COLORS.textColorSecondary }}>
                        {file.owner}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center" style={{ color: COLORS.textColorSecondary }}>
                    Файлы не найдены
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      style={{ 
                        backgroundColor: selectedItems.includes(file.id) ? 'rgba(29, 140, 248, 0.2)' : 'transparent'
                      }}
                      className={`flex flex-col items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(file.id) ? 'bg-blue-900/30' : ''
                      } hover:bg-opacity-10 hover:bg-primary`}
                      onClick={() => handleItemClick(file.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleSelectItem(file.id);
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
                        {file.size || '-'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 text-center" style={{ color: COLORS.textColorSecondary }}>
                    Файлы не найдены
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FileStorage; 