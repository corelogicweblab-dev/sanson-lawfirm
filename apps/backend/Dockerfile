FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PORT=8100
EXPOSE 8100

RUN chmod +x start.sh

# Render sets PORT (often 10000); start.sh reads ${PORT}
CMD ["./start.sh"]
