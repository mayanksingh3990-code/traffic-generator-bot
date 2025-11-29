# Traffic Generator

A web-based traffic generator with bot automation.

## Deployment to Render.com

### Step 1: Prepare Your Code

1. Create a GitHub account if you don't have one
2. Create a new repository
3. Upload all files from this folder

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: traffic-generator (or any name)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
6. Click "Create Web Service"

### Step 3: Get Your URL

- After deployment, you'll get a URL like: `https://traffic-generator-xxxx.onrender.com`
- Share this URL with your friends
- They can access the dashboard and configure traffic

### Step 4: For Friends to Run Bots

Friends need to:

1. Install Node.js on their computer
2. Download `bot.js` from your repository
3. Edit line 2 in `bot.js`: Change `http://127.0.0.1:3000` to your Render URL
4. Run: `npm install puppeteer axios`
5. Run: `node bot.js`

Each friend running the bot = different IP address!

## Local Development

```bash
npm install
node server.js
# In another terminal:
node bot.js
```

Open http://localhost:3000 in your browser.
