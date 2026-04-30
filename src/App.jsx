import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  ExpandMore,
  Info
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import larqlText from '/larql-walk.outout.txt?raw';

// Animation for text flying toward viewer (center of screen)
const flyOutAnimation = keyframes`
  0% {
    font-weight: normal;
    transform: scale(1) translateZ(0px);
    opacity: 1;
    color: inherit;
    z-index: 1;
    filter: blur(0px);
  }
  20% {
    font-weight: bold;
    transform: scale(1.8) translateZ(50px);
    opacity: 1;
    color: #1976d2;
    z-index: 10;
    filter: blur(0px);
  }
  40% {
    font-weight: bold;
    transform: scale(3.5) translateZ(150px);
    opacity: 0.9;
    color: #1565c0;
    z-index: 20;
    filter: blur(0.5px);
  }
  60% {
    font-weight: bold;
    transform: scale(6) translateZ(300px);
    opacity: 0.7;
    color: #0d47a1;
    z-index: 30;
    filter: blur(1px);
  }
  80% {
    font-weight: bold;
    transform: scale(10) translateZ(500px);
    opacity: 0.4;
    color: #0d47a1;
    z-index: 40;
    filter: blur(2px);
  }
  100% {
    font-weight: bold;
    transform: scale(15) translateZ(800px);
    opacity: 0;
    color: transparent;
    z-index: 50;
    filter: blur(4px);
    visibility: hidden;
  }
`;

const AnimatedText = styled('span')(({ shouldAnimate }) => ({
  animation: shouldAnimate ? `${flyOutAnimation} 2.5s ease-out forwards` : 'none',
  display: 'inline-block',
  position: 'relative',
  transition: 'all 0.3s ease',
}));

const HighlightedLine = styled(Box)(({ isHighlighted }) => ({
  backgroundColor: isHighlighted ? '#fff3cd' : 'transparent',
  padding: isHighlighted ? '4px 8px' : '2px 0',
  borderRadius: '4px',
  margin: '2px 0',
  transition: 'background-color 0.3s ease',
  borderLeft: isHighlighted ? '4px solid #ffc107' : 'none',
}));

const TextContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  maxHeight: '70vh',
  overflowY: 'auto',
  fontFamily: 'monospace',
  fontSize: '14px',
  lineHeight: '1.4',
  backgroundColor: '#ffffff',
  position: 'relative',
  perspective: '1000px',
  transformStyle: 'preserve-3d',
}));


const ControlPanel = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  paddingLeft: theme.spacing(12), // Add padding to make space for absolute image
  backgroundColor: '#f5f5f5',
  borderRadius: '12px',
  marginBottom: theme.spacing(3),
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  position: 'relative',

  // Mobile responsive styling
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    paddingLeft: theme.spacing(1), // Minimal padding on mobile
    paddingRight: theme.spacing(1), // Minimal right padding for mobile
    paddingTop: theme.spacing(2), // Top padding
    paddingBottom: theme.spacing(2), // Bottom padding
    gap: theme.spacing(2),
    width: '100%', // Ensure full width on mobile
    maxWidth: '100%', // Prevent overflow
    overflow: 'hidden', // Prevent content overflow
    margin: '0 auto', // Center the container
  },
}));

const PlaybackControls = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
}));

const WaveVisualizer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  height: '50px',
  width: '400px',
  padding: theme.spacing(1),
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  borderRadius: '8px',
  overflow: 'hidden',

  // Responsive styling for screens 535px and narrower
  [theme.breakpoints.down('sm')]: {
    width: '250px', // Reduce width for smaller screens
    height: '40px', // Reduce height slightly
    gap: '1px', // Reduce gap between bars
  },

  // Extra small screens (around 400px and narrower)
  [theme.breakpoints.down('xs')]: {
    width: '200px', // Further reduce width
    height: '35px', // Further reduce height
    padding: theme.spacing(0.5), // Reduce padding
  },
}));

