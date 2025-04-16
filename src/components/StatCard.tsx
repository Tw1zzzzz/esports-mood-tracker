import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { COLORS, COMPONENT_STYLES } from '@/styles/theme';

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  maxValue?: number;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description, 
  trend = 0,
  maxValue,
  style = COMPONENT_STYLES.card
}) => {
  // Определяем иконку тренда
  const TrendIcon = trend > 0 
    ? <TrendingUp className="h-4 w-4" /> 
    : trend < 0 
      ? <TrendingDown className="h-4 w-4" /> 
      : <Minus className="h-4 w-4" />;
  
  // Определяем цвет тренда на основе темы
  const trendColor = trend > 0 
    ? { color: COLORS.success }
    : trend < 0 
      ? { color: COLORS.danger }
      : { color: COLORS.textColorSecondary };

  return (
    <Card style={{...COMPONENT_STYLES.card, ...style}}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium" style={{ color: COLORS.textColorSecondary }}>{title}</CardTitle>
          {trend !== 0 && (
            <Badge 
              variant="outline" 
              className="flex gap-1 items-center"
              style={{ borderColor: COLORS.borderColor, ...trendColor }}
            >
              {TrendIcon}
              <span className="text-xs">{Math.abs(trend)}%</span>
            </Badge>
          )}
          {trend === 0 && (
            <span style={{ color: COLORS.textColorSecondary }}>{TrendIcon}</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold" style={{ color: COLORS.textColor }}>{value}</p>
        {description && (
          <p className="mt-1 text-sm" style={{ color: COLORS.textColorSecondary }}>{description}</p>
        )}
      </CardContent>
    </Card>
  );
}; 