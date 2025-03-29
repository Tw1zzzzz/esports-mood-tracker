
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Link as LinkIcon, Calendar as CalendarIcon, Image, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TestEntry } from "@/types";
import { getTestEntries, saveTestEntry, updateTestEntry, deleteTestEntry } from "@/utils/storage";
import { formatDate, getCurrentWeekRange, getWeekLabel, getPrevWeek, getNextWeek } from "@/utils/dateUtils";
import { fileToDataUrl, validateImageFile } from "@/utils/fileUtils";
import { cn } from "@/lib/utils";

const TestTracker = () => {
  const { toast } = useToast();
  const [tests, setTests] = useState<TestEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [name, setName] = useState<string>("");
  const [link, setLink] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [isWeeklyTest, setIsWeeklyTest] = useState<boolean>(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingTest, setEditingTest] = useState<TestEntry | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");
  
  useEffect(() => {
    loadTests();
  }, [currentWeek]);
  
  const loadTests = () => {
    const loadedTests = getTestEntries();
    setTests(loadedTests);
  };
  
  const resetForm = () => {
    setName("");
    setLink("");
    setDate(new Date());
    setIsWeeklyTest(false);
    setScreenshot(null);
    setEditingTest(null);
  };
  
  const handlePrevWeek = () => {
    setCurrentWeek(getPrevWeek(currentWeek));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(getNextWeek(currentWeek));
  };
  
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название теста",
        variant: "destructive",
      });
      return;
    }
    
    if (!link.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ссылку на тест",
        variant: "destructive",
      });
      return;
    }
    
    try {
      let screenshotUrl: string | undefined = undefined;
      
      if (screenshot) {
        const error = validateImageFile(screenshot);
        if (error) {
          toast({
            title: "Ошибка",
            description: error,
            variant: "destructive",
          });
          return;
        }
        
        screenshotUrl = await fileToDataUrl(screenshot);
      }
      
      if (editingTest) {
        // Update existing test
        updateTestEntry(editingTest.id, {
          name,
          link,
          date,
          isWeeklyTest,
          screenshotUrl: screenshotUrl || editingTest.screenshotUrl,
        });
        
        toast({
          title: "Тест обновлен",
          description: "Данные теста успешно обновлены.",
        });
      } else {
        // Add new test
        saveTestEntry({
          name,
          link,
          date,
          isWeeklyTest,
          screenshotUrl,
        });
        
        toast({
          title: "Тест добавлен",
          description: "Новый тест успешно добавлен.",
        });
      }
      
      loadTests();
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving test:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении теста.",
        variant: "destructive",
      });
    }
  };
  
  const handleEdit = (test: TestEntry) => {
    setEditingTest(test);
    setName(test.name);
    setLink(test.link);
    setDate(new Date(test.date));
    setIsWeeklyTest(test.isWeeklyTest);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    deleteTestEntry(id);
    loadTests();
    
    toast({
      title: "Тест удален",
      description: "Тест успешно удален.",
    });
  };
  
  const getWeekTests = () => {
    const { start, end } = getCurrentWeekRange(currentWeek);
    
    return tests.filter((test) => {
      const testDate = new Date(test.date);
      return testDate >= start && testDate <= end;
    });
  };
  
  const getDailyTests = () => {
    return getWeekTests().filter((test) => !test.isWeeklyTest);
  };
  
  const getWeeklyTests = () => {
    return getWeekTests().filter((test) => test.isWeeklyTest);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Трекер тестов</h2>
          <p className="text-muted-foreground">
            Отслеживайте прогресс по ежедневным и еженедельным тестам
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Добавить тест
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingTest ? "Редактировать тест" : "Добавить новый тест"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о тесте и загрузите скриншот
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Название теста</Label>
                <Input
                  id="name"
                  placeholder="Введите название теста"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="link">Ссылка на тест</Label>
                <div className="flex">
                  <Input
                    id="link"
                    placeholder="https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="date">Дата</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? formatDate(date) : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        date && setDate(date);
                        setIsDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="weekly-test"
                  checked={isWeeklyTest}
                  onCheckedChange={setIsWeeklyTest}
                />
                <Label htmlFor="weekly-test">Еженедельный тест</Label>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="screenshot">Скриншот</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setScreenshot(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <Label
                    htmlFor="screenshot"
                    className="flex h-10 cursor-pointer items-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background hover:bg-accent hover:text-accent-foreground"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {screenshot ? screenshot.name : (editingTest?.screenshotUrl ? "Изменить скриншот" : "Выбрать файл")}
                  </Label>
                  {screenshot && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setScreenshot(null)}
                    >
                      Удалить
                    </Button>
                  )}
                </div>
                {editingTest?.screenshotUrl && !screenshot && (
                  <div className="mt-2 border rounded-md p-2">
                    <p className="text-xs text-muted-foreground mb-2">Текущий скриншот:</p>
                    <img 
                      src={editingTest.screenshotUrl} 
                      alt="Текущий скриншот" 
                      className="max-h-24 rounded-md"
                    />
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit}>
                {editingTest ? "Сохранить изменения" : "Добавить тест"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Тесты на неделю</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <CalendarIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {getWeekLabel(currentWeek)}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Просмотр и управление ежедневными и еженедельными тестами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="daily" 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "daily" | "weekly")}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Ежедневные тесты</TabsTrigger>
              <TabsTrigger value="weekly">Еженедельные тесты</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              {getDailyTests().length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Нет ежедневных тестов на эту неделю</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      resetForm();
                      setIsWeeklyTest(false);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить ежедневный тест
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 p-4 bg-secondary text-secondary-foreground font-medium">
                    <div className="col-span-3">Дата</div>
                    <div className="col-span-4">Название теста</div>
                    <div className="col-span-3">Ссылка / Скриншот</div>
                    <div className="col-span-2">Действия</div>
                  </div>
                  
                  {getDailyTests()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((test) => (
                      <div
                        key={test.id}
                        className="grid grid-cols-12 p-4 border-t items-center"
                      >
                        <div className="col-span-3 text-sm">
                          {formatDate(test.date)}
                        </div>
                        <div className="col-span-4 font-medium">
                          {test.name}
                        </div>
                        <div className="col-span-3 flex space-x-2">
                          <a
                            href={test.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          {test.screenshotUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Image className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Скриншот теста: {test.name}</DialogTitle>
                                </DialogHeader>
                                <img
                                  src={test.screenshotUrl}
                                  alt={test.name}
                                  className="w-full h-auto rounded-md"
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(test)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(test.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="weekly">
              {getWeeklyTests().length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Image className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">Нет еженедельных тестов на эту неделю</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      resetForm();
                      setIsWeeklyTest(true);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Добавить еженедельный тест
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 p-4 bg-secondary text-secondary-foreground font-medium">
                    <div className="col-span-3">Дата</div>
                    <div className="col-span-4">Название теста</div>
                    <div className="col-span-3">Ссылка / Скриншот</div>
                    <div className="col-span-2">Действия</div>
                  </div>
                  
                  {getWeeklyTests()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((test) => (
                      <div
                        key={test.id}
                        className="grid grid-cols-12 p-4 border-t items-center"
                      >
                        <div className="col-span-3 text-sm">
                          {formatDate(test.date)}
                        </div>
                        <div className="col-span-4 font-medium">
                          {test.name}
                        </div>
                        <div className="col-span-3 flex space-x-2">
                          <a
                            href={test.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          {test.screenshotUrl && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Image className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Скриншот теста: {test.name}</DialogTitle>
                                </DialogHeader>
                                <img
                                  src={test.screenshotUrl}
                                  alt={test.name}
                                  className="w-full h-auto rounded-md"
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                        <div className="col-span-2 flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(test)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(test.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestTracker;
