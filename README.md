# Luxen Skin Analysis Web App

A Flask-based web application for skin analysis and deficiency detection.

## Deployment Instructions

### Deploying to Render.com

1. Create a Render account at https://render.com
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the deployment:
   - Name: luxen-skin-analysis (or your preferred name)
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn finalLuxenv1.0.0.app:app`
   - Plan: Free

### Environment Variables

Set these environment variables in your Render dashboard:
- `SECRET_KEY`: Your Flask secret key
- `FLASK_ENV`: production

### Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python finalLuxenv1.0.0/app.py
```

## Project Structure

```
finalLuxenv1.0.0/
├── app.py              # Main application file
├── templates/          # HTML templates
├── static/            # Static files (CSS, JS, images)
└── models/            # ML models
```

## Features

- Real-time skin analysis
- Deficiency detection
- Progress tracking
- User authentication
- Historical data visualization 