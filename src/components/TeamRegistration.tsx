import { useState } from 'react';
import { TeamMember } from '../types/team';
import { Input } from './ui/input';
import { v4 as uuidv4 } from 'uuid';

interface TeamRegistrationProps {
  onAddMember: (member: TeamMember) => void;
}

export const TeamRegistration = ({ onAddMember }: TeamRegistrationProps) => {
  const [name, setName] = useState('');
  const [jerseyNumber, setJerseyNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && jerseyNumber) {
      onAddMember({
        id: uuidv4(),
        name,
        jerseyNumber: parseInt(jerseyNumber),
        personalFouls: 0,
        score: 0
      });
      setName('');
      setJerseyNumber('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <Input
        placeholder="Player Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="led-display"
      />
      <Input
        type="number"
        placeholder="#"
        value={jerseyNumber}
        onChange={(e) => setJerseyNumber(e.target.value)}
        className="led-display w-20"
        min="0"
        max="99"
      />
      <button type="submit" className="retro-button">Add Player</button>
    </form>
  );
};