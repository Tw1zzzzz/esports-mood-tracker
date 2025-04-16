import React from 'react';
import { Trophy, Medal, Star, Award } from 'lucide-react';

interface Player {
  rank: number;
  name: string;
  rating: number;
  gamePoints: number;
  nonGamePoints: number;
  discipline: number;
}

const players: Player[] = [
  { rank: 1, name: "Alexander 'Pro' Smith", rating: 2850, gamePoints: 890, nonGamePoints: 780, discipline: 95 },
  { rank: 2, name: "Maria 'Queen' Johnson", rating: 2780, gamePoints: 840, nonGamePoints: 720, discipline: 90 },
  { rank: 3, name: "Daniel 'Ace' Williams", rating: 2750, gamePoints: 820, nonGamePoints: 700, discipline: 85 },
  { rank: 4, name: "Elena 'Star' Brown", rating: 2700, gamePoints: 780, nonGamePoints: 650, discipline: 88 },
];

function App() {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1f2e]">Рейтинг игроков академии</h1>
            <p className="text-gray-500">Статистика и достижения игроков академии</p>
          </div>
          
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white text-[#1a1f2e] rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
              За неделю
            </button>
            <button className="px-4 py-2 bg-white text-[#1a1f2e] rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
              За месяц
            </button>
            <button className="px-4 py-2 bg-white text-[#1a1f2e] rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
              За все время
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Всего игроков</p>
                <h2 className="text-3xl font-bold text-[#1a1f2e] mt-2">24</h2>
                <p className="text-sm text-gray-500 mt-1">Активных пользователей</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Активных игроков</p>
                <h2 className="text-3xl font-bold text-[#1a1f2e] mt-2">18</h2>
                <p className="text-sm text-gray-500 mt-1">В этом месяце</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Средний рейтинг</p>
                <h2 className="text-3xl font-bold text-[#1a1f2e] mt-2">2456</h2>
                <p className="text-sm text-gray-500 mt-1">По всем игрокам</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Турниров за месяц</p>
                <h2 className="text-3xl font-bold text-[#1a1f2e] mt-2">6</h2>
                <p className="text-sm text-gray-500 mt-1">Проведено турниров</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Ранг</th>
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Игрок</th>
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Рейтинг</th>
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Очки игровые</th>
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Вне игровые</th>
                <th className="px-6 py-4 text-left text-gray-500 font-medium">Дисциплина</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.rank} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center">
                    {player.rank === 1 && <Trophy className="w-5 h-5 text-yellow-400 mr-2" />}
                    {player.rank === 2 && <Medal className="w-5 h-5 text-gray-400 mr-2" />}
                    {player.rank === 3 && <Award className="w-5 h-5 text-orange-400 mr-2" />}
                    {player.rank > 3 && <span className="w-5 mr-2 text-gray-500">{player.rank}</span>}
                  </td>
                  <td className="px-6 py-4 text-[#1a1f2e] font-medium">{player.name}</td>
                  <td className="px-6 py-4 text-[#1a1f2e]">{player.rating}</td>
                  <td className="px-6 py-4 text-[#1a1f2e]">{player.gamePoints}</td>
                  <td className="px-6 py-4 text-[#1a1f2e]">{player.nonGamePoints}</td>
                  <td className="px-6 py-4 text-[#1a1f2e]">{player.discipline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;