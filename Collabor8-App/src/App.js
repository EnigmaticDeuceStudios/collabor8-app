import React, { useState, useEffect, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import Tone from 'tone/build/Tone.js';
import './index.css';
import {
  getChordSuggestions,
  getInspiration,
  getLyricFeedback,
  getArtistDiscovery,
} from './mockAI';

// --- Helper Component for Clickable Chords ---
const ClickableChordSuggestion = ({ text, synthRef }) => {
    const chordRegex = /\b([A-G][b#]?(m|maj|min|dim|aug|sus|add)?[2-9]?)\b/g;
    const parts = text ? text.split(chordRegex) : [];

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
        if (quality.startsWith('m') && !quality.startsWith('maj')) {
            intervals = [0, 3, 7];
        } else if (quality.includes('7')) {
             intervals = [0, 4, 7, 10];
        } else {
            intervals = [0, 4, 7];
        }

        return intervals.map(i => notes[(rootIndex + i) % 12] + octave);
    };

    const playChord = async (chord) => {
        if (!synthRef.current) return;
        if (window.Tone && window.Tone.context.state !== 'running') {
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
                if (index % 3 === 1 && part) {
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

const GuitarTuner = () => {
    const [currentNote, setCurrentNote] = useState('...');
    const [frequencyDifference, setFrequencyDifference] = useState(0);
    const [tunerMessage, setTunerMessage] = useState('Connect your mic to begin!');
    const [isTunerActive, setIsTunerActive] = useState(false);
    const [audioDevices, setAudioDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [micPermission, setMicPermission] = useState('prompt');

    const animationFrameId = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const lowPassFilterRef = useRef(null);
    const isInitialMount = useRef(true);

    const notesRef = useRef([
        { name: 'E2', frequency: 82.41 }, { name: 'F2', frequency: 87.31 }, { name: 'F#2', frequency: 92.50 },
        { name: 'G2', frequency: 98.00 }, { name: 'G#2', frequency: 103.83 }, { name: 'A2', frequency: 110.00 },
        { name: 'A#2', frequency: 116.54 }, { name: 'B2', frequency: 123.47 }, { name: 'C3', frequency: 130.81 },
        { name: 'C#3', frequency: 138.59 }, { name: 'D3', frequency: 146.83 }, { name: 'D#3', frequency: 155.56 },
        { name: 'E3', frequency: 164.81 }, { name: 'F3', frequency: 174.61 }, { name: 'F#3', frequency: 185.00 },
        { name: 'G3', frequency: 196.00 }, { name: 'G#3', frequency: 207.65 }, { name: 'A3', frequency: 220.00 },
        { name: 'A#3', frequency: 233.08 }, { name: 'B3', frequency: 246.94 }, { name: 'C4', frequency: 261.63 },
        { name: 'C#4', frequency: 277.18 }, { name: 'D4', frequency: 293.66 }, { name: 'D#4', frequency: 311.13 },
        { name: 'E4', frequency: 329.63 }, { name: 'F4', frequency: 349.23 }, { name: 'F#4', frequency: 369.99 },
        { name: 'G4', frequency: 392.00 }, { name: 'G#4', frequency: 415.30 }, { name: 'A4', frequency: 440.00 },
        { name: 'A#4', frequency: 466.16 }, { name: 'B4', frequency: 493.88 }, { name: 'C5', frequency: 523.25 },
    ].sort((a, b) => a.frequency - b.frequency));

    const getClosestNote = useCallback((frequency) => {
        return notesRef.current.reduce((prev, curr) =>
            (Math.abs(curr.frequency - frequency) < Math.abs(prev.frequency - frequency) ? curr : prev)
        );
    }, []);

    const calculatePitch = useCallback((spectrum, sampleRate) => {
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

        if (maxIndex === -1 || maxVal < -75) return 0;
        return maxIndex * (sampleRate / analyserRef.current.fftSize);
    }, []);

    const audioProcessLoop = useCallback(() => {
        if (!analyserRef.current || !audioContextRef.current) return;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const freqData = new Float32Array(bufferLength);
        analyserRef.current.getFloatFrequencyData(freqData);
        const pitch = calculatePitch(freqData, audioContextRef.current.sampleRate);

        if (pitch > 0) {
            const note = getClosestNote(pitch);
            if (note) {
                setCurrentNote(note.name);
                setFrequencyDifference(pitch - note.frequency);
            }
        } else {
            setCurrentNote('...');
        }
        animationFrameId.current = requestAnimationFrame(audioProcessLoop);
    }, [calculatePitch, getClosestNote]);

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
        setIsTunerActive(false);
        if (micPermission === 'granted') {
            setTunerMessage('Tuner stopped. Tap "Start Tuner" to begin!');
        }
    }, [micPermission]);

    const startAudioProcessing = useCallback(async () => {
        if (isTunerActive) return;
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
            setTunerMessage('Listening...');
            setIsTunerActive(true);
            audioProcessLoop();
        } catch (err) {
            console.error('Error starting audio:', err);
            setMicPermission('denied');
            setTunerMessage('Microphone access denied. Please check permissions.');
        }
    }, [selectedDeviceId, stopAudioProcessing, audioProcessLoop, isTunerActive]);

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
        } catch (err) {
            console.error("Could not get microphone permission:", err);
            setMicPermission('denied');
            setTunerMessage('Microphone access denied. Please check browser permissions.');
        }
    };

    useEffect(() => {
        return () => {
            stopAudioProcessing();
        };
    }, [stopAudioProcessing]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (isTunerActive && selectedDeviceId) {
            startAudioProcessing();
        }
    }, [selectedDeviceId, isTunerActive, startAudioProcessing]);

    const indicatorPosition = (frequencyDifference / 5) * 100;
    const getIndicatorClass = () => {
        const diff = Math.abs(frequencyDifference);
        if (diff < 0.2) return 'perfect-tune';
        if (diff < 0.8) return 'bg-green-500';
        return 'bg-red-500';
    };

    return (
        <div className="mb-10 p-6 pixel-box">
            <h2 className="text-3xl font-press-start mb-4 text-pink-400 drop-shadow-[0_0_6px_rgba(255,0,255,0.7)]">
                Guitar Tuner
            </h2>
            <p className="text-lg text-gray-300 mb-2">{tunerMessage}</p>
            {micPermission === 'granted' && (
                <div className="my-4">
                    <label htmlFor="mic-select" className="block text-lg mb-2 text-yellow-300">Select Mic:</label>
                    <select id="mic-select" value={selectedDeviceId} onChange={(e) => setSelectedDeviceId(e.target.value)} className="pixel-select">
                        {audioDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>{device.label || `Mic ${device.deviceId.substring(0, 6)}`}</option>
                        ))}
                    </select>
                </div>
            )}
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
                        <button onClick={() => startAudioProcessing()} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">Start Tuner</button>
                    ) : (
                        <button onClick={stopAudioProcessing} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button" style={{ backgroundColor: '#ff0000', boxShadow: '3px 3px 0 #aa0000, 5px 5px 0 #550000' }}>Stop Tuner</button>
                    )
                ) : (
                    <button onClick={connectMicrophone} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">Connect Microphone</button>
                )}
            </div>
            {micPermission === 'denied' && <button onClick={() => connectMicrophone()} className="mt-4 text-blue-400 underline">Retry Mic Connection</button>}
        </div>
    );
};

