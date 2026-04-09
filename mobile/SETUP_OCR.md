# Google Cloud Vision API Setup Guide

This guide walks you through setting up the OCR functionality for the Paper Order Scanning feature.

## Step 1: Get Your Google Cloud Vision API Key

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `GroOne-OCR`
4. Click **"Create"**
5. Wait for the project to be created (you'll see a notification)

### 1.2 Enable Cloud Vision API

1. Go to [Cloud Vision API Library](https://console.cloud.google.com/apis/library/vision.googleapis.com)
2. Make sure your project is selected in the top dropdown
3. Click **"Enable"**
4. Wait for the API to be enabled

### 1.3 Create API Credentials

1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **"Create Credentials"** → **"API Key"**
3. Copy the API key that appears (it looks like: `AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)
4. **IMPORTANT**: Keep this key secret!

### 1.4 Restrict API Key (Recommended for Security)

1. Click on the newly created API key
2. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Check only **"Cloud Vision API"**
3. Under **"Application restrictions"** (optional):
   - You can add IP restrictions or leave unrestricted for development
4. Click **"Save"**

---

## Step 2: Configure in Your App

### 2.1 Add API Key to .env File

1. Open `mobile/.env` file (already created)
2. Replace `YOUR_API_KEY_HERE` with your actual API key:

```env
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Save the file

### 2.2 Keep .env Secure

Make sure `.env` is in your `.gitignore`:

```bash
# Check if .env is ignored
git check-ignore mobile/.env

# If not, add it to .gitignore
echo "mobile/.env" >> .gitignore
```

---

## Step 3: Restart the App

After configuring the API key, you **must restart** the Expo development server:

```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd mobile
npx expo start --clear
```

---

## Step 4: Verify Configuration

### 4.1 Check API Key is Loaded

You can verify the API key is loaded by adding a console log temporarily:

```typescript
// In CameraCaptureScreen.tsx (line ~35)
console.log('API Key loaded:', GOOGLE_VISION_API_KEY ? 'Yes ✓' : 'No ✗');
```

### 4.2 Test the Scanning Feature

1. Open the app on your emulator/device
2. Navigate to the Picking Screen
3. Tap the **📷 Camera button** in the header
4. Capture or select an image
5. OCR should process the image

---

## Troubleshooting

### Error: "API key is required"

**Problem**: The app cannot find the API key.

**Solution**:
1. Check that `.env` file exists in `mobile/` directory
2. Verify the API key is set correctly without quotes:
   ```env
   GOOGLE_CLOUD_VISION_API_KEY=AIzaSyD...
   ```
3. Restart Expo server with `--clear` flag:
   ```bash
   npx expo start --clear
   ```

### Error: "API request failed: 403"

**Problem**: API key doesn't have permission to use Cloud Vision API.

**Solution**:
1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "API restrictions", ensure "Cloud Vision API" is selected
4. If the API is not in the list, go back to [Enable Cloud Vision API](https://console.cloud.google.com/apis/library/vision.googleapis.com)

### Error: "API request failed: 400"

**Problem**: Invalid API key format or request.

**Solution**:
1. Verify your API key is correct (no extra spaces or quotes)
2. Make sure you copied the entire key
3. Try creating a new API key

### No text detected in image

**Problem**: OCR successfully ran but didn't detect any text.

**Possible causes**:
1. Image quality is too low
2. Text is too small or blurry
3. Handwriting is very unclear
4. Image doesn't contain text

**Solution**:
- Use better lighting
- Hold camera steady
- Ensure paper is flat and clearly visible
- Try with printed text first to verify OCR is working

---

## API Usage & Costs

### Free Tier
Google Cloud Vision API offers:
- **1,000 free requests per month**
- Perfect for development and testing

### Pricing After Free Tier
- $1.50 per 1,000 images for DOCUMENT_TEXT_DETECTION

### Monitor Usage
Track your API usage at:
https://console.cloud.google.com/apis/api/vision.googleapis.com/metrics

---

## Security Best Practices

### ✅ DO:
- Keep your API key in `.env` file
- Add `.env` to `.gitignore`
- Restrict API key to only Cloud Vision API
- Use different API keys for dev/production

### ❌ DON'T:
- Commit API keys to Git
- Share API keys in public repositories
- Use the same API key across multiple projects
- Leave API key unrestricted

---

## Alternative: On-Device OCR (No API Key Required)

If you want to avoid using Google Cloud Vision API, you can implement on-device OCR using:
- **ML Kit Vision** (Google's on-device ML)
- **Tesseract.js** (Open source OCR)

Note: On-device OCR has lower accuracy for handwritten text, especially in Telugu.

---

## Need Help?

- Google Cloud Vision Docs: https://cloud.google.com/vision/docs
- Expo Camera Docs: https://docs.expo.dev/versions/latest/sdk/camera/
- Report Issues: Create an issue in the project repository
