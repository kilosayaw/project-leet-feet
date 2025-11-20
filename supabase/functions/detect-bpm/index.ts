import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();

    if (!audioUrl) {
      throw new Error('Audio URL is required');
    }

    // SECURITY: Validate URL is from Supabase storage bucket only (SSRF protection)
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL not configured');
    }

    // Validate URL format and protocol
    let parsedUrl;
    try {
      parsedUrl = new URL(audioUrl);
    } catch (e) {
      throw new Error('Invalid URL format');
    }

    // Only allow HTTPS
    if (parsedUrl.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs are allowed');
    }

    // Only allow URLs from our Supabase storage bucket
    if (!audioUrl.startsWith(`${SUPABASE_URL}/storage/v1/object/public/audio-files/`)) {
      throw new Error('Invalid audio URL - must be from storage bucket');
    }

    console.log('Processing audio file:', audioUrl);

    // Fetch the audio file with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let audioResponse;
    try {
      audioResponse = await fetch(audioUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      clearTimeout(timeout);
    } catch (fetchError) {
      clearTimeout(timeout);
      console.error('Fetch error:', fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error';
      throw new Error(`Failed to fetch audio file: ${errorMessage}`);
    }
    
    if (!audioResponse.ok) {
      console.error('Response not OK:', audioResponse.status, audioResponse.statusText);
      throw new Error(`Failed to fetch audio file: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Convert audio to 16-bit PCM for better analysis
    const audioData = new Int16Array(audioBuffer);
    const sampleRate = 44100;
    const duration = audioBuffer.byteLength / (sampleRate * 2 * 2); // 16-bit stereo
    
    // Convert to mono by averaging channels
    const monoData: number[] = [];
    for (let i = 0; i < audioData.length; i += 2) {
      monoData.push((audioData[i] + audioData[i + 1]) / 2);
    }
    
    // Apply high-pass filter to emphasize percussion
    const filtered: number[] = [];
    let prev = 0;
    for (let i = 0; i < monoData.length; i++) {
      const current = monoData[i];
      filtered.push(current - prev * 0.95); // Simple high-pass
      prev = current;
    }
    
    // Calculate onset detection using spectral flux
    const frameSize = 1024;
    const hopSize = 256;
    const onsetStrengths: number[] = [];
    
    for (let frame = 0; frame < filtered.length - frameSize; frame += hopSize) {
      let energy = 0;
      let spectralFlux = 0;
      
      // Calculate frame energy
      for (let i = 0; i < frameSize; i++) {
        const sample = filtered[frame + i];
        energy += sample * sample;
      }
      
      // Calculate spectral flux (change in energy)
      if (frame > 0) {
        const prevEnergy = onsetStrengths[onsetStrengths.length - 1] || 0;
        spectralFlux = Math.max(0, energy - prevEnergy);
      }
      
      onsetStrengths.push(spectralFlux);
    }
    
    // Adaptive threshold for onset detection
    const windowSize = Math.floor(sampleRate / hopSize); // ~1 second window
    const onsets: number[] = [];
    
    for (let i = windowSize; i < onsetStrengths.length - windowSize; i++) {
      const current = onsetStrengths[i];
      
      // Local mean and standard deviation
      let sum = 0;
      let sumSq = 0;
      for (let j = i - windowSize; j <= i + windowSize; j++) {
        sum += onsetStrengths[j];
        sumSq += onsetStrengths[j] * onsetStrengths[j];
      }
      
      const mean = sum / (2 * windowSize + 1);
      const variance = sumSq / (2 * windowSize + 1) - mean * mean;
      const threshold = mean + Math.sqrt(variance) * 1.5;
      
      // Peak detection with adaptive threshold
      if (current > threshold && 
          current > onsetStrengths[i - 1] && 
          current > onsetStrengths[i + 1]) {
        const timeInSeconds = (i * hopSize) / sampleRate;
        onsets.push(timeInSeconds);
      }
    }
    
    // Filter onsets with minimum distance (for hip-hop: ~0.54s between beats at 111 BPM)
    const filteredOnsets: number[] = [];
    const minInterval = 0.25; // 250ms minimum between onsets
    
    for (const onset of onsets) {
      if (filteredOnsets.length === 0 || 
          onset - filteredOnsets[filteredOnsets.length - 1] >= minInterval) {
        filteredOnsets.push(onset);
      }
    }
    
    if (filteredOnsets.length < 8) {
      console.log(`Insufficient onsets detected (${filteredOnsets.length}), using default BPM: 120`);
      return new Response(
        JSON.stringify({ bpm: 120, duration, confidence: 'low' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Calculate inter-onset intervals
    const intervals: number[] = [];
    for (let i = 1; i < filteredOnsets.length; i++) {
      intervals.push(filteredOnsets[i] - filteredOnsets[i - 1]);
    }
    
    // Use clustering to find most common interval
    intervals.sort((a, b) => a - b);
    const clusters: { interval: number; count: number }[] = [];
    
    for (const interval of intervals) {
      let found = false;
      for (const cluster of clusters) {
        if (Math.abs(cluster.interval - interval) < 0.05) { // 50ms tolerance
          cluster.count++;
          cluster.interval = (cluster.interval * (cluster.count - 1) + interval) / cluster.count;
          found = true;
          break;
        }
      }
      if (!found) {
        clusters.push({ interval, count: 1 });
      }
    }
    
    // Find most frequent cluster
    clusters.sort((a, b) => b.count - a.count);
    const dominantInterval = clusters[0].interval;
    
    // Convert to BPM
    let bpm = Math.round(60 / dominantInterval);
    
    // Specific adjustments for common hip-hop patterns
    // Rapper's Delight is around 111 BPM, so if we detect ~222 or ~55, adjust
    if (bpm > 200) {
      bpm = Math.round(bpm / 2);
    } else if (bpm < 70) {
      bpm = Math.round(bpm * 2);
    }
    
    // Final range check and known pattern adjustment
    if (bpm > 180) bpm = Math.round(bpm / 2);
    if (bpm < 60) bpm = Math.round(bpm * 2);
    
    // Clamp to reasonable range
    bpm = Math.min(200, Math.max(60, bpm));

    console.log(`Detected BPM: ${bpm}, Duration: ${duration}s, Onsets: ${filteredOnsets.length}`);

    return new Response(
      JSON.stringify({ 
        bpm, 
        duration,
        confidence: 'estimated' // Indicate this is an estimate
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error detecting BPM:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
