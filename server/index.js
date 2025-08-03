const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting - fixed configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skip: (req) => req.path === '/api/health' // Skip rate limiting for health check
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `audio-${uniqueSuffix}.webm`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// IELTS Scoring Function
const calculateIELTSScore = (transcript, duration) => {
  const words = transcript.split(' ').filter(word => word.length > 0);
  const wordCount = words.length;
  const speakingTime = duration; // in seconds
  const wordsPerMinute = speakingTime > 0 ? (wordCount / speakingTime) * 60 : 0;
  
  // Calculate various metrics for IELTS scoring
  const metrics = {
    fluency: 0,
    pronunciation: 0,
    grammar: 0,
    vocabulary: 0,
    overall: 0
  };
  
  // REAL IELTS FLUENCY CRITERIA (Band 9 = Native-like fluency)
  // Based on speaking rate, hesitation, and coherence
  if (wordsPerMinute >= 150 && wordCount >= 50) metrics.fluency = 9;
  else if (wordsPerMinute >= 120 && wordCount >= 40) metrics.fluency = 8;
  else if (wordsPerMinute >= 100 && wordCount >= 30) metrics.fluency = 7;
  else if (wordsPerMinute >= 80 && wordCount >= 20) metrics.fluency = 6;
  else if (wordsPerMinute >= 60 && wordCount >= 15) metrics.fluency = 5;
  else if (wordsPerMinute >= 40 && wordCount >= 10) metrics.fluency = 4;
  else if (wordsPerMinute >= 20 && wordCount >= 5) metrics.fluency = 3;
  else metrics.fluency = 2;
  
  // REAL IELTS VOCABULARY CRITERIA (Band 9 = Sophisticated vocabulary)
  // Based on lexical diversity and range
  const uniqueWords = new Set(words.map(word => word.toLowerCase()));
  const vocabularyDiversity = uniqueWords.size / wordCount;
  
  // Check for sophisticated vocabulary (academic words, idioms, etc.)
  const sophisticatedWords = words.filter(word => 
    word.length > 6 || 
    ['nevertheless', 'furthermore', 'consequently', 'subsequently', 'nevertheless', 
     'moreover', 'therefore', 'however', 'although', 'despite', 'regarding', 
     'concerning', 'significant', 'essential', 'crucial', 'fundamental'].includes(word.toLowerCase())
  ).length;
  
  const sophisticationRatio = sophisticatedWords / wordCount;
  
  if (vocabularyDiversity >= 0.9 && sophisticationRatio >= 0.3) metrics.vocabulary = 9;
  else if (vocabularyDiversity >= 0.8 && sophisticationRatio >= 0.2) metrics.vocabulary = 8;
  else if (vocabularyDiversity >= 0.7 && sophisticationRatio >= 0.15) metrics.vocabulary = 7;
  else if (vocabularyDiversity >= 0.6 && sophisticationRatio >= 0.1) metrics.vocabulary = 6;
  else if (vocabularyDiversity >= 0.5 && sophisticationRatio >= 0.05) metrics.vocabulary = 5;
  else if (vocabularyDiversity >= 0.4) metrics.vocabulary = 4;
  else if (vocabularyDiversity >= 0.3) metrics.vocabulary = 3;
  else metrics.vocabulary = 2;
  
  // REAL IELTS GRAMMAR CRITERIA (Band 9 = Wide range of structures with few errors)
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : 0;
  
  // Check for complex sentence structures
  const complexSentences = sentences.filter(sentence => 
    sentence.includes(',') || 
    sentence.includes('and') || 
    sentence.includes('but') || 
    sentence.includes('because') ||
    sentence.includes('although') ||
    sentence.includes('however') ||
    sentence.includes('therefore')
  ).length;
  
  const complexityRatio = complexSentences / sentences.length;
  
  if (avgSentenceLength >= 12 && complexityRatio >= 0.7) metrics.grammar = 9;
  else if (avgSentenceLength >= 10 && complexityRatio >= 0.6) metrics.grammar = 8;
  else if (avgSentenceLength >= 8 && complexityRatio >= 0.5) metrics.grammar = 7;
  else if (avgSentenceLength >= 6 && complexityRatio >= 0.4) metrics.grammar = 6;
  else if (avgSentenceLength >= 5 && complexityRatio >= 0.3) metrics.grammar = 5;
  else if (avgSentenceLength >= 4) metrics.grammar = 4;
  else if (avgSentenceLength >= 3) metrics.grammar = 3;
  else metrics.grammar = 2;
  
  // REAL IELTS PRONUNCIATION CRITERIA (Band 9 = Native-like pronunciation)
  // This is simplified - real IELTS uses human assessment
  // Factors: clarity, intonation, stress, connected speech
  let pronunciationScore = 6; // Base score
  
  // Adjust based on speaking time and word count
  if (speakingTime >= 30 && wordCount >= 50) pronunciationScore += 2;
  else if (speakingTime >= 20 && wordCount >= 30) pronunciationScore += 1;
  else if (speakingTime < 10 || wordCount < 10) pronunciationScore -= 1;
  
  // Adjust based on vocabulary sophistication
  if (sophisticationRatio >= 0.2) pronunciationScore += 1;
  
  // Ensure score is within IELTS band range (1-9)
  metrics.pronunciation = Math.min(9, Math.max(2, pronunciationScore));
  
  // Overall Score (average of all components, but with stricter criteria)
  const overallScore = (metrics.fluency + metrics.pronunciation + metrics.grammar + metrics.vocabulary) / 4;
  
  // Apply IELTS band descriptors for overall score
  if (overallScore >= 8.5) metrics.overall = 9;
  else if (overallScore >= 7.5) metrics.overall = 8;
  else if (overallScore >= 6.5) metrics.overall = 7;
  else if (overallScore >= 5.5) metrics.overall = 6;
  else if (overallScore >= 4.5) metrics.overall = 5;
  else if (overallScore >= 3.5) metrics.overall = 4;
  else if (overallScore >= 2.5) metrics.overall = 3;
  else metrics.overall = 2;
  
  return {
    ...metrics,
    wordCount,
    wordsPerMinute: Math.round(wordsPerMinute),
    speakingTime,
    vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
    sophisticationRatio: Math.round(sophisticationRatio * 100) / 100,
    complexityRatio: Math.round(complexityRatio * 100) / 100
  };
};

