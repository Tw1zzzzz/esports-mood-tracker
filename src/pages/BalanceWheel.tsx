
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { BalanceWheel as BalanceWheelType } from "@/types";
import { ResponsiveRadar } from '@nivo/radar';

// Mock data - in a real app would come from an API/database
const MOCK_WHEELS: BalanceWheelType[] = [
  {
    id: "wheel1",
    userId: "1",
    date: new Date("2023-05-15"),
    physical: 7,
    emotional: 6,
    intellectual: 8,
    spiritual: 5,
    occupational: 9,
    social: 7,
    environmental: 6,
    financial: 8
  },
  {
    id: "wheel2",
    userId: "1",
    date: new Date("2023-06-20"),
    physical: 8,
    emotional: 7,
    intellectual: 8,
    spiritual: 6,
    occupational: 7,
    social: 8,
    environmental: 7,
    financial: 7
  }
];

// Categories for the balance wheel
const categories = [
  { id: "physical", name: "Физическое здоровье", description: "Здоровье, энергия, активность" },
  { id: "emotional", name: "Эмоциональное состояние", description: "Управление эмоциями, стрессоустойчивость" },
  { id: "intellectual", name: "Интеллектуальное развитие", description: "Обучение, творчество, развитие навыков" },
  { id: "spiritual", name: "Духовное развитие", description: "Ценности, цели, смысл" },
  { id: "occupational", name: "Профессиональная сфера", description: "Карьера, достижения, реализация" },
  { id: "social", name: "Социальные отношения", description: "Семья, друзья, команда" },
  { id: "environmental", name: "Окружающая среда", description: "Жизненное пространство, комфорт" },
  { id: "financial", name: "Финансовое благополучие", description: "Доходы, сбережения, инвестиции" }
];

const BalanceWheel = () => {
  const { user } = useAuth();
  const [isStaffView, setIsStaffView] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Initial values for each category
  const initialValues = {
    physical: 5,
    emotional: 5,
    intellectual: 5,
    spiritual: 5,
    occupational: 5,
    social: 5,
    environmental: 5,
    financial: 5
  };
  
  const [values, setValues] = useState(initialValues);
  const [wheels, setWheels] = useState(MOCK_WHEELS);
  
  const handleSliderChange = (category: keyof typeof initialValues, value: number[]) => {
    setValues(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };
  
  const handleSave = () => {
    if (!user) {
      toast.error("Необходимо войти в систему");
      return;
    }
    
    try {
      const newWheel: BalanceWheelType = {
        id: Math.random().toString(36).substring(7),
        userId: user.id,
        date: new Date(date),
        physical: values.physical,
        emotional: values.emotional,
        intellectual: values.intellectual,
        spiritual: values.spiritual,
        occupational: values.occupational,
        social: values.social,
        environmental: values.environmental,
        financial: values.financial
      };

      // In a real app, save to API/database
      setWheels(prev => [...prev, newWheel]);
      toast.success("Колесо баланса сохранено");
      
      // Reset form
      setValues(initialValues);
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      toast.error("Ошибка при сохранении");
      console.error(error);
    }
  };
  
  // Format data for the radar chart
  const getChartData = (wheel: BalanceWheelType) => {
    return [
      {
        name: "Баланс",
        physical: wheel.physical,
        emotional: wheel.emotional,
        intellectual: wheel.intellectual,
        spiritual: wheel.spiritual,
        occupational: wheel.occupational,
        social: wheel.social,
        environmental: wheel.environmental,
        financial: wheel.financial
      }
    ];
  };
  
  // Get the latest wheel data
  const getLatestWheel = () => {
    if (wheels.length === 0) return null;
    
    // Filter by user id if not staff
    const userWheels = isStaffView 
      ? wheels 
      : wheels.filter(w => user && w.userId === user.id);
    
    if (userWheels.length === 0) return null;
    
    return userWheels.reduce((latest, current) => {
      return new Date(latest.date) > new Date(current.date) ? latest : current;
    }, userWheels[0]);
  };
  
  const latestWheel = getLatestWheel();
  const isStaff = user?.role === "staff";
  const canEdit = user?.role === "player";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Колесо баланса</h2>
          <p className="text-muted-foreground">
            Оцените разные аспекты вашей жизни по шкале от 1 до 10
          </p>
        </div>
        
        {isStaff && (
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isStaffView} 
                onChange={() => setIsStaffView(!isStaffView)}
                className="form-checkbox h-4 w-4"
              />
              <span>Просмотр данных всех игроков</span>
            </label>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Balance Wheel Form */}
        <Card className={`${isStaff ? "opacity-50 pointer-events-none" : ""}`}>
          <CardHeader>
            <CardTitle>Заполните ваше колесо баланса</CardTitle>
            <CardDescription>
              Оцените каждую область вашей жизни на данный момент
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Дата</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>
            
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={category.id}>{category.name}</Label>
                  <span className="text-sm font-medium">
                    {values[category.id as keyof typeof values]}/10
                  </span>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-sm text-muted-foreground hover:underline">
                      Что это значит?
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="right">
                    <p className="text-sm">{category.description}</p>
                  </PopoverContent>
                </Popover>
                <Slider
                  id={category.id}
                  min={1}
                  max={10}
                  step={1}
                  value={[values[category.id as keyof typeof values]]}
                  onValueChange={(value) => handleSliderChange(category.id as keyof typeof values, value)}
                  disabled={!canEdit}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={!user || !canEdit}>
              Сохранить колесо баланса
            </Button>
          </CardFooter>
        </Card>
        
        {/* Right column - Visualizations */}
        <Card>
          <CardHeader>
            <CardTitle>Визуализация колеса баланса</CardTitle>
            <CardDescription>
              {latestWheel 
                ? `Последнее колесо баланса (${latestWheel.date instanceof Date 
                  ? latestWheel.date.toLocaleDateString() 
                  : new Date(latestWheel.date).toLocaleDateString()})`
                : "Нет доступных данных"}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {latestWheel ? (
              <ResponsiveRadar
                data={getChartData(latestWheel)}
                keys={categories.map(c => c.id)}
                indexBy="name"
                maxValue={10}
                margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
                borderColor={{ from: 'color' }}
                gridLabelOffset={36}
                dotSize={10}
                dotColor={{ theme: 'background' }}
                dotBorderWidth={2}
                colors={{ scheme: 'nivo' }}
                blendMode="multiply"
                motionConfig="wobbly"
                legends={[
                  {
                    anchor: 'top-left',
                    direction: 'column',
                    translateX: -50,
                    translateY: -40,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: '#999',
                    symbolSize: 12,
                    symbolShape: 'circle',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemTextColor: '#000'
                        }
                      }
                    ]
                  }
                ]}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Нет данных для отображения. {!isStaff && "Заполните ваше первое колесо баланса!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BalanceWheel;