// Main App component
const App = () => {
  // --- UI State ---
  const [selectedMode, setSelectedMode] = useState('noteTuner');

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

  const synthRef = useRef(null);

  // --- Initialize Synthesizer ---
  useEffect(() => {
    if (window.Tone) {
      synthRef.current = new window.Tone.PolySynth(window.Tone.Synth, {
          oscillator: { type: 'fatsawtooth' },
          envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 1 }
      }).toDestination();
    }
  }, []);

  const getAiChordSuggestionsHandler = async () => {
    if (!inputChords.trim()) {
      setAiChordBuddySuggestions('Please enter some chords first!');
      return;
    }
    setIsAiChordLoading(true);
    setAiChordBuddySuggestions('Collabor8 is thinking...');
    try {
      const result = await getChordSuggestions(inputChords, songPart);
      setAiChordBuddySuggestions(result);
    } catch (error) {
      setAiChordBuddySuggestions('Something went wrong. Try again?');
    } finally {
      setIsAiChordLoading(false);
    }
  };

  const getAiInspirationHandler = async () => {
    if (!inspirationTheme.trim()) {
        setAiInspiration('Please provide a theme or mood first.');
        return;
    }
    setIsAiInspirationLoading(true);
    setAiInspiration('Collabor8 is thinking...');
    try {
      const result = await getInspiration(inspirationTheme);
      setAiInspiration(result);
    } catch (error) {
      setAiInspiration('Something went wrong. Try again?');
    } finally {
      setIsAiInspirationLoading(false);
    }
  };

  const getAiFeedbackHandler = async () => {
      if (!lyricInput.trim()) {
          setAiCritique('Please paste your lyrics in the box first.');
          return;
      }
      setIsAiRefining(true);
      setAiCritique('Collabor8 is thinking...');
      setAiRefinedLyrics('');
      setSongReadiness({ status: 'Analyzing...', explanation: '' });

      try {
        const result = await getLyricFeedback(lyricInput, refinerSongPart, rhymeScheme, aiPersona);
        setAiCritique(result.critique);
        setAiRefinedLyrics(result.refinedLyrics);
        setSongReadiness({
            status: result.isReady ? 'Ready!' : 'Needs Work',
            explanation: result.readinessExplanation
        });
      } catch (error) {
        setAiCritique('Something went wrong. Try again?');
        setAiRefinedLyrics('');
        setSongReadiness({ status: 'Error', explanation: 'Could not process feedback.' });
      } finally {
        setIsAiRefining(false);
      }
  };

  const getArtistDiscoveryHandler = async () => {
    setIsDiscoveryLoading(true);
    setDiscoveryResults('Searching...');
    try {
      const result = await getArtistDiscovery(discoveryGenre, discoveryDecade);
      setDiscoveryResults(result);
    } catch (error) {
      setDiscoveryResults('Something went wrong. Try again?');
    } finally {
      setIsDiscoveryLoading(false);
    }
  };

  const handleModeChange = (event) => {
    setSelectedMode(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-lime-400 flex flex-col items-center justify-center p-4 font-vt323">
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
            <option value="aiChordBuddy">AI Chord Buddy</option>
            <option value="aiInspiration">AI Inspiration</option>
            <option value="aiRefiner">Collabor8's Feedback</option>
            <option value="artistDiscovery">Artist Discovery</option>
          </select>
        </div>

        {/* --- Conditional Rendering based on selectedMode --- */}
        {selectedMode === 'noteTuner' && (
          <GuitarTuner />
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
              onClick={getAiChordSuggestionsHandler}
              disabled={isAiChordLoading}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiChordLoading ? 'Collabor8 is thinking...' : 'Get Suggestions'}
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
              onClick={getAiInspirationHandler}
              disabled={isAiInspirationLoading}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiInspirationLoading ? 'Collabor8 is thinking...' : 'Get Inspiration'}
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
              onClick={getAiFeedbackHandler}
              disabled={isAiRefining}
              className="px-6 py-3 font-press-start text-sm rounded-none pixel-button"
            >
              {isAiRefining ? 'Collabor8 is thinking...' : 'Refine My Song'}
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
                    <button onClick={getArtistDiscoveryHandler} disabled={isDiscoveryLoading} className="px-6 py-3 font-press-start text-sm rounded-none pixel-button">
                        {isDiscoveryLoading ? 'Searching...' : 'Find Artists'}
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


export default App;
