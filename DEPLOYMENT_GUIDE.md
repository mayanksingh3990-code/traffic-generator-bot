# 🚀 Quick Deployment Guide

## Deploy to Render.com (Free, 5 Minutes)

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `traffic-generator`
4. Click "Create repository"

### Step 2: Upload Your Code

**Option A: Using GitHub Desktop (Easier)**

1. Download GitHub Desktop
2. Clone your new repository
3. Copy all files from `Traffic generator` folder into the cloned folder
4. Commit and push

**Option B: Using Git Command Line**

```bash
cd "C:\Users\DELL\Desktop\Traffic generator"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/traffic-generator.git
git push -u origin main
```

### Step 3: Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Click "New +" → "Web Service"
5. Click "Connect" next to your `traffic-generator` repository
6. Fill in:
   - **Name**: `traffic-generator`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
7. Click "Create Web Service"

### Step 4: Wait for Deployment (2-3 minutes)

- Render will install dependencies and start your server
- You'll see logs in real-time
- When you see "Live" badge, it's ready!

### Step 5: Get Your URL

- Your URL will be: `https://traffic-generator-xxxx.onrender.com`
- Click on it to open your dashboard
- **Share this URL with friends!**

## For Your Friends to Use

### Option 1: Just Use the Dashboard (Easiest)

- Share the Render URL: `https://traffic-generator-xxxx.onrender.com`
- They can configure traffic from the web interface
- **BUT**: Traffic will come from Render's IP (only 1 IP)

### Option 2: Run Bot on Their Computer (Multiple IPs)

1. Share your GitHub repository with them
2. They download `bot.js`
3. They edit line 2 in `bot.js`:
   ```javascript
   const C_AND_C_SERVER_URL = "https://traffic-generator-xxxx.onrender.com";
   ```
4. They install Node.js
5. They run:
   ```bash
   npm install puppeteer axios
   node bot.js
   ```
6. **Each friend = Different IP!**

## Important Notes

⚠️ **Render Free Tier Limitations:**

- Server sleeps after 15 minutes of inactivity
- Wakes up when someone visits (takes 30 seconds)
- 750 hours/month free (enough for 24/7 if only one service)

✅ **To Keep It Running 24/7:**

- Use a free uptime monitor like [UptimeRobot](https://uptimerobot.com)
- Ping your Render URL every 10 minutes
- This keeps the server awake

## Troubleshooting

**Server not starting?**

- Check Render logs for errors
- Make sure all files are uploaded to GitHub

**Can't access the URL?**

- Wait 2-3 minutes after deployment
- Check if status shows "Live"

**Bot can't connect?**

- Make sure you updated the URL in `bot.js`
- Use the full Render URL (not localhost)

## Next Steps

1. Deploy to Render
2. Share URL with friends
3. They run bots on their computers
4. Each friend = different IP = more traffic!

**Need help?** Check the Render logs or ask for assistance!
