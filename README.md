# CONVERGER — All In One Ultimate Workspace

A lightweight browser UI with a Python local-processing server. The interface is `index.html`; processing routes are in `server.py`.

## Run locally

Requires Python 3.10+ and Tesseract OCR (English language data). Install the Python dependencies and start the server:

```bash
python -m pip install -r requirements.txt
python server.py
```

Then open http://localhost:8000. The current workspace preview runs on port 8000.

On Debian/Ubuntu, install OCR support with:

```bash
sudo apt-get install tesseract-ocr tesseract-ocr-eng
```

Files are processed by the local Python server. Some conversions are best-effort and may not preserve original page layout. Translation and true PDF/A conversion require additional configured services/engines; AI summarization is extractive/local.
