import { TeamMember } from '../types/team';

interface TeamMemberListProps {
  members: TeamMember[];
  onFoulChange: (memberId: string) => void;
  onScoreChange: (memberId: string, points: number) => void;
}

export const TeamMemberList = ({ members, onFoulChange, onScoreChange }: TeamMemberListProps) => {
  return (
    <div className="space-y-2 mt-4">
      {members.map((member) => {
        const isFouledOut = member.personalFouls >= 5;
        const statusClass = isFouledOut ? 'bg-red-500/20' : 'bg-green-500/20';
        
        return (
          <div 
            key={member.id} 
            className={`retro-panel p-3 flex items-center justify-between ${statusClass} transition-colors duration-300`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full ${isFouledOut ? 'bg-red-500' : 'bg-green-500'} flex items-center justify-center text-white`}>
                {member.jerseyNumber}
              </div>
              <span className="led-display">{member.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400">Fouls</div>
                <div className={`led-display text-xl ${isFouledOut ? 'text-red-500 animate-pulse' : ''}`}>
                  {member.personalFouls}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400">Points</div>
                <div className="led-display text-xl">{member.score}</div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onFoulChange(member.id)}
                  className={`retro-button px-2 py-1 ${isFouledOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isFouledOut}
                >
                  +F
                </button>
                <button 
                  onClick={() => onScoreChange(member.id, 1)}
                  className="retro-button px-2 py-1"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};