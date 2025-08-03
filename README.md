# 🎤 IELTS Speaking Practice with AI

A comprehensive web application for practicing IELTS speaking tests with real-time speech-to-text transcription and AI-powered scoring.

## ✨ Features

### 🎯 IELTS-Style Scoring
- **Fluency**: Based on speaking rate and flow
- **Pronunciation**: Speech clarity assessment  
- **Grammar**: Sentence structure analysis
- **Vocabulary**: Word diversity and complexity
- **Overall Score**: Combined assessment (1-9 band)

### 🎙️ Two Recording Modes
1. **Record & Process**: Traditional recording with post-processing
2. **Live Stream**: Real-time transcription with live feedback

### 📊 Detailed Analytics
- Speaking rate (words per minute)
- Vocabulary diversity percentage
- Total word count
- Speaking duration
- Confidence scores

### 💾 History & Progress
- Save previous recordings
- Track improvement over time
- Export results

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- AssemblyAI API key

### Installation

#### Option 1: Automated Setup (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd voice-demo

# Run the setup script
node setup.js
# OR on Windows: setup.bat
```

#### Option 2: Manual Setup
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voice-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   ```

3. **Set up AssemblyAI API**
   - Get your API key from [AssemblyAI Console](https://www.assemblyai.com/app/account)
   - Copy `env.example` to `.env`
   - Add your API key to `.env`

4. **Start the application**
   ```bash
   npm run dev
   ```

5. **Access the app**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# AssemblyAI API Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
CORS_ORIGIN=http://localhost:3000
```

### Getting AssemblyAI API Key
1. Go to [AssemblyAI Console](https://www.assemblyai.com/app/account)
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Add it to your `.env` file

## 🎮 Usage

### Recording Modes

#### 1. Record & Process
- Click "Record & Process" button
- Speak your response
- Click "Stop Recording" when done
- Wait for processing and scoring

#### 2. Live Stream
- Click "Live Stream" button
- Speak your response
- See real-time transcription
- Click "Stop Streaming" when done

### Understanding Your Score

| Band | Level | Description |
|------|-------|-------------|
| 9 | Expert | Fluent, accurate, sophisticated |
| 8 | Very Good | Fluent with minor errors |
| 7 | Good | Generally fluent, some errors |
| 6 | Competent | Effective communication |
| 5 | Modest | Basic communication |
| 4 | Limited | Limited communication |

## 🏗️ Architecture

### Frontend (React)
- **VoiceTest.jsx**: Main component with recording logic
- **UI Components**: Tailwind CSS with shadcn/ui
- **WebSocket**: Real-time streaming support
- **Local Storage**: History management

### Backend (Express.js)
- **File Upload**: Multer for audio processing
- **AssemblyAI Integration**: Speech-to-text API
- **WebSocket Server**: Real-time streaming
- **IELTS Scoring**: Custom algorithm

### API Endpoints
- `GET /api/health` - Health check
- `POST /api/transcribe` - Audio transcription
- `WebSocket /` - Real-time streaming

## 🔍 Troubleshooting

### Common Issues

#### "AssemblyAI API error: 400"
- ✅ Check your API key is correct
- ✅ Ensure you have sufficient credits
- ✅ Verify the key is in `.env` file

#### "Failed to access microphone"
- ✅ Allow microphone permissions
- ✅ Check if another app is using mic
- ✅ Try refreshing the page

#### "WebSocket connection error"
- ✅ Ensure server is running on port 3001
- ✅ Check firewall settings
- ✅ Try the "Record & Process" mode instead

#### "No audio file provided"
- ✅ Record for at least a few seconds
- ✅ Check browser compatibility
- ✅ Try a different browser

### Demo Mode
The app works without an API key in demo mode:
- Simulated transcription
- Demo scoring
- Perfect for testing

## 📁 Project Structure

```
voice demo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceTest.jsx    # Main component
│   │   │   └── ui/              # UI components
│   │   └── lib/
│   │       └── utils.js         # Utility functions
│   └── package.json
├── server/                 # Express backend
│   ├── index.js           # Main server file
│   └── uploads/           # Temporary audio files
├── .env                   # Environment variables
├── package.json           # Root dependencies
└── README.md             # This file
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start both frontend and backend
npm run server       # Start backend only
npm run client       # Start frontend only
npm run build        # Build for production
npm run install-all  # Install all dependencies
```

### Adding New Features
1. **New Scoring Metrics**: Modify `calculateIELTSScore()` in `server/index.js`
2. **UI Components**: Add to `client/src/components/ui/`
3. **API Endpoints**: Add to `server/index.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [AssemblyAI](https://www.assemblyai.com/) for speech-to-text API
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for UI components
- [Lucide Icons](https://lucide.dev/) for icons

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the console logs
3. Ensure all dependencies are installed
4. Verify your API key is correct

## 📦 Sharing & Deployment

### For Partners/Demo
- See `SETUP.md` for detailed setup instructions
- Use `setup.js` or `setup.bat` for automated installation
- The app works in demo mode without an API key

### For GitHub Repository
- See `DEPLOYMENT.md` for GitHub setup guide
- Ensure `.env` file is excluded (contains sensitive API keys)
- All source code is ready for upload

### Quick Share Options
1. **GitHub Repository**: Make public or add collaborators
2. **ZIP File**: Create archive excluding `node_modules` and `.env`
3. **GitHub Release**: Upload as release asset

---

**Happy practicing! 🎤✨** 