// AssemblyAI API functions
const uploadToAssemblyAI = async (audioBuffer) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured');
  }

  const baseUrl = 'https://api.assemblyai.com';
  const headers = {
    authorization: apiKey,
  };

  try {
    // Upload the audio file
    const uploadResponse = await fetch(`${baseUrl}/v2/upload`, {
      method: 'POST',
      headers: headers,
      body: audioBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    return uploadData.upload_url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const transcribeAudio = async (audioUrl) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured');
  }

  const baseUrl = 'https://api.assemblyai.com';
  const headers = {
    authorization: apiKey,
    'Content-Type': 'application/json'
  };

  try {
    // Start transcription
    const data = {
      audio_url: audioUrl,
      speech_model: 'universal',
      punctuate: true,
      format_text: true
    };

    const response = await fetch(`${baseUrl}/v2/transcript`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription request failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result.id;
  } catch (error) {
    console.error('Transcription request error:', error);
    throw error;
  }
};

const pollTranscription = async (transcriptId) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured');
  }

  const baseUrl = 'https://api.assemblyai.com';
  const headers = {
    authorization: apiKey
  };

  const pollingEndpoint = `${baseUrl}/v2/transcript/${transcriptId}`;

  while (true) {
    try {
      const pollingResponse = await fetch(pollingEndpoint, {
        headers: headers
      });

      if (!pollingResponse.ok) {
        const errorText = await pollingResponse.text();
        throw new Error(`Polling failed: ${pollingResponse.status} - ${errorText}`);
      }

      const transcriptionResult = await pollingResponse.json();

      if (transcriptionResult.status === 'completed') {
        return transcriptionResult;
      } else if (transcriptionResult.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      } else {
        // Wait 3 seconds before polling again
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }
};

// WebSocket connection handling for real-time streaming
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  let assemblyAIWs = null;
  let isRecording = false;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_streaming') {
        // Initialize AssemblyAI streaming connection
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'AssemblyAI API key not configured' 
          }));
          return;
        }

        const connectionParams = {
          sample_rate: 16000,
          format_turns: true,
        };
        
        const queryString = new URLSearchParams(connectionParams).toString();
        const wsUrl = `wss://streaming.assemblyai.com/v3/ws?${queryString}`;
        
        assemblyAIWs = new WebSocket(wsUrl, {
          headers: {
            Authorization: apiKey
          }
        });

        assemblyAIWs.on('open', () => {
          console.log('AssemblyAI WebSocket connected');
          isRecording = true;
          ws.send(JSON.stringify({ type: 'streaming_started' }));
        });

        assemblyAIWs.on('message', (assemblyMessage) => {
          try {
            const assemblyData = JSON.parse(assemblyMessage);
            
            if (assemblyData.type === 'Turn' && assemblyData.turn_is_formatted) {
              ws.send(JSON.stringify({
                type: 'transcript_update',
                transcript: assemblyData.transcript
              }));
            }
          } catch (error) {
            console.error('Error parsing AssemblyAI message:', error);
          }
        });

        assemblyAIWs.on('error', (error) => {
          console.error('AssemblyAI WebSocket error:', error);
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: 'Streaming transcription error' 
          }));
        });

        assemblyAIWs.on('close', () => {
          console.log('AssemblyAI WebSocket closed');
          isRecording = false;
        });

      } else if (data.type === 'audio_data') {
        // Forward audio data to AssemblyAI
        if (assemblyAIWs && assemblyAIWs.readyState === WebSocket.OPEN) {
          assemblyAIWs.send(data.audio);
        }
      } else if (data.type === 'stop_streaming') {
        if (assemblyAIWs) {
          assemblyAIWs.close();
          isRecording = false;
          ws.send(JSON.stringify({ type: 'streaming_stopped' }));
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (assemblyAIWs) {
      assemblyAIWs.close();
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Voice Test API is running',
    apiKeyConfigured: !!process.env.ASSEMBLYAI_API_KEY,
    apiKeyLength: process.env.ASSEMBLYAI_API_KEY ? process.env.ASSEMBLYAI_API_KEY.length : 0
  });
});

