export interface Player {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
}

export interface Team {
  id: number;
  name: string;
  players: {
    1: string; // Tier 1 Player Name
    2: string; // Tier 2 Player Name
    3: string; // Tier 3 Player Name
  };
}

export interface DrawHistory {
  id: string;
  userId: string;
  createdAt: string; // ISO String
  method: 'auto' | 'step';
  teams: {
    id: number;
    name: string;
    tier1: string;
    tier2: string;
    tier3: string;
  }[];
  title?: string;
}

export interface CustomParticipants {
  userId: string;
  updatedAt: string;
  tier1: string[];
  tier2: string[];
  tier3: string[];
}
