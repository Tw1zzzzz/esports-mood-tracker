
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Calendar, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MoodEntry } from "@/types";
import { getMoodEntries, saveMoodEntry, deleteMoodEntry } from "@/utils/storage";
import { formatDate, formatTimeOfDay, getTimeOfDay, getCurrentWeekRange, getWeekLabel, getPrevWeek, getNextWeek } from "@/utils/dateUtils";

const MoodTracker = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [mood, setMood] = useState<number>(5);
  const [energy, setEnergy] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening">(getTimeOfDay());
  const [isAddingEntry, setIsAddingEntry] = useState<boolean>(false);
  
  useEffect(() => {
    loadEntries();
    generateWeekDates(currentWeek);
  }, [currentWeek]);
  
  const loadEntries = () => {
    const loadedEntries = getMoodEntries();
    setEntries(loadedEntries);
  };
  
  const generateWeekDates = (date: Date) => {
    const { start } = getCurrentWeekRange(date);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    setWeekDates(days);
  };
  
  const handlePrevWeek = () => {
    setCurrentWeek(getPrevWeek(currentWeek));
  };
  
  const handleNextWeek = () => {
    setCurrentWeek(getNextWeek(currentWeek));
  };
  
  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
  };
  
  const resetForm = () => {
    setMood(5);
    setEnergy(5);
    setComment("");
    setTimeOfDay(getTimeOfDay());
  };
  
  const handleSubmit = () => {
    const newEntry: Omit<MoodEntry, "id"> = {
      date: selectedDate,
      timeOfDay,
      mood,
      energy,
      comment: comment.trim() || undefined,
    };
    
    saveMoodEntry(newEntry);
    loadEntries();
    resetForm();
    setIsAddingEntry(false);
    
    toast({
      title: "Запись добавлена",
      description: "Запись о настроении успешно сохранена.",
    });
  };
  
  const handleDelete = (id: string) => {
    deleteMoodEntry(id);
    loadEntries();
    
    toast({
      title: "Запись удалена",
      description: "Запись о настроении успешно удалена.",
    });
  };
  
  const getDayEntries = (date: Date) => {
    return entries.filter(
      (entry) => new Date(entry.date).toDateString() === date.toDateString()
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Отслеживание настроения</h2>
          <p className="text-muted-foreground">
            Записывайте свое настроение и уровень энергии 3 раза в день
          </p>
        </div>
        <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Добавить запись
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Добавить запись</DialogTitle>
              <DialogDescription>
                Запишите свое настроение и энергию на {formatDate(selectedDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Tabs defaultValue="morning" onValueChange={(v) => setTimeOfDay(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="morning">Утро</TabsTrigger>
                  <TabsTrigger value="afternoon">День</TabsTrigger>
                  <TabsTrigger value="evening">Вечер</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="space-y-2">
                <Label htmlFor="mood">Настроение ({mood}/10)</Label>
                <Slider 
                  id="mood" 
                  min={1} 
                  max={10} 
                  step={1} 
                  value={[mood]} 
                  onValueChange={(vals) => setMood(vals[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="energy">Энергия ({energy}/10)</Label>
                <Slider 
                  id="energy" 
                  min={1} 
                  max={10} 
                  step={1} 
                  value={[energy]} 
                  onValueChange={(vals) => setEnergy(vals[0])} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment">Комментарий (необязательно)</Label>
                <Textarea 
                  id="comment" 
                  placeholder="Напишите комментарий о своем самочувствии..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Записи за неделю</CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">
                {getWeekLabel(currentWeek)}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            Выберите день для просмотра записей
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDates.map((date) => {
              const dayEntries = getDayEntries(date);
              return (
                <div
                  key={date.toISOString()}
                  className={`text-center p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedDate.toDateString() === date.toDateString()
                      ? "bg-esports-teal/10 border border-esports-teal"
                      : "bg-white border hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectDate(date)}
                >
                  <p className="text-sm font-medium">
                    {formatDate(date, "EEE")}
                  </p>
                  <p className="text-xl font-semibold">
                    {formatDate(date, "d")}
                  </p>
                  <div className="mt-2 flex justify-center">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        dayEntries.length > 0 ? "bg-esports-teal" : "bg-gray-200"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Записи за {formatDate(selectedDate)}
        </h3>
        
        <div className="grid gap-4 md:grid-cols-3">
          {["morning", "afternoon", "evening"].map((time) => {
            const timeEntries = getDayEntries(selectedDate).filter(
              (entry) => entry.timeOfDay === time
            );
            
            return (
              <Card key={time} className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">
                    {time === "morning"
                      ? "Утро"
                      : time === "afternoon"
                      ? "День"
                      : "Вечер"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {timeEntries.length > 0 ? (
                    timeEntries.map((entry) => (
                      <div key={entry.id} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Настроение:</span>
                          <span className="font-semibold">{entry.mood}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Энергия:</span>
                          <span className="font-semibold">{entry.energy}/10</span>
                        </div>
                        {entry.comment && (
                          <div className="mt-2 text-sm text-gray-600">
                            {entry.comment}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Calendar className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">Нет записей</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4"
                        onClick={() => {
                          setTimeOfDay(time as any);
                          setIsAddingEntry(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
