# 🚀 Project Setup Guide

## For Your Partner (Demo Setup)

### Quick Start Instructions

1. **Clone/Download the Project**
   ```bash
   # If using git
   git clone <repository-url>
   cd voice-demo
   
   # Or download and extract the ZIP file
   ```

2. **Install Dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client
   npm install
   cd ..
   ```

3. **Set Up Environment Variables**
   ```bash
   # Copy the example environment file
   cp env.example .env
   
   # Edit the .env file and add your AssemblyAI API key
   # You can get a free API key from: https://www.assemblyai.com/app/account
   ```

4. **Start the Application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   # Terminal 1: npm run server
   # Terminal 2: npm run client
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 🔑 Getting AssemblyAI API Key

1. Go to [AssemblyAI Console](https://www.assemblyai.com/app/account)
2. Sign up for a free account
3. Navigate to your account dashboard
4. Copy your API key
5. Replace `your_assemblyai_api_key_here` in the `.env` file with your actual API key

## 📁 Files to Include When Sharing

### Required Files:
- ✅ All source code files
- ✅ `package.json` (root and client)
- ✅ `env.example`
- ✅ `README.md`
- ✅ `SETUP.md` (this file)

### Files to Exclude:
- ❌ `node_modules/` (will be installed)
- ❌ `.env` (contains sensitive API keys)
- ❌ `.git/` (if using git)
- ❌ `uploads/` (temporary files)

## 🐛 Troubleshooting

### Common Issues:

**"Module not found" errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
cd client
rm -rf node_modules package-lock.json
npm install
cd ..
```

**"AssemblyAI API error":**
- Check your API key is correct in `.env`
- Ensure you have sufficient credits
- Verify the key format

**"Port already in use":**
```bash
# Kill processes on ports 3000 and 3001
npx kill-port 3000 3001
```

**"Microphone access denied":**
- Allow microphone permissions in browser
- Check if another app is using the microphone
- Try refreshing the page

## 🎯 Demo Mode

The application works without an API key in demo mode:
- Simulated transcription
- Demo scoring
- Perfect for testing the interface

## 📦 For GitHub Repository

### Files to Include:
```
voice-demo/
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── tailwind.config.js
├── server/
│   └── index.js
├── package.json
├── README.md
├── SETUP.md
├── env.example
└── .gitignore
```

### .gitignore Contents:
```
# Dependencies
node_modules/
*/node_modules/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
build/
dist/
*/build/
*/dist/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
uploads/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

## 🚀 Deployment Options

### Local Development
```bash
npm run dev
```

### Production Build
```bash
# Build the client
cd client
npm run build
cd ..

# Start production server
npm run server
```

### Docker (Optional)
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 3001
CMD ["npm", "run", "server"]
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Ensure all dependencies are installed
4. Verify your API key is correct
5. Try the demo mode first

---

**Happy Demo! 🎤✨** 