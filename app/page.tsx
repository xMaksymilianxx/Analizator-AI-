'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState('');
  const [apiCalls, setApiCalls] = useState(0);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'all',
    league: ''
  });

  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('date', filters.date);
      if (filters.status === 'live') {
        params.set('live', 'true');
      } else if (filters.status !== 'all') {
        const statusMap: { [key: string]: string } = {
          prematch: 'NS',
          finished: 'FT-AET-PEN'
        };
        if (statusMap[filters.status]) {
          params.set('status', statusMap[filters.status]);
        }
      }

      const response = await fetch(`/api/matches?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setMatches(data.matches);
        setLastUpdate(new Date().toLocaleTimeString('pl-PL'));
        setApiCalls(prev => prev + (data.matches?.length || 0) + 1);
      } else {
        throw new Error(data.error || 'Failed to fetch matches');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const filteredMatches = matches.filter(m => 
    filters.league ? m.league.toLowerCase().includes(filters.league.toLowerCase()) : true
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold">AI Betting Platform</h1>
          <div className="flex items-center gap-4 text-sm">
            <span>API Calls: {apiCalls}/100</span>
            <span>Last Update: {lastUpdate}</span>
            <Link href="/archive" className="hover:text-blue-400">Archiwum</Link>
            <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="date" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} className="bg-gray-700 p-2 rounded w-full text-white" />
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="bg-gray-700 p-2 rounded w-full">
              <option value="all">Wszystkie</option>
              <option value="live">Na Żywo</option>
              <option value="prematch">Przedmeczowe</option>
              <option value="finished">Zakończone</option>
            </select>
            <input type="text" placeholder="Filtruj ligę..." value={filters.league} onChange={e => setFilters({...filters, league: e.target.value})} className="bg-gray-700 p-2 rounded w-full col-span-1 md:col-span-2" />
          </div>
          <button onClick={fetchMatches} disabled={loading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 p-2 rounded disabled:bg-gray-500">
            {loading ? 'Ładowanie...' : 'Odśwież Mecze'}
          </button>
        </div>
        
        {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-2">{match.country} - {match.league}</div>
              <div className="flex justify-between items-center">
                <span className="font-bold">{match.home}</span>
                <span className="font-bold text-xl">{match.score?.home ?? '-'}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold">{match.away}</span>
                <span className="font-bold text-xl">{match.score?.away ?? '-'}</span>
              </div>
              <div className="text-xs text-center text-gray-400">Status: {match.status}</div>
            </div>
          ))}
        </div>
        {!loading && filteredMatches.length === 0 && <div className="text-center text-gray-500 py-10">Brak meczów dla wybranych filtrów.</div>}
      </main>
    </div>
  );
}
