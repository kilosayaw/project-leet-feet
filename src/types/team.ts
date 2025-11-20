export interface TeamMember {
  id: string;
  name: string;
  jerseyNumber: number;
  personalFouls: number;
  score: number;
}

export interface Team {
  name: string;
  score: number;
  members: TeamMember[];
  totalFouls: number;
}