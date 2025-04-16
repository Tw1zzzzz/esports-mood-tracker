import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Avatar, 
  LinearProgress, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardHeader, 
  Badge, 
  IconButton,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  EmojiEvents as EmojiEventsIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { COLORS } from '../theme';

interface Player {
  rank: number;
  name: string;
  rating: number;
  gamePoints: number;
  nonGamePoints: number;
  discipline: number;
}

// Определение типов данных
interface StatItem {
  title: string;
  value: string | number;
  trend: number;
}

interface PlayerRanking {
  id: string;
  name: string;
  position: string;
  avatar: string;
  points: number;
  achievements: string[];
  progress: number;
  trend: number;
}

// Тестовые данные, в реальном приложении должны быть получены с сервера
const players: Player[] = [
  { rank: 1, name: "Alexander 'Pro' Smith", rating: 2850, gamePoints: 890, nonGamePoints: 780, discipline: 95 },
  { rank: 2, name: "Maria 'Queen' Johnson", rating: 2780, gamePoints: 840, nonGamePoints: 720, discipline: 90 },
  { rank: 3, name: "Daniel 'Ace' Williams", rating: 2750, gamePoints: 820, nonGamePoints: 700, discipline: 85 },
  { rank: 4, name: "Elena 'Star' Brown", rating: 2700, gamePoints: 780, nonGamePoints: 650, discipline: 88 },
  { rank: 5, name: "Ivan 'Hunter' Petrov", rating: 2650, gamePoints: 760, nonGamePoints: 640, discipline: 82 },
  { rank: 6, name: "Sophia 'Legend' Lee", rating: 2600, gamePoints: 730, nonGamePoints: 610, discipline: 87 },
];

// Тестовые данные для статистики
const weekStats: StatItem[] = [
  { title: "Активных игроков", value: 24, trend: 5 },
  { title: "Среднее настроение", value: "7.8/10", trend: 2 },
  { title: "Средняя энергия", value: "7.2/10", trend: -1 },
  { title: "Тестов пройдено", value: 56, trend: 12 },
];

const monthStats: StatItem[] = [
  { title: "Активных игроков", value: 32, trend: 8 },
  { title: "Среднее настроение", value: "7.5/10", trend: 1 },
  { title: "Средняя энергия", value: "7.0/10", trend: 0 },
  { title: "Тестов пройдено", value: 128, trend: 15 },
];

const allTimeStats: StatItem[] = [
  { title: "Всего игроков", value: 48, trend: 20 },
  { title: "Среднее настроение", value: "7.4/10", trend: 5 },
  { title: "Средняя энергия", value: "7.1/10", trend: 3 },
  { title: "Тестов пройдено", value: 560, trend: 25 },
];

// Тестовые данные для игроков
const generatePlayers = (): PlayerRanking[] => {
  const positions = ["Нападающий", "Полузащитник", "Защитник", "Вратарь"];
  const achievements = ["MVP", "Лучший бомбардир", "Лидер команды", "Железный игрок", "Прогресс месяца"];
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Игрок ${i + 1}`,
    position: positions[Math.floor(Math.random() * positions.length)],
    avatar: `https://i.pravatar.cc/150?img=${i + 10}`,
    points: Math.floor(Math.random() * 500) + 500,
    achievements: achievements.slice(0, Math.floor(Math.random() * 3) + 1),
    progress: Math.floor(Math.random() * 100),
    trend: Math.floor(Math.random() * 20) - 10,
  })).sort((a, b) => b.points - a.points);
};

const weeklyPlayers = generatePlayers();
const monthlyPlayers = generatePlayers();
const allTimePlayers = generatePlayers();

const TopPlayers: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week');
  const theme = useTheme();
  
  // Получение нужных данных на основе выбранного периода
  const getStatsData = () => {
    switch (period) {
      case 'week': return weekStats;
      case 'month': return monthStats;
      case 'all': return allTimeStats;
      default: return weekStats;
    }
  };
  
  const getPlayersData = () => {
    switch (period) {
      case 'week': return weeklyPlayers;
      case 'month': return monthlyPlayers;
      case 'all': return allTimePlayers;
      default: return weeklyPlayers;
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: 'week' | 'month' | 'all') => {
    setPeriod(newValue);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: COLORS.backgroundSecondary,
        boxShadow: `0 4px 20px 0 ${COLORS.shadowColor}`
      }}>
        <Typography variant="h4" component="h1" gutterBottom color={COLORS.textPrimary}>
          Топ игроков
        </Typography>
        <Typography variant="body1" color={COLORS.textSecondary} sx={{ mb: 2 }}>
          Рейтинг игроков по производительности, активности и достижениям
        </Typography>
        
        <Tabs
          value={period}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: COLORS.primary,
            },
            '& .MuiTab-root': {
              color: COLORS.textSecondary,
              '&.Mui-selected': {
                color: COLORS.primary,
              },
            },
            mb: 3
          }}
        >
          <Tab label="Неделя" value="week" />
          <Tab label="Месяц" value="month" />
          <Tab label="Все время" value="all" />
        </Tabs>
        
        {/* Карточки со статистикой */}
        <StatsCards stats={getStatsData()} />
        
        {/* Таблица игроков */}
        <PlayersTable players={getPlayersData()} />
      </Box>
    </Container>
  );
};

