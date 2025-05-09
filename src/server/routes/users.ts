import express from 'express';
import User from '../models/User';
import MoodEntry from '../models/MoodEntry';
import TestEntry from '../models/TestEntry';
import { protect, isStaff } from '../middleware/auth';

const router = express.Router();

// Get all players (staff only)
router.get('/players', protect, isStaff, async (_req: any, res) => {
  try {
    console.log('Fetching all players');
    const players = await User.find({ role: 'player' })
      .select('name email completedTests completedBalanceWheel createdAt')
      .sort({ createdAt: -1 });

    console.log(`Found ${players.length} players`);
    return res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get player statistics (staff only)
router.get('/players/:id/stats', protect, isStaff, async (req: any, res) => {
  try {
    console.log('Fetching stats for player:', req.params.id);
    const player = await User.findById(req.params.id)
      .select('name email completedTests completedBalanceWheel createdAt')
      .sort({ createdAt: -1 });

    if (!player) {
      console.log('Player not found:', req.params.id);
      return res.status(404).json({ message: 'Player not found' });
    }

    // Добавляем получение данных о настроении и энергии
    const moodEntries = await MoodEntry.find({ userId: req.params.id })
      .sort({ date: -1 });
    
    // Добавляем получение данных о тестах
    const testEntries = await TestEntry.find({ userId: req.params.id })
      .sort({ date: -1 });

    // Формируем объект с полной статистикой игрока
    const playerData = {
      _id: player._id,
      name: player.name,
      email: player.email,
      completedTests: player.completedTests,
      completedBalanceWheel: player.completedBalanceWheel,
      createdAt: player.createdAt,
      moodEntries,
      testEntries
    };

    console.log('Player stats found with details:', player._id);
    return res.json(playerData);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete player (staff only)
router.delete('/players/:id', protect, isStaff, async (req: any, res) => {
  try {
    console.log('Attempting to delete player:', req.params.id);
    const player = await User.findById(req.params.id);
    
    if (!player) {
      console.log('Player not found for deletion:', req.params.id);
      return res.status(404).json({ message: 'Player not found' });
    }

    if (player.role !== 'player') {
      console.log('Attempted to delete non-player user:', req.params.id);
      return res.status(400).json({ message: 'Can only delete players' });
    }

    await player.deleteOne();
    console.log('Player deleted successfully:', req.params.id);
    return res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update player status (staff only)
router.patch('/players/:id/status', protect, isStaff, async (req: any, res) => {
  try {
    console.log('Updating status for player:', req.params.id);
    const { completedTests, completedBalanceWheel } = req.body;
    const player = await User.findById(req.params.id);
    
    if (!player) {
      console.log('Player not found for status update:', req.params.id);
      return res.status(404).json({ message: 'Player not found' });
    }

    if (player.role !== 'player') {
      console.log('Attempted to update status of non-player user:', req.params.id);
      return res.status(400).json({ message: 'Can only update players' });
    }

    player.completedTests = completedTests;
    player.completedBalanceWheel = completedBalanceWheel;
    await player.save();

    console.log('Player status updated successfully:', req.params.id);
    return res.json(player);
  } catch (error) {
    console.error('Error updating player status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Удаление игрока (только для персонала)
router.delete('/players/:id', protect, isStaff, async (req, res) => {
  try {
    const playerId = req.params.id;
    console.log(`Attempting to delete player: ${playerId}`);
    
    const deletedPlayer = await User.findByIdAndDelete(playerId);
    
    if (!deletedPlayer) {
      return res.status(404).json({ success: false, message: 'Игрок не найден' });
    }
    
    console.log(`Player deleted successfully: ${playerId}`);
    res.json({ success: true, message: 'Игрок успешно удален' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при удалении игрока' });
  }
});

// Полное каскадное удаление игрока и всех его данных (только для персонала)
router.delete('/players/:id/complete', protect, isStaff, async (req, res) => {
  try {
    const playerId = req.params.id;
    console.log(`Attempting complete cascade deletion of player: ${playerId}`);

    // 1. Находим игрока перед удалением
    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ success: false, message: 'Игрок не найден' });
    }

    // Собираем базовую информацию для логов
    const playerInfo = {
      id: player._id,
      name: player.name,
      email: player.email,
    };
    
    // 2. Удаляем все связанные данные (асинхронно и параллельно)
    try {
      // Загружаем все необходимые модели
      const MoodEntry = require('../models/MoodEntry');
      const TestEntry = require('../models/TestEntry');
      const BalanceWheel = require('../models/BalanceWheel');
      const PlayerRating = require('../models/PlayerRating');
      const AnalyticsMetric = require('../models/AnalyticsMetric');
      
      // Создаем массив промисов для параллельного выполнения
      const deletePromises = [
        // Удаление записей о настроении
        MoodEntry.deleteMany({ userId: playerId }).then(result => 
          console.log(`Deleted ${result.deletedCount} mood entries for player ${playerInfo.name}`)),
        
        // Удаление записей о тестах
        TestEntry.deleteMany({ userId: playerId }).then(result => 
          console.log(`Deleted ${result.deletedCount} test entries for player ${playerInfo.name}`)),
        
        // Удаление данных колеса баланса
        BalanceWheel.deleteMany({ userId: playerId }).then(result => 
          console.log(`Deleted ${result.deletedCount} balance wheel entries for player ${playerInfo.name}`)),
        
        // Удаление из рейтингов
        PlayerRating.deleteMany({ playerId }).then(result => 
          console.log(`Deleted ${result.deletedCount} rating entries for player ${playerInfo.name}`)),
        
        // Удаление метрик аналитики
        AnalyticsMetric.deleteMany({ userId: playerId }).then(result => 
          console.log(`Deleted ${result.deletedCount} analytics metrics for player ${playerInfo.name}`)),
      ];
      
      // Ждем завершения всех операций удаления
      await Promise.all(deletePromises);
      console.log(`All related data deleted for player ${playerInfo.name} (${playerId})`);
      
    } catch (dataError) {
      console.error('Error deleting related data:', dataError);
      // Продолжаем процесс даже если не удалось удалить некоторые связанные данные
    }
    
    // 3. Удаляем самого игрока
    const deletedPlayer = await User.findByIdAndDelete(playerId);
    
    console.log(`Player completely deleted with all related data: ${playerInfo.name} (${playerId})`);
    res.json({ 
      success: true, 
      message: 'Игрок и все связанные данные успешно удалены',
      player: playerInfo 
    });
    
  } catch (error) {
    console.error('Error performing complete player deletion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка сервера при каскадном удалении игрока',
      error: error.message 
    });
  }
});

export default router; 