import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Tone.js Audio Library ---
// This script is necessary for the synthesizer to function.
const toneScript = document.createElement('script');
toneScript.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js";
toneScript.async = true;
document.head.appendChild(toneScript);


// Main App component
const App = () => {
  // --- UI State ---
  const [selectedMode, setSelectedMode] = useState('noteTuner');

  // --- Tuner State ---
  const [currentNote, setCurrentNote] = useState('...');
  const [frequencyDifference, setFrequencyDifference] = useState(0);
  const [tunerMessage, setTunerMessage] = useState('Connect your mic to begin!');
  const [isTunerActive, setIsTunerActive] = useState(false);

  // --- AI Voice-to-Chord State ---
  const [voiceToChordMessage, setVoiceToChordMessage] = useState('Connect your mic to begin!');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedMelody, setRecordedMelody] = useState([]);
  const [aiChordSuggestions, setAiChordSuggestions] = useState('Your AI-generated chords will appear here.');
  const [isAiMelodyLoading, setIsAiMelodyLoading] = useState(false);
  
  // --- AI Chord Buddy State ---
  const [inputChords, setInputChords] = useState('');
  const [songPart, setSongPart] = useState('Chorus'); 
  const [aiChordBuddySuggestions, setAiChordBuddySuggestions] = useState('Your AI suggestions will appear here.');
  const [isAiChordLoading, setIsAiChordLoading] = useState(false);

  // --- AI Inspiration State ---
  const [inspirationTheme, setInspirationTheme] = useState('');
  const [aiInspiration, setAiInspiration] = useState('Your AI-generated inspiration will appear here.');
  const [isAiInspirationLoading, setIsAiInspirationLoading] = useState(false);

  // --- AI Song Refiner State ---
  const [lyricInput, setLyricInput] = useState('');
  const [refinerSongPart, setRefinerSongPart] = useState('Verse');
  const [rhymeScheme, setRhymeScheme] = useState('AABB');
  const [aiPersona, setAiPersona] = useState('Classic Hitmaker');
  const [aiCritique, setAiCritique] = useState('');
  const [aiRefinedLyrics, setAiRefinedLyrics] = useState('');
  const [songReadiness, setSongReadiness] = useState({ status: 'Not Analyzed', explanation: 'Submit your lyrics for analysis.'});
  const [isAiRefining, setIsAiRefining] = useState(false);

  // --- Artist Discovery State ---
  const [discoveryGenre, setDiscoveryGenre] = useState('Indie Pop');
  const [discoveryDecade, setDiscoveryDecade] = useState('Modern');
  const [discoveryResults, setDiscoveryResults] = useState('');
  const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);


  // --- Audio Processing Refs & State ---
  const animationFrameId = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const synthRef = useRef(null);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [micPermission, setMicPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const lowPassFilterRef = useRef(null);
  const isInitialMount = useRef(true); 

  // --- Initialize Synthesizer ---
  useEffect(() => {
    const initializeSynth = () => {
        if (window.Tone && !synthRef.current) {
            synthRef.current = new window.Tone.PolySynth(window.Tone.Synth, {
                oscillator: { type: 'fatsawtooth' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
            }).toDestination();
        }
    };
    
    if (window.Tone) {
        initializeSynth();
    } else {
        const script = document.querySelector('script[src*="tone"]');
        if(script) script.addEventListener('load', initializeSynth);
    }
  }, []);

  // Define standard notes and their frequencies
  const notes = [
    { name: 'E2', frequency: 82.4069 }, { name: 'F2', frequency: 87.3071 }, { name: 'F#2/Gb2', frequency: 92.4986 },
    { name: 'G2', frequency: 97.9989 }, { name: 'G#2/Ab2', frequency: 103.826 }, { name: 'A2', frequency: 110.000 },
    { name: 'A#2/Bb2', frequency: 116.541 }, { name: 'B2', frequency: 123.471 }, { name: 'C3', frequency: 130.813 },
    { name: 'C#3/Db3', frequency: 138.591 }, { name: 'D3', frequency: 146.832 }, { name: 'D#3/Eb3', frequency: 155.563 },
    { name: 'E3', frequency: 164.814 }, { name: 'F3', frequency: 174.614 }, { name: 'F#3/Gb3', frequency: 184.997 },
    { name: 'G3', frequency: 195.998 }, { name: 'G#3/Ab3', frequency: 207.652 }, { name: 'A3', frequency: 220.000 },
    { name: 'A#3/Bb3', frequency: 233.082 }, { name: 'B3', frequency: 246.942 }, { name: 'C4', frequency: 261.626 },
    { name: 'C#4/Db4', frequency: 277.183 }, { name: 'D4', frequency: 293.665 }, { name: 'D#4/Eb4', frequency: 311.127 },
    { name: 'E4', frequency: 329.628 }, { name: 'F4', frequency: 349.228 }, { name: 'F#4/Gb4', frequency: 369.994 },
    { name: 'G4', frequency: 391.995 }, { name: 'G#4/Ab4', frequency: 415.305 }, { name: 'A4', frequency: 440.000 },
    { name: 'A#4/Bb4', frequency: 466.164 }, { name: 'B4', frequency: 493.883 }, { name: 'C5', frequency: 523.251 },
    { name: 'C#5/Db5', frequency: 554.365 }, { name: 'D5', frequency: 587.330 }, { name: 'D#5/Eb5', frequency: 622.254 },
    { name: 'E5', frequency: 659.255 }, { name: 'F5', frequency: 698.456 }, { name: 'F#5/Gb5', frequency: 739.989 },
    { name: 'G5', frequency: 783.991 }, { name: 'G#5/Ab5', frequency: 830.609 }, { name: 'A5', frequency: 880.000 },
    { name: 'A#5/Bb5', frequency: 932.328 }, { name: 'B5', frequency: 987.767 }, { name: 'C6', frequency: 1046.502 },
  ].sort((a, b) => a.frequency - b.frequency); 

  const getClosestNoteObject = useCallback((frequency) => {
    let closestNote = null;
    let minDifference = Infinity;
    for (const note of notes) {
      const diff = Math.abs(note.frequency - frequency);
      if (diff < minDifference) {
        minDifference = diff;
        closestNote = note;
      }
    }
    return closestNote;
  }, []);

  const calculatePitchHPS = useCallback((spectrum, sampleRate) => {
      if (!analyserRef.current) return 0;
      const MIN_FREQ = 80;
      const MAX_FREQ = 1320;
      const HPS_COUNT = 5;

      const product = new Float32Array(spectrum.length).fill(0);
      for (let i = 0; i < spectrum.length; i++) {
          product[i] = spectrum[i];
      }

      for (let h = 2; h <= HPS_COUNT; h++) {
          for (let i = 0; i < spectrum.length / h; i++) {
              product[i] += spectrum[i * h];
          }
      }

      let maxVal = -Infinity;
      let maxIndex = -1;

      const minIndex = Math.floor(MIN_FREQ / (sampleRate / analyserRef.current.fftSize));
      const maxIndexSearch = Math.floor(MAX_FREQ / (sampleRate / analyserRef.current.fftSize));

      for (let i = minIndex; i < maxIndexSearch; i++) {
          if (product[i] > maxVal) {
              maxVal = product[i];
              maxIndex = i;
          }
      }

      if (maxIndex === -1 || maxVal < -75) {
          return 0;
      }

      return maxIndex * (sampleRate / analyserRef.current.fftSize);
  }, []);

  const audioProcessLoop = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const freqData = new Float32Array(bufferLength);
    analyserRef.current.getFloatFrequencyData(freqData);

    const sampleRate = audioContextRef.current.sampleRate;
    const pitch = calculatePitchHPS(freqData, sampleRate);

    if (isTunerActive) {
      if (pitch > 0) {
        const closest = getClosestNoteObject(pitch);
        if (closest) {
          setCurrentNote(closest.name);
          setFrequencyDifference(pitch - closest.frequency);
        }
      } else {
        setCurrentNote('...');
      }
    }
    animationFrameId.current = requestAnimationFrame(audioProcessLoop);
  }, [calculatePitchHPS, isTunerActive, getClosestNoteObject]);
  
  const stopAudioProcessing = useCallback(async () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.mediaStream.getTracks().forEach(track => track.stop());
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    if (lowPassFilterRef.current) {
        lowPassFilterRef.current.disconnect();
        lowPassFilterRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    }
    setCurrentNote('...');
    setFrequencyDifference(0);
    if(micPermission === 'granted') {
        setTunerMessage('Tuner stopped. Tap "Start Tuner" to begin!');
    }
    setIsTunerActive(false);
  }, [micPermission]);

  const startAudioProcessing = useCallback(async (mode) => {
    await stopAudioProcessing(); 
    
    try {
      const constraints = { audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096; 
      
      lowPassFilterRef.current = audioContextRef.current.createBiquadFilter();
      lowPassFilterRef.current.type = 'lowpass';
      lowPassFilterRef.current.frequency.setValueAtTime(1500, audioContextRef.current.currentTime); 
      
      microphoneRef.current.connect(lowPassFilterRef.current);
      lowPassFilterRef.current.connect(analyserRef.current);

      if (mode === 'tuner') {
        setTunerMessage('Listening...');
        setIsTunerActive(true);
      }
      
      audioProcessLoop();
    } catch (err) {
      console.error('Error starting audio:', err);
      setMicPermission('denied');
      if (mode === 'tuner') setTunerMessage('Microphone access denied. Please check permissions.');
    }
  }, [selectedDeviceId, stopAudioProcessing, audioProcessLoop]);

  const connectMicrophone = async () => {
      try {
          await navigator.mediaDevices.getUserMedia({ audio: true }); 
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices.filter(device => device.kind === 'audioinput');
          setAudioDevices(audioInputs);
          if (audioInputs.length > 0 && !selectedDeviceId) {
              setSelectedDeviceId(audioInputs[0].deviceId);
          }
           setMicPermission('granted');
           setTunerMessage('Mic connected! Press Start Tuner.');
           return true;
      } catch (err) {
          console.error("Could not enumerate devices:", err);
          setMicPermission('denied');
          setTunerMessage('Microphone access denied. Please check browser permissions.');
          return false;
      }
  };

  useEffect(() => {
    return () => { stopAudioProcessing(); };
  }, [stopAudioProcessing]);
  
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    if (isTunerActive && selectedDeviceId) {
        startAudioProcessing('tuner');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  const indicatorPosition = (frequencyDifference / 5) * 100;
  const getIndicatorClass = () => {
      const diff = Math.abs(frequencyDifference);
      if (diff < 0.2) return 'perfect-tune';
      if (diff < 0.8) return 'bg-green-500';
      return 'bg-red-500';
  }

  const getAiSuggestionsFromAPI = async (prompt, setLoading, setSuggestions) => {
        setLoading(true);
        setSuggestions('Collabor8 is thinking...');

        const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
        const apiKey = ""; 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setSuggestions(text);
            } else {
                setSuggestions('Oops! Collabor8 couldn\'t come up with suggestions. Try again?');
            }
        } catch (error) {
            console.error('Error fetching AI suggestions:', error);
            setSuggestions('Network error or API issue. Check console for details.');
        } finally {
            setLoading(false);
        }
  }

  const getAiChordSuggestions = () => {
    if (!inputChords.trim()) {
      setAiChordBuddySuggestions('Please enter some chords first!');
      return;
    }
    const prompt = `I have a chord progression: "${inputChords}". I need a new chord progression for the ${songPart} of my song that will musically complement it. Give me a few options and a brief, easy-going explanation for why they work.`;
    getAiSuggestionsFromAPI(prompt, setIsAiChordLoading, setAiChordBuddySuggestions);
  };

  const getAiInspiration = () => {
    if (!inspirationTheme.trim()) {
        setAiInspiration('Please provide a theme or mood first.');
        return;
    }
    const prompt = `Act as a creative muse for a songwriter. The user has provided a theme: "${inspirationTheme}". Generate a few creative sparks to inspire a song. Provide three distinct ideas in a list format: 1. A unique song title and a one-sentence concept. 2. A list of 3-5 vivid, sensory images or metaphors related to the theme. 3. A short, two-line story or character sketch to set a scene. Keep the tone cool and imaginative.`;
    getAiSuggestionsFromAPI(prompt, setIsAiInspirationLoading, setAiInspiration);
  }

  const getAiFeedback = async () => {
      if (!lyricInput.trim()) {
          setAiCritique('Please paste your lyrics in the box first.');
          return;
      }
      setIsAiRefining(true);
      setAiCritique('Collabor8 is thinking...');
      setAiRefinedLyrics('');
      setSongReadiness({ status: 'Analyzing...', explanation: '' });

      let personaPrompt = "You are a world-renowned songwriter, a hitmaker from the 50's to now, with experience in country, folk, and pop. You value timeless themes, strong storytelling, and classic song structures.";
      if (aiPersona === 'Modern Hitmaker') {
          personaPrompt = "You are a top-40 music producer and songwriter, known for writing hits for today's younger-gen artists like Olivia Rodrigo and Billie Eilish. You value direct, emotionally resonant lyrics, catchy hooks, and modern, conversational language."
      }

      const prompt = `${personaPrompt} The user has submitted lyrics for a song's ${refinerSongPart}. The intended rhyme scheme is ${rhymeScheme}. Analyze the following lyrics based on your persona's perspective.

      Lyrics to analyze:
      ---
      ${lyricInput}
      ---

      Provide your response as a JSON object with the following structure:
      {
        "critique": "Your constructive feedback on the current version, highlighting strengths and areas for improvement based on the provided song part and rhyme scheme.",
        "refinedLyrics": "Your rewritten, improved version of the lyrics. Make subtle but impactful changes to enhance the song's quality.",
        "isReady": a boolean (true if the song is a potential hit, false if it needs more work),
        "readinessExplanation": "A brief explanation for the 'isReady' status."
      }
      `;
      
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      const apiKey = ""; 
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      try {
          const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          const result = await response.json();

          if (result.candidates && result.candidates.length > 0 &&
              result.candidates[0].content && result.candidates[0].content.parts &&
              result.candidates[0].content.parts.length > 0) {
              
              let text = result.candidates[0].content.parts[0].text;
              text = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsedResponse = JSON.parse(text);
              
              setAiCritique(parsedResponse.critique);
              setAiRefinedLyrics(parsedResponse.refinedLyrics);
              setSongReadiness({
                  status: parsedResponse.isReady ? 'Ready!' : 'Needs Work',
                  explanation: parsedResponse.readinessExplanation
              });
              
          } else {
              setAiCritique('Oops! Collabor8 couldn\'t come up with feedback. Try again?');
              setAiRefinedLyrics('');
              setSongReadiness({ status: 'Error', explanation: 'No response from AI.' });
          }
      } catch (error) {
          console.error('Error fetching AI feedback:', error);
          setAiCritique('Network error or API issue. Check console for details.');
          setAiRefinedLyrics('');
          setSongReadiness({ status: 'Error', explanation: 'Could not connect to the AI.' });
      } finally {
          setIsAiRefining(false);
      }
  }

  const getArtistDiscovery = () => {
    let prompt;
    if(discoveryDecade === 'Modern') {
        prompt = `I'm looking for new, up-and-coming artists in the ${discoveryGenre} genre. Give me a list of 3-5 artists to check out. For each artist, provide a one-sentence description of their sound.`;
    } else {
        prompt = `I'm exploring music from the ${discoveryDecade}. Give me a list of 3-5 influential artists from that decade in the ${discoveryGenre} genre. For each artist, provide a one-sentence description of their sound and why they were important.`;
    }
    getAiSuggestionsFromAPI(prompt, setIsDiscoveryLoading, setDiscoveryResults);
  }

  const handleModeChange = (event) => {
    stopAudioProcessing(); 
    setMicPermission('prompt');
    setAudioDevices([]);
    setSelectedDeviceId('');
    setSelectedMode(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-lime-400 flex flex-col items-center justify-center p-4 font-vt323">
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        .font-press-start { font-family: 'Press Start 2P', cursive; }
        .font-vt323 { font-family: 'VT323', monospace; }

        .pixel-border {
          border: 2px solid lime;
          box-shadow: 0 0 5px lime, inset 0 0 5px lime;
        }

        .pixel-button {
          background-color: #00ff00; /* Neon Green */
          color: #000;
          border: 2px solid #00ff00;
          box-shadow: 3px 3px 0 #00aa00, 5px 5px 0 #005500;
          transition: all 0.1s ease-in-out;
        }
        .pixel-button:hover {
          background-color: #00ee00;
          box-shadow: 1px 1px 0 #00aa00, 2px 2px 0 #005500;
          transform: translate(2px, 2px);
        }
        .pixel-button:active {
          background-color: #00dd00;
          box-shadow: 0 0 0 #00aa00, 0 0 0 #005500;
          transform: translate(5px, 5px);
        }
        .pixel-button:disabled {
          background-color: #555;
          color: #999;
          box-shadow: 3px 3px 0 #333, 5px 5px 0 #111;
          cursor: not-allowed;
        }

        .pixel-input, .pixel-select, .pixel-textarea {
          background-color: #1a1a1a;
          border: 1px solid lime;
          box-shadow: inset 0 0 3px lime;
          color: lime;
          padding: 8px;
          font-size: 1rem;
          appearance: none; /* Remove default dropdown arrow */
        }
        
        .pixel-select {
            background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2300FF00%22%20d%3D%22M287%2C197.3L159.2%2C69.5c-3.1-3.1-8.2-3.1-11.3%2C0l-127.8%2C127.8c-3.1%2C3.1-3.1%2C8.2%2C0%2C11.3s8.2%2C3.1%2C11.3%2C0l122.2-122.2l122.2%2C122.2c3.1%2C3.1%2C8.2%2C3.1%2C11.3%2C0S290.1%2C200.4%2C287%2C197.3z%22%2F%3E%3C%2Fsvg%3E');
            background-repeat: no-repeat;
            background-position: right 0.7em top 50%, 0 0;
            background-size: 0.65em auto, 100%;
        }

        .pixel-box {
          background-color: #1a1a1a;
          border: 2px solid lime;
          box-shadow: 0 0 10px rgba(0,255,0,0.5), inset 0 0 5px rgba(0,255,0,0.3);
        }
        
        @keyframes pulse-green {
            0% { background-color: #39FF14; box-shadow: 0 0 5px #39FF14; }
            50% { background-color: #90EE90; box-shadow: 0 0 20px #39FF14; }
            100% { background-color: #39FF14; box-shadow: 0 0 5px #39FF14; }
        }
        
        .perfect-tune {
            animation: pulse-green 1s infinite;
        }
        `}
      </style>

      <div className="pixel-box p-8 rounded-none w-full max-w-2xl text-center mb-8">
        <h1 className="text-5xl font-press-start mb-2 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.7)]">
          Collabor8
        </h1>
        <p className="text-lg text-yellow-300 font-vt323 mb-8">An EnigmaticDeuce Project</p>

        {/* --- Mode Selection Dropdown --- */}
        <div className="mb-8">
          <label htmlFor="mode-select" className="block text-xl font-press-start mb-4 text-yellow-300">
            Select Mode:
          </label>
          <select
            id="mode-select"
            className="w-full max-w-xs p-2 pixel-select font-vt323"
            value={selectedMode}
            onChange={handleModeChange}
          >
            <option value="noteTuner">Guitar Tuner</option>
            <option value="aiChordBuddy">✨ AI Chord Buddy</option>
            <option value="aiInspiration">✨ AI Inspiration</option>
            <option value="aiRefiner">✨ Collabor8's Feedback</option>
            <option value="artistDiscovery">✨ Artist Discovery</option>
          </select>
        </div>

        {/* --- Microphone Selection --- */}
        { selectedMode === 'noteTuner' && micPermission === 'granted' && (
            <div className="my-4">
                <label htmlFor="mic-select" className="block text-lg mb-2 text-yellow-300">Select Mic:</label>
                <select id="mic-select" value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="pixel-select">
                    {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>{device.label || `Mic ${device.deviceId.substring(0, 6)}`}</option>
                    ))}
                </select>
            </div>
        )}

        {/* --- Conditional Rendering based on selectedMode --- */}
        {selectedMode === 'noteTuner' && (
          <div className="mb-10 p-6 pixel-box">
            <h2 className="text-3xl font-press-start mb-4 text-pink-400 drop-shadow-[0_0_6px_rgba(255,0,255,0.7)]">
              Guitar Tuner
            </h2>
            <p className="text-lg text-gray-300 mb-2">{tunerMessage}</p>
            <p className="text-7xl font-bold mb-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,255,0,0.7)]">
              {currentNote}
            </p>
            
            {isTunerActive && (
              <div className="w-full bg-gray-700 rounded-full h-4 mt-6 mb-8 relative overflow-hidden pixel-border">
                <div
                  className={`absolute top-0 h-full w-2 rounded-full transform -translate-x-1/2 transition-all duration-100 ${getIndicatorClass()}`}
                  style={{ left: `calc(50% + ${indicatorPosition}%)` }}
                ></div>
                <div className="absolute top-0 left-1/2 h-full w-0.5 bg-white transform -translate-x-1/2"></div>
              </div>
            )}

            <div className="flex justify-center space-x-4 mt-6">
              {micPermission === 'granted' ? (
                !isTunerActive ? (
                  <button onClick={() => startAudioProcessing('tuner')} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">Start Tuner</button>
                ) : (
                  <button onClick={stopAudioProcessing} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button" style={{ backgroundColor: '#ff0000', boxShadow: '3px 3px 0 #aa0000, 5px 5px 0 #550000' }}>Stop Tuner</button>
                )
              ) : (
                 <button onClick={connectMicrophone} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">Connect Microphone</button>
              )}
            </div>
            {micPermission === 'denied' && <button onClick={() => connectMicrophone()} className="mt-4 text-blue-400 underline">Retry Mic Connection</button>}
          </div>
        )}

        {selectedMode === 'aiChordBuddy' && (
          <div className="p-6 pixel-box">
            <h2 className="text-3xl font-press-start mb-4 text-yellow-400 drop-shadow-[0_0_6px_rgba(255,255,0,0.7)]">
              AI Chord Buddy
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Enter your chord progression and choose a song part. Collabor8 will suggest a new progression that fits!
            </p>
            <textarea
              className="w-full h-24 p-3 mb-4 pixel-textarea resize-none"
              placeholder="Enter your chords here (e.g., C G Am F)"
              value={inputChords}
              onChange={(e) => setInputChords(e.target.value)}
            ></textarea>
            <div className="flex items-center justify-center space-x-4 mb-4">
                <label htmlFor="song-part-select" className="text-lg">I need chords for a:</label>
                <select 
                    id="song-part-select"
                    className="p-2 pixel-select"
                    value={songPart}
                    onChange={(e) => setSongPart(e.target.value)}
                >
                    <option>Verse</option>
                    <option>Chorus</option>
                    <option>Bridge</option>
                </select>
            </div>
            <button
              onClick={getAiChordSuggestions}
              disabled={isAiChordLoading}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiChordLoading ? 'Collabor8 is thinking...' : '✨ Get Suggestions'}
            </button>
            <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
              <h3 className="text-xl font-press-start mb-2 text-cyan-300">Collabor8's Suggestions:</h3>
              <ClickableChordSuggestion text={isAiChordLoading ? "Collabor8 is thinking..." : aiChordBuddySuggestions} synthRef={synthRef} />
            </div>
          </div>
        )}

        {selectedMode === 'aiInspiration' && (
          <div className="p-6 pixel-box">
            <h2 className="text-3xl font-press-start mb-4 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.7)]">
              AI Inspiration
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Give Collabor8 a theme, a mood, or a starting line to get some creative sparks!
            </p>
            <textarea
              className="w-full h-24 p-3 mb-4 pixel-textarea resize-none"
              placeholder="e.g., 'Rainy night in the city' or 'Feeling lost but hopeful'"
              value={inspirationTheme}
              onChange={(e) => setInspirationTheme(e.target.value)}
            ></textarea>
            <button
              onClick={getAiInspiration}
              disabled={isAiInspirationLoading}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiInspirationLoading ? 'Collabor8 is thinking...' : '✨ Get Inspiration'}
            </button>
            <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
              <h3 className="text-xl font-press-start mb-2 text-cyan-300">Collabor8's Ideas:</h3>
              <p className="text-lg text-gray-200">{aiInspiration}</p>
            </div>
          </div>
        )}

        {selectedMode === 'aiRefiner' && (
          <div className="p-6 pixel-box">
            <h2 className="text-3xl font-press-start mb-4 text-purple-400 drop-shadow-[0_0_6px_rgba(192,132,252,0.7)]">
              Collabor8's Feedback
            </h2>
            <p className="text-lg text-gray-300 mb-4">
              Let's Collabor8.
            </p>
            <textarea
              className="w-full h-48 p-3 mb-4 pixel-textarea resize-none"
              placeholder="Paste your full song lyrics here..."
              value={lyricInput}
              onChange={(e) => setLyricInput(e.target.value)}
            ></textarea>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                 <select 
                    className="p-2 pixel-select"
                    value={refinerSongPart}
                    onChange={(e) => setRefinerSongPart(e.target.value)}
                >
                    <option>Verse</option>
                    <option>Chorus</option>
                    <option>Bridge</option>
                    <option>Full Song</option>
                </select>
                 <select 
                    className="p-2 pixel-select"
                    value={rhymeScheme}
                    onChange={(e) => setRhymeScheme(e.target.value)}
                >
                    <option>AABB (Couplet)</option>
                    <option>ABAB (Alternate)</option>
                    <option>ABCB (Simple 4-line)</option>
                    <option>AAAA (Monorhyme)</option>
                    <option>AABA (Limerick)</option>
                    <option>Free Verse</option>
                </select>
            </div>
             <div className="flex items-center justify-center space-x-4 mb-4">
                <label htmlFor="persona-select" className="text-lg">Feedback from a:</label>
                <select 
                    id="persona-select"
                    className="p-2 pixel-select"
                    value={aiPersona}
                    onChange={(e) => setAiPersona(e.target.value)}
                >
                    <option>Classic Hitmaker</option>
                    <option>Modern Hitmaker</option>
                </select>
            </div>
            <button
              onClick={getAiFeedback}
              disabled={isAiRefining}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiRefining ? 'Collabor8 is thinking...' : '✨ Refine My Song'}
            </button>
            <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
              <h3 className="text-xl font-press-start mb-2 text-cyan-300">Collabor8's Critique:</h3>
              <p className="text-lg text-gray-200">{aiCritique}</p>
            </div>
             <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
              <h3 className="text-xl font-press-start mb-2 text-yellow-300">Song Readiness: <span className={songReadiness.status === 'Ready!' ? 'text-green-400' : 'text-red-400'}>{songReadiness.status}</span></h3>
              <p className="text-lg text-gray-200">{songReadiness.explanation}</p>
            </div>
             <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
              <h3 className="text-xl font-press-start mb-2 text-pink-300">Refined Lyrics:</h3>
              <p className="text-lg text-gray-200">{aiRefinedLyrics}</p>
            </div>
          </div>
        )}
        
        {selectedMode === 'artistDiscovery' && (
            <div className="p-6 pixel-box">
                <h2 className="text-3xl font-press-start mb-4 text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.7)]">
                Artist Discovery
                </h2>
                <div className="mb-8">
                    <h3 className="text-xl font-press-start mb-2 text-yellow-300">Find Artists</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <select value={discoveryGenre} onChange={e => setDiscoveryGenre(e.target.value)} className="pixel-select w-full">
                            <option>Indie Pop</option>
                            <option>Bedroom Pop</option>
                            <option>Lo-fi Hip Hop</option>
                            <option>Synthwave</option>
                            <option>Modern Folk</option>
                            <option>Country</option>
                        </select>
                        <select value={discoveryDecade} onChange={e => setDiscoveryDecade(e.target.value)} className="pixel-select w-full">
                            <option>Modern</option>
                            <option>2010s</option>
                            <option>2000s</option>
                            <option>1990s</option>
                            <option>1980s</option>
                            <option>1970s</option>
                            <option>1960s</option>
                            <option>1950s</option>
                        </select>
                    </div>
                    <button onClick={getArtistDiscovery} disabled={isDiscoveryLoading} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">
                        {isDiscoveryLoading ? 'Searching...' : '✨ Find Artists'}
                    </button>
                </div>
                <div className="mt-6 p-4 pixel-box text-left whitespace-pre-wrap">
                    <h3 className="text-xl font-press-start mb-2 text-cyan-300">Discoveries:</h3>
                    <p className="text-lg text-gray-200">{discoveryResults}</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Component for Clickable Chords ---
const ClickableChordSuggestion = ({ text, synthRef }) => {
    const chordRegex = /\b([A-G][b#]?(m|maj|min|dim|aug|sus|add)?[2-9]?)\b/g;
    const parts = text.split(chordRegex);

    const getChordNotes = (chordName) => {
        const root = chordName.match(/^[A-G][b#]?/)[0];
        const quality = chordName.replace(root, '');
        const octave = 4;
        
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        const rootIndex = noteMap[root];
        if (rootIndex === undefined) return null;

        let intervals;
        if (quality.startsWith('m') && !quality.startsWith('maj')) { // minor
            intervals = [0, 3, 7];
        } else if (quality.includes('7')) { // dominant 7th
             intervals = [0, 4, 7, 10];
        } else { // major
            intervals = [0, 4, 7];
        }

        return intervals.map(i => notes[(rootIndex + i) % 12] + octave);
    };

    const playChord = async (chord) => {
        if (!synthRef.current) return;
        if (window.Tone.context.state !== 'running') {
            await window.Tone.start();
        }
        const notes = getChordNotes(chord);
        if (notes) {
            synthRef.current.triggerAttackRelease(notes, "1s");
        }
    };

    return (
        <p className="text-lg text-gray-200">
            {parts.map((part, index) => {
                if (index % 3 === 1) { // It's a chord
                    return (
                        <button key={index} onClick={() => playChord(part)} className="bg-lime-800 text-lime-300 px-2 py-1 rounded-md mx-1 hover:bg-lime-700 transition-colors">
                            {part}
                        </button>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </p>
    );
};


export default App;
