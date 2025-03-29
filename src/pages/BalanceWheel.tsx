
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { BalanceWheel as BalanceWheelType } from "@/types";
import { ResponsiveRadar } from '@nivo/radar';

// Mock data storage
let mockBalanceWheels: BalanceWheelType[] = [];

const categories = [
  { id: "physical", name: "Физическое здоровье" },
  { id: "emotional", name: "Эмоциональное состояние" },
  { id: "intellectual", name: "Интеллектуальное развитие" },
  { id: "spiritual", name: "Духовное развитие" },
  { id: "occupational", name: "Профессиональное развитие" },
  { id: "social", name: "Социальные отношения" },
  { id: "environmental", name: "Окружающая среда" },
  { id: "financial", name: "Финансовое благополучие" }
];

const BalanceWheel = () => {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, number>>({
    physical: 5,
    emotional: 5,
    intellectual: 5,
    spiritual: 5,
    occupational: 5,
    social: 5,
    environmental: 5,
    financial: 5
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savedWheels, setSavedWheels] = useState<BalanceWheelType[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      // In a real app, fetch from API/database
      const userWheels = mockBalanceWheels.filter(wheel => wheel.userId === user.id);
      setSavedWheels(userWheels);
    }
  }, [user]);

  const handleSliderChange = (category: string, value: number[]) => {
    setValues(prev => ({
      ...prev,
      [category]: value[0]
    }));
  };

  const handleSubmit = () => {
    if (!user) {
      toast.error("Необходимо войти в систему");
      return;
    }

    setIsSubmitting(true);

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
      mockBalanceWheels.push(newWheel);
      setSavedWheels(prev => [...prev, newWheel]);
      
      toast.success("Колесо баланса сохранено");
    } catch (error) {
      toast.error("Ошибка при сохранении");
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData = [
    {
      ...values
    }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Требуется авторизация</CardTitle>
            <CardDescription>
              Для доступа к колесу баланса необходимо войти в систему
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => window.location.href = "/login"}>
              Войти
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Колесо баланса</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Заполните колесо баланса</CardTitle>
            <CardDescription>
              Оцените каждую сферу жизни по шкале от 1 до 10
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="mb-4">
              <Label htmlFor="date">Дата</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            {categories.map(category => (
              <div key={category.id} className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor={category.id}>{category.name}</Label>
                  <span className="font-medium">{values[category.id]}</span>
                </div>
                <Slider
                  id={category.id}
                  min={1}
                  max={10}
                  step={1}
                  value={[values[category.id]]}
                  onValueChange={(value) => handleSliderChange(category.id, value)}
                />
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="w-full"
            >
              {isSubmitting ? "Сохранение..." : "Сохранить"}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="h-[500px]">
          <ResponsiveRadar
            data={chartData}
            keys={categories.map(c => c.id)}
            indexBy="name"
            maxValue={10}
            margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
            borderColor={{ from: 'color' }}
            gridLabelOffset={36}
            dotSize={10}
            dotColor={{ theme: 'background' }}
            dotBorderWidth={2}
            colors={{ scheme: 'category10' }}
            blendMode="multiply"
            motionConfig="wobbly"
          />
        </div>
      </div>

      {savedWheels.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">История колеса баланса</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedWheels.map((wheel) => (
              <Card key={wheel.id}>
                <CardHeader>
                  <CardTitle>
                    {new Date(wheel.date).toLocaleDateString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {categories.map(category => (
                      <li key={category.id} className="flex justify-between">
                        <span>{category.name}:</span>
                        <span className="font-medium">{wheel[category.id as keyof typeof wheel]}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceWheel;
