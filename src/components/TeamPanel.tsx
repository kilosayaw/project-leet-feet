import { ScoreDisplay } from './ScoreDisplay';
import { TeamMember } from '../types/team';
import { TeamMemberList } from './TeamMemberList';
import { TeamRegistration } from './TeamRegistration';
import { useToast } from '../hooks/use-toast';
import { useState } from 'react';

interface TeamPanelProps {
  name: string;
  score: number;
  onScoreChange: (points: number) => void;
  members: TeamMember[];
  totalFouls: number;
  onAddMember: (member: TeamMember) => void;
  onMemberFoul: (memberId: string) => void;
  onMemberScore: (memberId: string, points: number) => void;
  onTeamFoulChange: (change: number) => void;
  onNameChange?: (name: string) => void;
}

export const TeamPanel = ({ 
  name, 
  score, 
  onScoreChange,
  members,
  totalFouls,
  onAddMember,
  onMemberFoul,
  onMemberScore,
  onTeamFoulChange,
  onNameChange
}: TeamPanelProps) => {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(name);
  
  const activePlayers = members.filter(m => m.personalFouls < 5).length;
  const fouledOutPlayers = members.length - activePlayers;

  const handleTeamFoulChange = (change: number) => {
    const newFouls = totalFouls + change;
    if (newFouls >= 0) {
      onTeamFoulChange(change);
      if (newFouls === 5) {
        toast({
          title: "Bonus Situation!",
          description: `${name} team has reached 5 team fouls`,
          variant: "destructive"
        });
      }
    }
  };

  const handleNameSubmit = () => {
    if (tempName.trim() && onNameChange) {
      onNameChange(tempName.trim());
    }
    setIsEditingName(false);
  };

  return (
    <div className="retro-panel p-6 rounded-xl flex flex-col items-center gap-4 bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
      {isEditingName ? (
        <div className="flex gap-2 w-full">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
            className="bg-transparent text-center text-2xl font-bold led-display w-full text-green-500 glow border border-retro-orange/30 rounded px-2"
            autoFocus
          />
        </div>
      ) : (
        <div
          onClick={() => setIsEditingName(true)}
          className="cursor-pointer hover:opacity-80 transition-opacity w-full"
        >
          <input
            type="text"
            value={name}
            readOnly
            className="bg-transparent text-center text-2xl font-bold led-display w-full text-green-500 glow cursor-pointer"
            placeholder="Click to edit team name"
          />
        </div>
      )}
      <ScoreDisplay score={score} />
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="text-center">
          <div className="text-sm text-gray-400">Team Fouls</div>
          <div className={`led-display text-2xl ${totalFouls >= 5 ? 'text-red-500 animate-pulse glow-red' : 'text-yellow-500'}`}>
            {totalFouls}
          </div>
          <div className="flex gap-2 mt-2 justify-center">
            <button 
              onClick={() => handleTeamFoulChange(-1)} 
              className="retro-button text-xs px-2 py-1 bg-red-900/80 hover:bg-red-800"
              disabled={totalFouls <= 0}
            >
              -1
            </button>
            <button 
              onClick={() => handleTeamFoulChange(1)} 
              className="retro-button text-xs px-2 py-1 bg-red-900/80 hover:bg-red-800"
            >
              +1
            </button>
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-400">Players Status</div>
          <div className="led-display text-sm">
            <span className="text-green-500 glow">{activePlayers} Active</span>
            {fouledOutPlayers > 0 && (
              <span className="text-red-500 ml-2 glow-red">{fouledOutPlayers} Out</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onScoreChange(1)} className="retro-button text-sm px-3 py-1 bg-green-900/80 hover:bg-green-800">
          +1
        </button>
        <button onClick={() => onScoreChange(2)} className="retro-button text-sm px-3 py-1 bg-green-900/80 hover:bg-green-800">
          +2
        </button>
        <button onClick={() => onScoreChange(3)} className="retro-button text-sm px-3 py-1 bg-green-900/80 hover:bg-green-800">
          +3
        </button>
      </div>
      <TeamRegistration onAddMember={onAddMember} />
      <TeamMemberList 
        members={members}
        onFoulChange={onMemberFoul}
        onScoreChange={onMemberScore}
      />
    </div>
  );
};