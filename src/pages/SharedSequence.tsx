import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BeatState } from '@/types/sequencer';
import { Loader2 } from 'lucide-react';

interface SharedSequenceData {
  id: string;
  sequenceId: string;
  name: string;
  bpm: number;
  beats: BeatState[];
  audioUrl?: string;
  audioFilename?: string;
}

export default function SharedSequence() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [sharedData, setSharedData] = useState<SharedSequenceData | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadSequence();
  }, [token]);

  const checkAuthAndLoadSequence = async () => {
    try {
      // Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Proceed to fetch even if not logged in (public preview via SECURITY DEFINER RPC)

      const { data, error } = await supabase
        .rpc('get_shared_sequence_by_token', { _token: token })
        .single();

      if (error) throw error;

      if (!data) {
        setSharedData(null);
        setLoading(false);
        return;
      }

      const sequenceData: SharedSequenceData = {
        id: data.id,
        sequenceId: data.sequence_id,
        name: data.sequence_name,
        bpm: data.sequence_bpm,
        beats: data.sequence_beats as unknown as BeatState[],
        audioUrl: data.sequence_audio_url,
        audioFilename: data.sequence_audio_filename,
      };

      setSharedData(sequenceData);

      // If user is logged in and email matches, mark as viewed
      if (currentUser && currentUser.email === data.shared_with_email) {
        await supabase
          .from('shared_sequences')
          .update({ viewed: true })
          .eq('id', data.id);
      }
    } catch (error: any) {
      console.error('Error loading shared sequence:', error);
      setSharedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSequence = async () => {
    if (!user) {
      // Redirect to auth with return path
      navigate(`/auth?redirect=/shared/${token}`);
      return;
    }

    if (!sharedData) return;

    try {
      const { error } = await supabase
        .from('sequences')
        .insert([{
          name: `${sharedData.name} (shared)`,
          bpm: sharedData.bpm,
          beats: sharedData.beats as any,
          audio_url: sharedData.audioUrl,
          audio_filename: sharedData.audioFilename,
          user_id: user.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Sequence saved to your account${sharedData.audioFilename ? ' with audio file' : ''}`,
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save sequence",
        variant: "destructive",
      });
    }
  };

  const handleLoadInApp = () => {
    if (!sharedData) return;

    // Navigate to home with the sequence data as state
    navigate('/', { 
      state: { 
        loadSequence: {
          name: sharedData.name,
          bpm: sharedData.bpm,
          beats: sharedData.beats,
          audioUrl: sharedData.audioUrl,
          audioFilename: sharedData.audioFilename,
        }
      } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!sharedData) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-900 border border-red-500/20 rounded-lg p-8">
            <h1 className="text-3xl font-bold text-red-500 mb-4">
              Sequence Not Found
            </h1>
            <p className="text-gray-400 mb-6">
              This shared sequence link is invalid or has expired.
            </p>
            <Button
              onClick={() => navigate('/')}
              className="bg-green-500 hover:bg-green-600 text-black"
            >
              Go to App
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-900 border border-green-500/20 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-green-500 mb-4">
            Shared Sequence
          </h1>
          
          <div className="space-y-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold mb-2">{sharedData.name}</h2>
              <p className="text-gray-400">
                BPM: {sharedData.bpm} • Beats: {sharedData.beats.length}
                {sharedData.audioFilename && (
                  <span className="block mt-1">🎵 Audio: {sharedData.audioFilename}</span>
                )}
              </p>
            </div>

            {!user && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-amber-300">
                  You need to sign in or create an account to save this sequence.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {user ? (
              <>
                <Button
                  onClick={handleSaveSequence}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black"
                >
                  Save to My Sequences
                </Button>
                <Button
                  onClick={handleLoadInApp}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Load in App
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => navigate(`/auth?redirect=/shared/${token}`)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-black"
                >
                  Sign In / Sign Up
                </Button>
                <Button
                  onClick={handleLoadInApp}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                >
                  Load in App
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
