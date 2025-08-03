import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Award, TrendingUp, BookOpen, Volume2, Wifi, Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { formatTime, saveToLocalStorage, getFromLocalStorage } from '../lib/utils';

const VoiceTest = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState('');
  const [previousResults, setPreviousResults] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [ieltsScore, setIeltsScore] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingTranscript, setStreamingTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // Load previous results from localStorage on component mount
  useEffect(() => {
    const savedResults = getFromLocalStorage('voiceTestResults');
    if (savedResults) {
      setPreviousResults(savedResults);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // Cleanup effect for AudioContext and WebSocket
  useEffect(() => {
    return () => {
      // Cleanup WebSocket
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      // Cleanup AudioContext
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    const ws = new WebSocket(`ws://localhost:3001`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'streaming_started') {
          setIsStreaming(true);
          setStreamingTranscript('');
        } else if (data.type === 'transcript_update') {
          setStreamingTranscript(data.transcript);
        } else if (data.type === 'streaming_stopped') {
          setIsStreaming(false);
        } else if (data.type === 'error') {
          setError(data.message);
          setIsStreaming(false);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsStreaming(false);
    };

    return ws;
  };

  const startStreaming = async () => {
    try {
      setError('');
      
      // Clean up any existing AudioContext
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      const ws = initializeWebSocket();
      
      // Start AssemblyAI streaming
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start_streaming' }));
        
        try {
          // Set up audio processing
          audioContextRef.current = new AudioContext({ sampleRate: 16000 });
          const source = audioContextRef.current.createMediaStreamSource(stream);
          processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          processorRef.current.onaudioprocess = (event) => {
            if (ws.readyState === WebSocket.OPEN) {
              const audioData = event.inputBuffer.getChannelData(0);
              const buffer = new ArrayBuffer(audioData.length * 2);
              const view = new DataView(buffer);
              
              for (let i = 0; i < audioData.length; i++) {
                const sample = Math.max(-1, Math.min(1, audioData[i]));
                view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
              }
              
              ws.send(JSON.stringify({
                type: 'audio_data',
                audio: Array.from(new Uint8Array(buffer))
              }));
            }
          };
          
          source.connect(processorRef.current);
          processorRef.current.connect(audioContextRef.current.destination);
        } catch (audioError) {
          console.error('AudioContext setup error:', audioError);
          setError('Failed to initialize audio processing. Please try again.');
          return;
        }
      };
      
      setIsRecording(true);
      setRecordingTime(0);
      
    } catch (error) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Streaming error:', error);
    }
  };

  const stopStreaming = () => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stop_streaming' }));
        wsRef.current.close();
      }
      
      if (processorRef.current) {
        try {
          processorRef.current.disconnect();
        } catch (error) {
          console.warn('Error disconnecting processor:', error);
        }
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (error) {
          console.warn('Error closing AudioContext:', error);
        }
      }
    } catch (error) {
      console.error('Error in stopStreaming:', error);
    }
    
    setIsRecording(false);
    setStreamingTranscript('');
  };

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    setError('');

    try {
      // Try to use real API first
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('duration', recordingTime.toString());

      console.log('Sending audio to server...');
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      let finalTranscript = '';
      let isDemo = true;
      let scoreData = null;

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        finalTranscript = result.transcript;
        scoreData = result.ieltsScore;
        isDemo = false;
        
        console.log('Using real transcription:', finalTranscript);
        console.log('IELTS Score:', scoreData);
      } else {
        // Fallback to demo mode with realistic transcript
        const errorText = await response.text();
        console.log('API Error:', errorText);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        finalTranscript = "My hometown is a beautiful coastal city called Brighton, located in the south of England. What makes it special to me is the vibrant community and the stunning seaside location. The people here are incredibly friendly and welcoming, always ready to help each other out. There's a strong sense of community spirit that you can feel throughout the city. The places that are most important to me include the historic pier, where I spent many childhood summers, and the famous Brighton Pavilion with its unique architecture. The activities I enjoy most are walking along the beach promenade, visiting the local markets, and participating in the various festivals that happen throughout the year. The combination of history, culture, and natural beauty makes Brighton a truly special place to call home.";
        isDemo = true;
        
        // Demo IELTS score based on the realistic transcript
        scoreData = {
          fluency: 7,
          pronunciation: 6,
          grammar: 7,
          vocabulary: 6,
          overall: 6.5,
          wordCount: 89,
          wordsPerMinute: 95,
          speakingTime: recordingTime,
          vocabularyDiversity: 0.65
        };
        
        console.log('Using demo transcription:', finalTranscript);
      }
      
      setTranscript(finalTranscript);
      setIeltsScore(scoreData);
      setIsDemoMode(isDemo);
      
      // Save to localStorage
      const newResult = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        transcript: finalTranscript,
        duration: recordingTime,
        isDemo: isDemo,
        ieltsScore: scoreData
      };
      
      const updatedResults = [newResult, ...previousResults].slice(0, 10);
      setPreviousResults(updatedResults);
      saveToLocalStorage('voiceTestResults', updatedResults);
      
      setShowResults(true);
    } catch (error) {
      console.error('Processing error:', error);
      setError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setRecordingTime(0);
    setTranscript('');
    setError('');
    setShowResults(false);
    setIeltsScore(null);
    setStreamingTranscript('');
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 7) return 'text-blue-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100 border-green-200';
    if (score >= 7) return 'bg-blue-100 border-blue-200';
    if (score >= 6) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 6) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
             Speaking Practice
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Practice your speaking skills with AI-powered transcription and scoring
          </p>
          {isDemoMode && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-full text-yellow-800 text-sm">
              <span className="mr-2">🎭</span>
              Demo Mode - Add AssemblyAI API key for real transcription
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recording Section */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="text-2xl font-bold">Speaking Practice</CardTitle>
                <CardDescription className="text-blue-100">
                  Record your response to the speaking question
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                {/* Question Card */}
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">Q</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 mb-3 text-lg">Question:</h3>
                        <p className="text-blue-800 text-lg leading-relaxed">
                          "Describe your hometown and what makes it special to you. Include details about the people, places, and activities that are important to you."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recording Controls */}
                <div className="text-center space-y-6">
                  {/* Main Recording Button */}
                  <div className="flex justify-center space-x-4">
                    {!isRecording ? (
                      <div className="flex space-x-4">
                        <Button
                          onClick={startRecording}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold"
                          size="lg"
                        >
                          <Mic className="w-6 h-6 mr-3" />
                          Record & Process
                        </Button>
                        <Button
                          onClick={startStreaming}
                          disabled={isProcessing}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold"
                          size="lg"
                        >
                          <Wifi className="w-6 h-6 mr-3" />
                          Live Stream
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={isStreaming ? stopStreaming : stopRecording}
                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold"
                        size="lg"
                      >
                        <Square className="w-6 h-6 mr-3" />
                        Stop {isStreaming ? 'Streaming' : 'Recording'}
                      </Button>
                    )}
                  </div>

                  {/* Recording Status */}
                  {isRecording && (
                    <div className="flex items-center justify-center space-x-3 text-red-600 bg-red-50 px-6 py-4 rounded-full border border-red-200">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-lg">
                        {isStreaming ? 'Live Streaming' : 'Recording'}... {formatTime(recordingTime)}
                      </span>
                      {isStreaming && <Wifi className="w-5 h-5 text-green-600" />}
                    </div>
                  )}

                  {/* Live Transcript */}
                  {isStreaming && streamingTranscript && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <h4 className="font-semibold text-green-900 text-lg">Live Transcript:</h4>
                        </div>
                        <p className="text-green-800 leading-relaxed text-lg">{streamingTranscript}</p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Processing Status */}
                  {isProcessing && (
                    <div className="flex items-center justify-center space-x-3 text-blue-600 bg-blue-50 px-6 py-4 rounded-full border border-blue-200">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="font-medium text-lg">Processing audio...</span>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-red-800 font-medium">{error}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Previous Recordings */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm h-fit">
              <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-t-xl">
                <CardTitle className="text-xl font-bold">Previous Recordings</CardTitle>
                <CardDescription className="text-gray-200">
                  {previousResults.length} recording{previousResults.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                {previousResults.length > 0 ? (
                  <div className="space-y-4">
                    {previousResults.slice(0, 5).map((result, index) => (
                      <Card key={result.id} className="bg-gray-50 border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700">
                                {new Date(result.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                {formatTime(result.duration)}
                              </span>
                              {result.isDemo && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  Demo
                                </span>
                              )}
                            </div>
                          </div>

                          {/* IELTS Score */}
                          {result.ieltsScore && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Speaking Score</span>
                                <div className="flex items-center space-x-1">
                                  <span className={`text-lg font-bold ${getScoreColor(result.ieltsScore.overall)}`}>
                                    {result.ieltsScore.overall}
                                  </span>
                                  <span className="text-xs text-gray-500">/9</span>
                                </div>
                              </div>
                              <div className="mt-2 flex space-x-1">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full shadow-sm ${getScoreColor(result.ieltsScore.overall).replace('text-', 'bg-')}`}
                                    style={{ width: `${(result.ieltsScore.overall / 9) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Transcript Preview */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700">Transcript</h4>
                            <div className="bg-white rounded-lg p-3 max-h-24 overflow-y-auto">
                              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                {result.transcript}
                              </p>
                            </div>
                          </div>

                          {/* Quick Metrics */}
                          {result.ieltsScore && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Words:</span>
                                  <span className="font-medium">{result.ieltsScore.wordCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Speed:</span>
                                  <span className="font-medium">{result.ieltsScore.wordsPerMinute} wpm</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Fluency:</span>
                                  <span className={`font-medium ${getScoreColor(result.ieltsScore.fluency)}`}>
                                    {result.ieltsScore.fluency}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-500">Grammar:</span>
                                  <span className={`font-medium ${getScoreColor(result.ieltsScore.grammar)}`}>
                                    {result.ieltsScore.grammar}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mic className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recordings yet</h3>
                    <p className="text-gray-500">Start recording to see your speaking history here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results Dialog */}
        {transcript && (
          <Dialog open={showResults} onOpenChange={setShowResults}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -mt-6 -mx-6 px-6 py-4">
                <DialogTitle className="text-2xl font-bold"> Speaking Assessment</DialogTitle>
                <DialogDescription className="text-blue-100">
                  Your speaking performance analysis and scoring.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 pt-4">
                {/* IELTS Scores */}
                {ieltsScore && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className={`${getScoreBgColor(ieltsScore.fluency)} border-2`}>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <TrendingUp className="w-6 h-6 text-green-600 mr-2" />
                          <span className="font-semibold text-green-900">Fluency</span>
                        </div>
                        <div className={`text-3xl font-bold mb-2 ${getScoreColor(ieltsScore.fluency)}`}>
                          {ieltsScore.fluency}
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLabel(ieltsScore.fluency)}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className={`${getScoreBgColor(ieltsScore.pronunciation)} border-2`}>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Volume2 className="w-6 h-6 text-blue-600 mr-2" />
                          <span className="font-semibold text-blue-900">Pronunciation</span>
                        </div>
                        <div className={`text-3xl font-bold mb-2 ${getScoreColor(ieltsScore.pronunciation)}`}>
                          {ieltsScore.pronunciation}
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLabel(ieltsScore.pronunciation)}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className={`${getScoreBgColor(ieltsScore.grammar)} border-2`}>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <BookOpen className="w-6 h-6 text-purple-600 mr-2" />
                          <span className="font-semibold text-purple-900">Grammar</span>
                        </div>
                        <div className={`text-3xl font-bold mb-2 ${getScoreColor(ieltsScore.grammar)}`}>
                          {ieltsScore.grammar}
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLabel(ieltsScore.grammar)}</div>
                      </CardContent>
                    </Card>
                    
                    <Card className={`${getScoreBgColor(ieltsScore.vocabulary)} border-2`}>
                      <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-3">
                          <Award className="w-6 h-6 text-orange-600 mr-2" />
                          <span className="font-semibold text-orange-900">Vocabulary</span>
                        </div>
                        <div className={`text-3xl font-bold mb-2 ${getScoreColor(ieltsScore.vocabulary)}`}>
                          {ieltsScore.vocabulary}
                        </div>
                        <div className="text-sm text-gray-600">{getScoreLabel(ieltsScore.vocabulary)}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Overall Score */}
                {ieltsScore && (
                  <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <CardContent className="p-8 text-center">
                      <h3 className="text-2xl font-semibold mb-3">Overall Score</h3>
                      <div className="text-6xl font-bold mb-3">{ieltsScore.overall}</div>
                      <div className="text-xl opacity-90 mb-4">{getScoreLabel(ieltsScore.overall)}</div>
                      <div className="flex justify-center space-x-6 text-sm opacity-75">
                        <div>
                          <span className="font-medium">Words:</span> {ieltsScore.wordCount}
                        </div>
                        <div>
                          <span className="font-medium">Speed:</span> {ieltsScore.wordsPerMinute} wpm
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {formatTime(ieltsScore.speakingTime)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Transcript */}
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Your Response:
                    </h4>
                    <p className="text-gray-700 leading-relaxed text-lg">{transcript}</p>
                  </CardContent>
                </Card>

                {/* Detailed Metrics */}
                {ieltsScore && (
                  <Card className="bg-white border-gray-200">
                    <CardContent className="p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Detailed Analysis
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">Speaking Rate:</span>
                          <span className="font-semibold">{ieltsScore.wordsPerMinute} words per minute</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">Vocabulary Diversity:</span>
                          <span className="font-semibold">{(ieltsScore.vocabularyDiversity * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">Total Words:</span>
                          <span className="font-semibold">{ieltsScore.wordCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700">Speaking Time:</span>
                          <span className="font-semibold">{formatTime(ieltsScore.speakingTime)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="text-sm text-gray-500 text-center">
                  {isDemoMode && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      🎭 Demo Mode
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={resetRecording} className="px-6 py-2">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Record Again
                </Button>
                <Button onClick={() => setShowResults(false)} className="px-6 py-2">
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default VoiceTest; 