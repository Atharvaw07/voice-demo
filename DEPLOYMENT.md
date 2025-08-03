# 🚀 GitHub Repository Setup & Deployment Guide

## 📋 Pre-Upload Checklist

### ✅ Files to Include in Repository
```
voice-demo/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceTest.jsx
│   │   │   └── ui/
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── server/
│   └── index.js
├── package.json
├── README.md
├── SETUP.md
├── DEPLOYMENT.md
├── env.example
├── setup.js
└── .gitignore
```

### ❌ Files to Exclude
- `node_modules/` (both root and client)
- `.env` (contains sensitive API keys)
- `server/uploads/` (temporary files)
- `.git/` (if already a git repository)

## 🔧 GitHub Repository Setup

### 1. Initialize Git Repository
```bash
# If not already a git repository
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Voice Demo with AssemblyAI integration"

# Add remote repository (replace with your GitHub repo URL)
git remote add origin https://github.com/yourusername/voice-demo.git

# Push to GitHub
git push -u origin main
```

### 2. Repository Settings
1. Go to your GitHub repository settings
2. Enable GitHub Pages (optional for demo)
3. Add repository description
4. Add topics: `voice`, `assemblyai`, `speech`, `ielts`, `react`, `nodejs`

## 📦 Sharing with Partner

### Option 1: GitHub Repository
1. Make repository public or add partner as collaborator
2. Share the repository URL
3. Partner can clone: `git clone https://github.com/yourusername/voice-demo.git`

### Option 2: ZIP File
1. Create a ZIP file excluding sensitive files:
   ```bash
   # On Windows
   powershell Compress-Archive -Path "client,server,*.json,*.md,env.example,setup.js,.gitignore" -DestinationPath "voice-demo.zip"
   
   # On Mac/Linux
   zip -r voice-demo.zip . -x "node_modules/*" ".env" ".git/*" "server/uploads/*"
   ```

### Option 3: GitHub Release
1. Create a new release on GitHub
2. Upload the ZIP file as a release asset
3. Share the release URL

## 🎯 Partner Setup Instructions

### Quick Start for Partner
```bash
# 1. Clone or download the project
git clone https://github.com/yourusername/voice-demo.git
cd voice-demo

# 2. Run the setup script
node setup.js

# 3. Add API key to .env file
# Edit .env and replace 'your_assemblyai_api_key_here' with actual key

# 4. Start the application
npm run dev

# 5. Open http://localhost:3000
```

### Manual Setup (if setup script fails)
```bash
# Install dependencies
npm install
cd client && npm install && cd ..

# Create .env file
cp env.example .env

# Edit .env and add your AssemblyAI API key
# Get free API key from: https://www.assemblyai.com/app/account

# Start application
npm run dev
```

## 🔑 AssemblyAI API Key Setup

### For Your Partner:
1. Go to [AssemblyAI Console](https://www.assemblyai.com/app/account)
2. Sign up for a free account
3. Copy your API key from the dashboard
4. Replace `your_assemblyai_api_key_here` in the `.env` file

### Free Tier Limits:
- 5 hours of audio processing per month
- Perfect for demos and testing
- No credit card required

## 🚀 Demo Mode

The application works without an API key:
- Simulated transcription
- Demo scoring
- Perfect for interface testing

## 📱 Demo Instructions for Partner

### What to Show:
1. **Interface Demo**: Show the clean, modern UI
2. **Recording Modes**: Demonstrate both "Record & Process" and "Live Stream"
3. **Scoring System**: Explain the IELTS-style scoring
4. **Real-time Features**: Show live transcription
5. **History**: Demonstrate saved recordings

### Demo Script:
```
"Welcome to our IELTS Speaking Practice app! 

This app uses AssemblyAI's advanced speech recognition to:
- Transcribe speech in real-time
- Provide IELTS-style scoring
- Track speaking metrics

Let me show you the two recording modes..."

[Demo the interface and features]
```

## 🐛 Common Issues & Solutions

### For Partner:
- **"Module not found"**: Run `npm install` in both root and client directories
- **"Port in use"**: Kill processes on ports 3000/3001 or change ports in .env
- **"API errors"**: Check API key in .env file
- **"Microphone access"**: Allow browser permissions

### For You (Repository Owner):
- **Large file size**: Ensure .gitignore excludes node_modules
- **Sensitive data**: Double-check .env is not included
- **Broken links**: Test all URLs in README.md

## 📊 Repository Analytics

### Add to README.md:
```markdown
## 📈 Project Stats
![GitHub stars](https://img.shields.io/github/stars/yourusername/voice-demo)
![GitHub forks](https://img.shields.io/github/forks/yourusername/voice-demo)
![GitHub issues](https://img.shields.io/github/issues/yourusername/voice-demo)
```

## 🎉 Success Checklist

- [ ] Repository is public or partner has access
- [ ] All source code is included
- [ ] .env file is excluded (sensitive data)
- [ ] README.md has clear instructions
- [ ] SETUP.md has detailed setup guide
- [ ] Partner can run the application
- [ ] Demo works as expected
- [ ] API key setup instructions are clear

---

**Ready for Demo! 🎤✨** 