// Audio upload and transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      console.log('No audio file provided');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Processing audio file:', req.file.filename);
    console.log('API Key configured:', !!process.env.ASSEMBLYAI_API_KEY);
    console.log('Duration from client:', req.body.duration);

    const audioFilePath = req.file.path;
    const duration = req.body.duration ? parseInt(req.body.duration) : 60;
    
    // Read the audio file
    const audioBuffer = fs.readFileSync(audioFilePath);
    console.log('Audio file size:', audioBuffer.length, 'bytes');
    
    // Upload to AssemblyAI
    console.log('Uploading audio to AssemblyAI...');
    const audioUrl = await uploadToAssemblyAI(audioBuffer);
    console.log('Audio uploaded successfully, URL:', audioUrl.substring(0, 50) + '...');

    // Start transcription
    console.log('Starting transcription...');
    const transcriptId = await transcribeAudio(audioUrl);
    console.log('Transcription started, ID:', transcriptId);

    // Poll for results
    console.log('Polling for transcription results...');
    const transcriptionResult = await pollTranscription(transcriptId);
    console.log('Transcription completed');
    console.log('Transcript text:', transcriptionResult.text);

    const transcript = transcriptionResult.text || 'No transcript available';
    
    // Calculate IELTS score
    const ieltsScore = calculateIELTSScore(transcript, duration);
    console.log('IELTS Score calculated:', ieltsScore);

    // Clean up: delete the audio file after transcription
    fs.unlink(audioFilePath, (err) => {
      if (err) {
        console.error('Error deleting audio file:', err);
      }
    });

    const responseData = {
      success: true,
      transcript: transcript,
      confidence: transcriptionResult.confidence,
      words: transcriptionResult.words,
      ieltsScore: ieltsScore,
      duration: duration
    };

    console.log('Sending response to client:', {
      success: responseData.success,
      transcriptLength: responseData.transcript.length,
      hasIeltsScore: !!responseData.ieltsScore
    });

    res.json(responseData);

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file on error:', err);
      });
    }

    res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Voice Test API server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 API Key configured: ${!!process.env.ASSEMBLYAI_API_KEY}`);
  console.log(`🔌 WebSocket server ready for real-time streaming`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
}); 