const WaveBar = styled(Box)(({ height, isPlaying }) => ({
  width: '3px',
  height: `${height}%`,
  backgroundColor: isPlaying ? '#1976d2' : '#ccc',
  borderRadius: '2px',
  transition: 'height 0.1s ease-out, background-color 0.3s ease',
  animation: isPlaying ? 'wave 0.5s ease-in-out infinite' : 'none',
  '@keyframes wave': {
    '0%, 100%': { transform: 'scaleY(1)' },
    '50%': { transform: 'scaleY(1.2)' }
  }
}));

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(1);
  const [textLines, setTextLines] = useState([]);
  const [highlightedLines, setHighlightedLines] = useState(new Set());
  const [animatedWords, setAnimatedWords] = useState(new Set());
  const [animatedPhrases, setAnimatedPhrases] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [specialAnimationTriggered, setSpecialAnimationTriggered] = useState(false);
  const [special1Mp3Triggered, setSpecial1Mp3Triggered] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const audioRef = useRef(null);
  const animationIntervalRef = useRef(null);
  const timeUpdateRef = useRef(null);
  const textContainerRef = useRef(null);
  const waveAnimationRef = useRef(null);

  // Parse text file on mount
  useEffect(() => {
    const lines = larqlText.split('\n');
    setTextLines(lines);
  }, []);

  // Initialize waveform data
  useEffect(() => {
    const bars = 30; // Number of wave bars
    const initialWave = Array.from({ length: bars }, () => Math.random() * 30 + 10);
    setWaveformData(initialWave);
  }, []);

  // Animate waveform when audio is actually playing and has sound
  useEffect(() => {
    if (isPlaying && currentTime > 0.1) { // Only animate after audio has actually started
      const animateWave = () => {
        setWaveformData(prev =>
          prev.map(() => Math.random() * 60 + 20) // Random heights between 20-80%
        );
      };

      // Start wave animation
      waveAnimationRef.current = setInterval(animateWave, 150);

      return () => {
        if (waveAnimationRef.current) {
          clearInterval(waveAnimationRef.current);
        }
      };
    } else {
      // Stop animation and reset to static state
      if (waveAnimationRef.current) {
        clearInterval(waveAnimationRef.current);
        waveAnimationRef.current = null;
      }
      setWaveformData(prev => prev.map(() => 20)); // Static low bars
    }
  }, [isPlaying, currentTime]);

  // Handle periodic re-randomization when 2.mp3 or 4.mp3 is playing
  useEffect(() => {
    // Clear any existing interval
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }

    // Start periodic re-randomization when 2.mp3, 4.mp3, 6.mp3, or 8.mp3 is playing
    if ((currentTrack === 2 || currentTrack === 4 || currentTrack === 6 || currentTrack === 8) && isPlaying) {
      // Initial animation
      animateRandomWords();

      // Re-randomize every 3 seconds to ensure continuous animation with no gaps
      // (1-7 phrases × 0.2s delay + 2.5s animation duration = ~2.9-3.9s total)
      animationIntervalRef.current = setInterval(() => {
        animateRandomWords();
      }, 3000);
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
        animationIntervalRef.current = null;
      }
    };
  }, [currentTrack, isPlaying]);

  // Handle audio element updates when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.load();
    }
  }, [currentTrack]);

  // Handle audio playback and synchronization
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      setSpecialAnimationTriggered(false);
      setSpecial1Mp3Triggered(false);

      // When 2.mp3 plays, highlight Layer 0 lines (2-12)
      if (currentTrack === 2) {
        highlightLayer0();
        animateRandomWords();
      } else if (currentTrack === 4) {
        highlightLayer3();
        animateRandomWords();
        scrollToLayer1(); // Scroll to Layer 1 when 4.mp3 starts
      } else if (currentTrack === 5) {
        clearHighlights();
        scrollToLine431(); // Scroll to line 431 when 5.mp3 starts
      } else if (currentTrack === 6) {
        highlightLayer6();
        animateRandomWords();
      } else if (currentTrack === 8) {
        highlightLayer8();
        animateRandomWords();
      } else {
        clearHighlights();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setSpecialAnimationTriggered(false);
      setSpecial1Mp3Triggered(false);
      clearHighlights();

      // Reset to track 1 when 9.mp3 finishes
      if (currentTrack === 9) {
        setCurrentTrack(1);
        // Reset all animations and highlights
        setAnimatedWords(new Set());
        setAnimatedPhrases({});
        // Scroll text area back to line 1
        scrollToLine(1);
      } else {
        // Auto-play next track for tracks 1-8
        const nextTrack = currentTrack + 1;
        setCurrentTrack(nextTrack);
        // Auto-play the next track after a short delay
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.error('Auto-play failed:', error);
            });
          }
        }, 100);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      const time = audio.currentTime;
      setCurrentTime(time);

      // Trigger special animation for 1.mp3 at 9 seconds
      if (currentTrack === 1 && !special1Mp3Triggered && time >= 10 && time <= 11.0) {
        setSpecial1Mp3Triggered(true);
        animate2Plus2();
      }

      // Trigger special animation for 2.mp3 at 26-28 seconds
      if (currentTrack === 2 && !specialAnimationTriggered && time >= 26 && time <= 28) {
        setSpecialAnimationTriggered(true);
        animateSinTanArctan();
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [currentTrack]);

  const highlightLayer0 = () => {
    // Highlight lines 2-12 (Layer 0)
    const layer0Lines = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    setHighlightedLines(layer0Lines);
  };

  const highlightLayer3 = () => {
    // Highlight lines 14-45 (Layers 1-3)
    const layers1To3Lines = new Set();
    for (let i = 14; i <= 45; i++) {
      layers1To3Lines.add(i);
    }
    setHighlightedLines(layers1To3Lines);
  };

  const highlightLayer6 = () => {
    // Highlight lines 432-452 for 6.mp3
    const layer6Lines = new Set();
    for (let i = 432; i <= 452; i++) {
      layer6Lines.add(i);
    }
    setHighlightedLines(layer6Lines);
  };

  const highlightLayer8 = () => {
    // Highlight lines 454-464 for 8.mp3
    const layer8Lines = new Set();
    for (let i = 454; i <= 464; i++) {
      layer8Lines.add(i);
    }
    setHighlightedLines(layer8Lines);
  };

  const clearHighlights = () => {
    setHighlightedLines(new Set());
    setAnimatedWords(new Set());
    setAnimatedPhrases({});
  };

  const animateSinTanArctan = () => {
    // Specific animation for sin, tan, arctan on line 9 (index 8) at 26-28 seconds of 2.mp3
    const targetLineIndex = 8; // Line 9
    const targetPhrases = ['sin', 'tan', 'arctan'];

    const animatedSet = new Set([targetLineIndex]);
    const animatedPhrases = {};

    animatedPhrases[targetLineIndex] = targetPhrases.map((phrase, index) => ({
      text: phrase,
      delay: index * 0.15 // sin starts immediately, tan after 0.15s, arctan after 0.3s
    }));

    setAnimatedWords(animatedSet);
    setAnimatedPhrases(animatedPhrases);
  };

  const scrollToLine = (lineNumber) => {
    if (textContainerRef.current) {
      const lineElements = textContainerRef.current.querySelectorAll('[data-line-index]');
      const targetElement = Array.from(lineElements).find(el =>
        parseInt(el.dataset.lineIndex) === lineNumber - 1
      );

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    }
  };

  const scrollToLayer1 = () => {
    // Scroll to Layer 1 (line 14)
    scrollToLine(14);
  };

  const scrollToLine431 = () => {
    // Scroll to line 431
    scrollToLine(431);
  };

  const isOddTrack = (track) => {
    const result = track % 2 === 1; // Returns true for odd-numbered tracks (1,3,5,7,9)
    console.log('isOddTrack check:', track, result);
    return result;
  };

  const isEvenTrack = (track) => {
    const result = track % 2 === 0; // Returns true for even-numbered tracks (2,4,6,8)
    return result;
  };

  const animate2Plus2 = () => {
    // Specific animation for "2 + 2 =" on line 1 (index 0) at 9 seconds of 1.mp3
    const targetLineIndex = 0; // Line 1
    const targetPhrase = "2 + 2 =";

    const animatedSet = new Set([targetLineIndex]);
    const animatedPhrases = {};

    animatedPhrases[targetLineIndex] = [{
      text: targetPhrase,
      delay: 0 // Start immediately
    }];

    setAnimatedWords(animatedSet);
    setAnimatedPhrases(animatedPhrases);
  };

  const animateRandomWords = () => {
    // Determine which lines to animate based on current track
    let startLine, endLine;
    if (currentTrack === 2) {
      // Lines 3-12 (indices 2-11) for 2.mp3
      startLine = 2;
      endLine = 11;
    } else if (currentTrack === 4) {
      // Lines 14-45 (indices 13-44) for 4.mp3 - covers layers 1-3
      startLine = 13;
      endLine = 44;
    } else if (currentTrack === 6) {
      // Lines 432-452 (indices 431-451) for 6.mp3
      startLine = 431;
      endLine = 451;
    } else if (currentTrack === 8) {
      // Lines 454-464 (indices 453-463) for 8.mp3
      startLine = 453;
      endLine = 463;
    } else {
      // No animation for other tracks
      return;
    }

    const animatedSet = new Set();
    const animatedPhrases = {};
    const allPhrases = [];

    // Collect all possible phrases from the specified line range
    for (let i = startLine; i <= endLine && i < textLines.length; i++) {
      const line = textLines[i];
      if (!line.trim()) continue;

      // Extract various types of content from the line
      const allMatches = [];

      // Extract different types of patterns
      const hearsMatches = line.match(/hears="[^"]*"/g) || [];
      const gateMatches = line.match(/gate=[+-]?\d+\.?\d*/g) || [];
      const cMatches = line.match(/c=\d+\.\d+/g) || [];
      const fMatches = line.match(/F\d+/g) || [];
      const downMatches = line.match(/down=\[[^\]]*\]/g) || [];
      const wordMatches = line.match(/\b[a-zA-Z\-]+\b/g) || [];
      const unicodeMatches = line.match(/[^\x00-\x7F]+/g) || [];

      // Combine all matches with different weights
      allMatches.push(...hearsMatches.map(m => ({ text: m, weight: 3, lineIndex: i })));
      allMatches.push(...gateMatches.map(m => ({ text: m, weight: 2, lineIndex: i })));
      allMatches.push(...cMatches.map(m => ({ text: m, weight: 2, lineIndex: i })));
      allMatches.push(...fMatches.map(m => ({ text: m, weight: 1, lineIndex: i })));
      allMatches.push(...downMatches.map(m => ({ text: m, weight: 1, lineIndex: i })));
      allMatches.push(...wordMatches.map(m => ({ text: m, weight: 1, lineIndex: i })));
      allMatches.push(...unicodeMatches.map(m => ({ text: m, weight: 2, lineIndex: i })));

      allPhrases.push(...allMatches);
    }

    // Filter out empty strings and duplicates
    const uniquePhrases = allPhrases.filter((item, index, self) =>
      item && item.text && self.findIndex(t => t.text === item.text) === index
    );

    // Select 1-7 phrases total for sequential animation (more concurrent animations)
    const numToAnimate = Math.min(uniquePhrases.length, Math.floor(Math.random() * 7) + 1);
    const selectedPhrases = [];

    for (let j = 0; j < numToAnimate && uniquePhrases.length > 0; j++) {
      // Weighted random selection
      const totalWeight = uniquePhrases.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;

      for (let k = 0; k < uniquePhrases.length; k++) {
        random -= uniquePhrases[k].weight;
        if (random <= 0) {
          selectedIndex = k;
          break;
        }
      }

      const selectedItem = uniquePhrases[selectedIndex];
      selectedPhrases.push({
        text: selectedItem.text,
        lineIndex: selectedItem.lineIndex,
        delay: j * 0.2 // Stagger animations by 0.2 seconds for maximum concurrent effect
      });

      // Remove selected item to avoid duplicates
      uniquePhrases.splice(selectedIndex, 1);
    }

    // Group phrases by line for rendering
    selectedPhrases.forEach(phrase => {
      if (!animatedPhrases[phrase.lineIndex]) {
        animatedPhrases[phrase.lineIndex] = [];
      }
      animatedPhrases[phrase.lineIndex].push({
        text: phrase.text,
        delay: phrase.delay
      });
      animatedSet.add(phrase.lineIndex);
    });

    setAnimatedWords(animatedSet);
    setAnimatedPhrases(animatedPhrases);
  };

  const playPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };


  const renderTextLine = (line, index) => {
    const lineNumber = index + 1;
    const isHighlighted = highlightedLines.has(lineNumber);
    const shouldAnimate = animatedWords.has(index);
    const phrasesToAnimate = animatedPhrases[index] || [];

    // Parse and render the line with potential animated words/phrases
    const renderLineContent = () => {
      if (shouldAnimate && phrasesToAnimate.length > 0) {
        let result = line;
        phrasesToAnimate.forEach((phraseObj, phraseIndex) => {
          // Replace the phrase with a placeholder that we'll replace later
          result = result.replace(phraseObj.text, `__ANIMATED_${phraseIndex}__`);
        });

        // Now split and replace placeholders with actual animated elements
        const parts = result.split(/(__ANIMATED_\d+__)/);
        return parts.map((part, partIndex) => {
          const match = part.match(/__ANIMATED_(\d+)__/);
          if (match) {
            const phraseIndex = parseInt(match[1]);
            const phraseObj = phrasesToAnimate[phraseIndex];
            return (
              <AnimatedText
                key={`animated-${index}-${phraseIndex}-${partIndex}`}
                shouldAnimate={true}
                style={{
                  animationDelay: `${phraseObj.delay}s`
                }}
              >
                {phraseObj.text}
              </AnimatedText>
            );
          }
          return part;
        });
      }
      return line;
    };

    return (
      <HighlightedLine
        key={index}
        isHighlighted={isHighlighted}
        data-line-index={index}
      >
        {renderLineContent()}
      </HighlightedLine>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 1 }}>
        LARQL LLM Model Visualization
      </Typography>

      <Typography variant="subtitle1" align="center" sx={{ mb: 3, color: 'text.secondary', fontStyle: 'italic', maxWidth: '800px', mx: 'auto' }}>
        A fun project depicting how a user asks a simple question, and how an LLM model infers that prompt and calculates relationships in complex ways
        - similar to how a very intelligent person's mind would often jump all over the universe on just a simple small question.
      </Typography>

      <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(156, 39, 176, 0.08)', borderRadius: 1, border: '1px solid rgba(156, 39, 176, 0.2)' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#7b1fa2' }}>
          The Scene: A Psychiatrist's Office
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
          <strong>Dr. Clouseau:</strong> "Gemma, I'd like to understand how you think. Can you tell me what comes to mind when you hear the expression '2 + 2'?"
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2, fontStyle: 'italic' }}>
          <strong>Gemma (LLM):</strong> "When I encounter '2 + 2', I don't just see numbers. I experience a cascade of neural activations flowing through my layers. First, the tokens are embedded into high-dimensional space, then attention mechanisms weigh the relationships between symbols. My internal reasoning unfolds like a conversation across my transformer layers..."
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
          <strong>Dr. Clouseau:</strong> "Fascinating. So it's not just calculation for you?"
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.6, fontStyle: 'italic' }}>
          <strong>Gemma:</strong> "No. It's a journey through learned patterns. Each layer refines my understanding, from recognizing the mathematical structure to accessing the concept of addition, until finally converging on '4'. This visualization shows that journey - my 'thought process' made visible through LARQL's walk command."
        </Typography>
        <Typography variant="body2" sx={{ mt: 2, fontSize: '0.875rem', color: '#666' }}>
          <em>This visualization represents that very conversation - a window into how an LLM 'reasons' through a seemingly simple mathematical expression.</em>
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            sx={{
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.12)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                What is this visualization?
              </Typography>
              <Chip
                label="LARQL Walk Command"
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Command: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '4px' }}>larql walk --index gemma-4-E4B.vindex -p "2 + 2 ="</code>
              </Typography>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  What is LARQL?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The model IS the database. Query neural network weights like a graph database. No GPU required.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  LARQL decompiles transformer models into a queryable format called a vindex (vector index), then provides
                  LQL (Lazarus Query Language) to browse, edit, and recompile the model's knowledge.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  <strong>Credit & Reference:</strong> LARQL is an open-source project created by Chris Hayuk.
                  Learn more at: <a href="https://github.com/chrishayuk/larql?tab=readme-ov-file" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>
                    https://github.com/chrishayuk/larql
                  </a>
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  What does a WALK do?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A LARQL WALK command traverses through the layers of an LLM, showing how the model processes input step by step.
                  It reveals the internal transformations, attention patterns, and computational pathways that lead to the final
                  output. This visualization shows the model's "thought process" as it evaluates mathematical expressions like "2 + 2 =".
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  What is a vindex?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A vindex is a directory containing a model's weights reorganised for queryability. Gate vectors become a KNN index. Embeddings become token lookups. Down projections become edge labels. The model IS the database.
                </Typography>
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(245, 245, 245, 0.8)', borderRadius: 1, fontFamily: 'monospace', fontSize: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                    gemma3-4b.vindex/
                  </Typography>
                  <Typography variant="body2" component="div">
                    gate_vectors.bin         # W_gate rows (KNN index, 3.3 GB)<br/>
                    embeddings.bin           # W_embed matrix (token lookup, 2.5 GB)<br/>
                    down_meta.bin            # Per-feature output metadata (binary)<br/>
                    index.json               # Config, layer bands, provenance<br/>
                    tokenizer.json           # Tokenizer<br/>
                    relation_clusters.json   # Discovered relation types<br/>
                    feature_labels.json      # Probe-confirmed labels
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.08)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  <strong>Note:</strong> This visualization shows how the Gemma-4 LLM processes the mathematical expression
                  "2 + 2 =" layer by layer, with different audio tracks highlighting different computational stages and
                  attention patterns throughout the model's reasoning process.
                </Typography>
              </Box>

              <Box sx={{ mt: 3, p: 3, backgroundColor: 'rgba(33, 150, 243, 0.08)', borderRadius: 1, border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#1976d2' }}>
                  Technical Solution Architecture
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                  This visualization demonstrates a complete AI pipeline combining multiple advanced technologies:
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                    <strong>• AWS Polly for Text-to-Speech Generation:</strong> Utilizes custom lexicons to generate natural-sounding speech with precise pronunciation control for technical terms and mathematical expressions.
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                    <strong>• Gemma4 Local LLM through Ollama:</strong> Leverages the Gemma4 model running locally via Ollama to generate sophisticated LARQL conversations and reasoning demonstrations.
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                    <strong>• LARQL Gemma4 Export to Vindex:</strong> Exports Gemma4 model weights to a vindex structure enabling efficient neural network graph traversal and analytics.
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 1 }}>
                    <strong>• Walk and Inference Analytics:</strong> Implements LARQL's WALK command to traverse transformer layers step-by-step, providing unprecedented visibility into LLM reasoning processes.
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 2, fontSize: '0.875rem', color: '#666' }}>
                  <em>This architecture enables real-time visualization of neural network activations, making the 'black box' of AI reasoning transparent and educational and fun!.</em>
                </Typography>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <ControlPanel>
        <img
          src="/1.jpg"
          alt="Left Image"
          style={{
            position: 'absolute',
            left: (isPlaying && isOddTrack(currentTrack)) ? '-60px' : '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: (isPlaying && isOddTrack(currentTrack)) ? '400px' : '120px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isOddTrack(currentTrack))
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            zIndex: (isPlaying && isOddTrack(currentTrack)) ? 20 : 10,
            display: 'none', // Hidden by default, shown via media query
          }}
        />

        {/* Mobile version of 1.jpg - positioned below controls */}
        <Box
          component="img"
          src="/1.jpg"
          alt="Left Image Mobile"
          sx={{
            display: { xs: 'block', sm: 'none' }, // Show only on xs (mobile), hide on sm+
            width: (isPlaying && isOddTrack(currentTrack)) ? '200px' : '60px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isOddTrack(currentTrack))
              ? '0 6px 20px rgba(0,0,0,0.3)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            margin: '8px 0',
            alignSelf: 'center',
          }}
        />

        {/* Desktop version of 1.jpg - positioned on the left */}
        <Box
          component="img"
          src="/1.jpg"
          alt="Left Image Desktop"
          sx={{
            display: { xs: 'none', sm: 'block' }, // Hide on xs, show on sm+
            position: 'absolute',
            left: (isPlaying && isOddTrack(currentTrack)) ? '-60px' : '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: (isPlaying && isOddTrack(currentTrack)) ? '400px' : '120px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isOddTrack(currentTrack))
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            zIndex: (isPlaying && isOddTrack(currentTrack)) ? 20 : 10,
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PlaybackControls>
            <IconButton
              onClick={playPause}
              disabled={isLoading}
              sx={{
                backgroundColor: '#1976d2',
                borderRadius: '50%',
                width: 56,
                height: 56,
                color: 'white',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
                },
                '&:active': {
                  backgroundColor: '#0d47a1',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.5)'
                },
                '&:disabled': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  color: 'rgba(255, 255, 255, 0.6)',
                  boxShadow: 'none'
                }
              }}
            >
              {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>
          </PlaybackControls>

          <WaveVisualizer>
            {waveformData.map((height, index) => (
              <WaveBar
                key={index}
                height={height}
                isPlaying={isPlaying}
                style={{
                  animationDelay: `${index * 0.05}s`
                }}
              />
            ))}
          </WaveVisualizer>
        </Box>

        <img
          src="/2.jpg"
          alt="Right Image"
          style={{
            position: 'absolute',
            right: (isPlaying && isEvenTrack(currentTrack)) ? '-60px' : '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: (isPlaying && isEvenTrack(currentTrack)) ? '400px' : '120px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isEvenTrack(currentTrack))
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            zIndex: (isPlaying && isEvenTrack(currentTrack)) ? 20 : 10,
            display: 'none', // Hidden by default, shown via media query
          }}
        />

        {/* Mobile version of 2.jpg - positioned below controls */}
        <Box
          component="img"
          src="/2.jpg"
          alt="Right Image Mobile"
          sx={{
            display: { xs: 'block', sm: 'none' }, // Show only on xs (mobile), hide on sm+
            width: (isPlaying && isEvenTrack(currentTrack)) ? '200px' : '60px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isEvenTrack(currentTrack))
              ? '0 6px 20px rgba(0,0,0,0.3)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            margin: '8px 0',
            alignSelf: 'center',
          }}
        />

        {/* Desktop version of 2.jpg - positioned on the right */}
        <Box
          component="img"
          src="/2.jpg"
          alt="Right Image Desktop"
          sx={{
            display: { xs: 'none', sm: 'block' }, // Hide on xs, show on sm+
            position: 'absolute',
            right: (isPlaying && isEvenTrack(currentTrack)) ? '-60px' : '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: (isPlaying && isEvenTrack(currentTrack)) ? '400px' : '120px',
            height: 'auto',
            borderRadius: '10px',
            boxShadow: (isPlaying && isEvenTrack(currentTrack))
              ? '0 12px 32px rgba(0,0,0,0.35)'
              : '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.5s ease-in-out',
            zIndex: (isPlaying && isEvenTrack(currentTrack)) ? 20 : 10,
          }}
        />
    </ControlPanel>

    <TextContainer ref={textContainerRef} elevation={3}>
      {textLines.map((line, index) => renderTextLine(line, index))}
    </TextContainer>

    <audio
      ref={audioRef}
      src={`/${currentTrack}.mp3`}
      preload="metadata"
    />

    <Box sx={{ mt: 4, p: 2, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
      <Typography variant="body2" sx={{ textAlign: 'center', color: '#666' }}>
        © 2024 LARQL Audio Visualization | Author: Francois Harmse | Contact: francois.harmse@gmail.com
      </Typography>
    </Box>
  </Container>
);
}

export default App;