// Компонент для отображения карточек статистики
const StatsCards: React.FC<{ stats: StatItem[] }> = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card sx={{ 
            height: '100%',
            backgroundColor: COLORS.cardBackground,
            borderRadius: 2,
            boxShadow: `0 4px 12px 0 ${COLORS.shadowColor}`,
            transition: 'transform 0.3s, box-shadow 0.3s',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: `0 8px 24px 0 ${COLORS.shadowColor}`,
            }
          }}>
            <CardContent>
              <Typography variant="h6" component="div" color={COLORS.textPrimary} gutterBottom>
                {stat.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" component="div" color={COLORS.primary} fontWeight="bold">
                  {stat.value}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: stat.trend > 0 ? COLORS.success : stat.trend < 0 ? COLORS.error : COLORS.textSecondary
                }}>
                  {stat.trend > 0 ? (
                    <TrendingUpIcon fontSize="small" />
                  ) : stat.trend < 0 ? (
                    <TrendingDownIcon fontSize="small" />
                  ) : (
                    <TrendingFlatIcon fontSize="small" />
                  )}
                  <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                    {Math.abs(stat.trend)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

// Компонент для отображения таблицы игроков
const PlayersTable: React.FC<{ players: PlayerRanking[] }> = ({ players }) => {
  return (
    <Paper sx={{ 
      p: 0, 
      overflow: 'hidden',
      backgroundColor: COLORS.cardBackground,
      borderRadius: 2,
      boxShadow: `0 4px 12px 0 ${COLORS.shadowColor}`,
    }}>
      <Box sx={{ p: 3, borderBottom: `1px solid ${COLORS.divider}` }}>
        <Typography variant="h5" component="h2" color={COLORS.textPrimary}>
          Рейтинг игроков
        </Typography>
      </Box>
      
      {players.map((player, index) => (
        <Box 
          key={player.id}
          sx={{ 
            p: 2, 
            display: 'flex', 
            alignItems: 'center',
            borderBottom: index !== players.length - 1 ? `1px solid ${COLORS.divider}` : 'none',
            '&:hover': {
              backgroundColor: COLORS.hoverBackground,
            }
          }}
        >
          <Typography 
            variant="h5" 
            sx={{ 
              minWidth: 40, 
              fontWeight: 'bold',
              color: index < 3 ? COLORS.primary : COLORS.textSecondary
            }}
          >
            #{index + 1}
          </Typography>
          
          <Avatar 
            src={player.avatar} 
            alt={player.name}
            sx={{ 
              width: 50, 
              height: 50, 
              border: index < 3 ? `2px solid ${COLORS.primary}` : 'none',
              ml: 1
            }}
          />
          
          <Box sx={{ ml: 2, flex: 1 }}>
            <Typography variant="h6" color={COLORS.textPrimary}>
              {player.name}
            </Typography>
            <Typography variant="body2" color={COLORS.textSecondary}>
              {player.position}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
            <StarIcon sx={{ color: COLORS.gold, mr: 1 }} />
            <Typography variant="h6" color={COLORS.textPrimary} fontWeight="bold">
              {player.points}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', maxWidth: 200, mr: 3 }}>
            {player.achievements.map((achievement, i) => (
              <Badge 
                key={i} 
                sx={{ 
                  m: 0.5, 
                  py: 0.5, 
                  px: 1, 
                  borderRadius: 1,
                  backgroundColor: COLORS.backgroundAccent,
                  color: COLORS.textPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 14, mr: 0.5, color: COLORS.gold }} />
                {achievement}
              </Badge>
            ))}
          </Box>
          
          <Box sx={{ width: 180 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color={COLORS.textSecondary}>
                Прогресс
              </Typography>
              <Typography variant="body2" color={COLORS.textSecondary}>
                {player.progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={player.progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: COLORS.progressBackground,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: COLORS.primary,
                  borderRadius: 4,
                }
              }}
            />
          </Box>
          
          <Box 
            sx={{ 
              ml: 3, 
              display: 'flex', 
              alignItems: 'center',
              color: player.trend > 0 ? COLORS.success : player.trend < 0 ? COLORS.error : COLORS.textSecondary
            }}
          >
            {player.trend > 0 ? (
              <TrendingUpIcon />
            ) : player.trend < 0 ? (
              <TrendingDownIcon />
            ) : (
              <TrendingFlatIcon />
            )}
            <Typography 
              variant="body1" 
              sx={{ ml: 0.5 }}
            >
              {Math.abs(player.trend)}%
            </Typography>
          </Box>
        </Box>
      ))}
    </Paper>
  );
};

export default TopPlayers; 