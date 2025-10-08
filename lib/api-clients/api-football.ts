import axios from 'axios';

class ApiFootballClient {
  private apiKey: string;
  private baseUrl: string = 'https://v3.football.api-sports.io';

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
    if (!this.apiKey) {
      console.warn('API_FOOTBALL_KEY is not set. API-Football client will not work.');
    }
  }

  private getHeaders() {
    return {
      'x-rapidapi-key': this.apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io',
    };
  }

  async fetchMatches(params: { date: string; status?: string; live?: boolean }) {
    let url = `${this.baseUrl}/fixtures?date=${params.date}&timezone=Europe/Warsaw`;
    if (params.status) {
      url += `&status=${params.status}`;
    }
    if (params.live) {
      url = `${this.baseUrl}/fixtures?live=all&timezone=Europe/Warsaw`;
    }

    const response = await axios.get(url, { headers: this.getHeaders() });
    return this.transformMatches(response.data.response);
  }

  async fetchOdds(fixtureId: string) {
    const url = `${this.baseUrl}/odds?fixture=${fixtureId}`;
    const response = await axios.get(url, { headers: this.getHeaders() });
    return this.transformOdds(response.data.response);
  }
  
  private transformMatches(data: any[]): any[] {
    if (!data) return [];
    return data.map(item => ({
      id: item.fixture.id.toString(),
      home: item.teams.home.name,
      away: item.teams.away.name,
      league: item.league.name,
      country: item.league.country,
      time: item.fixture.date,
      status: item.fixture.status.short,
      score: { home: item.goals.home, away: item.goals.away },
    }));
  }

  private transformOdds(data: any[]): any {
    if (!data || data.length === 0) return {};
    const oddsData = data[0].bookmakers.find((b: any) => b.name === 'Bet365') || data[0].bookmakers[0];
    if (!oddsData) return {};
    const odds: any = {};
    oddsData.bets.forEach((bet: any) => {
      if (bet.name === 'Match Winner') {
        odds['1X2'] = {
          '1': bet.values.find((v: any) => v.value === 'Home')?.odd,
          'X': bet.values.find((v: any) => v.value === 'Draw')?.odd,
          '2': bet.values.find((v: any) => v.value === 'Away')?.odd,
        };
      }
      if (bet.name === 'Goals Over/Under') {
        odds['Over/Under'] = {};
        bet.values.forEach((v: any) => { odds['Over/Under'][v.value] = v.odd; });
      }
      if (bet.name === 'Both Teams To Score') {
        odds['BTTS'] = {
          'Yes': bet.values.find((v: any) => v.value === 'Yes')?.odd,
          'No': bet.values.find((v: any) => v.value === 'No')?.odd,
        };
      }
    });
    return odds;
  }
}

export const apiFootballClient = new ApiFootballClient();
