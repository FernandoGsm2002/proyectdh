FROM python:3.11-slim

# Chromium system dependencies for Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget curl gnupg ca-certificates \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0 libgtk-3-0 \
    fonts-liberation libappindicator3-1 xdg-utils \
    xvfb x11-xkb-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Install Playwright browsers (Chromium only)
RUN playwright install chromium && playwright install-deps chromium

COPY api.py .
COPY main.py .

EXPOSE 8098
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8098"]
