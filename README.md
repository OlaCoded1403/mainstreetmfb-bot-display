# Mainstreet MFB Bot Display

Mainstreet MFB Bot Display is a FastAPI chatbot service with a compact browser widget for Mainstreet Microfinance Bank customer support. It retrieves relevant content from local text files, sends that context to Groq, and returns an answer through a `/chat` API.

## What It Contains

- `app.py` - FastAPI app, static file serving, CORS setup, and `/chat` endpoint.
- `data/` - source knowledge files used by the bot.
- `ingest.py` - reads `data/*.txt`, chunks the content, embeds it, and stores it in ChromaDB.
- `embeddings.py` - loads the `all-MiniLM-L6-v2` sentence-transformer model.
- `vector_store.py` - creates and queries the local ChromaDB collection.
- `llm.py` - calls Groq using `llama-3.3-70b-versatile`.
- `static/index.html` - hosted demo widget shown at `/`.
- `static/script.js` and `static/style.css` - demo widget behavior and styles.
- `static/mainstreetmfb-sdk.js` - embeddable website SDK that adds a floating chat action button.

## How It Works

1. Put bank FAQ or support content in `.txt` files inside `data/`.
2. Run `ingest.py`.
3. The ingestion script splits each text file into overlapping chunks.
4. `sentence-transformers` converts each chunk into embeddings.
5. ChromaDB stores those embeddings locally in `chroma_db/`.
6. When a user sends a question to `/chat`, the app embeds the question and searches ChromaDB for the closest chunks.
7. The matched chunks are sent to Groq with a system prompt that tells the model to answer only from the provided context.
8. The answer is returned as JSON and rendered in the widget.

## Requirements

- Python 3.13 or newer, matching `pyproject.toml`.
- A Groq API key.
- Internet access the first time dependencies and the embedding model are downloaded.

## Setup

Create a virtual environment:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Build the local vector database:

```powershell
python ingest.py
```

Run the app:

```powershell
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Open:

```text
http://127.0.0.1:8000
```

## API

### `POST /chat`

Request:

```json
{
  "question": "How do I open an account?"
}
```

Response:

```json
{
  "answer": "..."
}
```

## Website SDK

The SDK lets any website add the Mainstreet MFB assistant as a floating action button. Host this FastAPI app first, then add the SDK script to the target website.

Basic embed:

```html
<script src="https://your-bot-domain.example/static/mainstreetmfb-sdk.js"></script>
```

Configured embed:

```html
<script>
  window.MainstreetMFBConfig = {
    apiBaseUrl: "https://your-bot-domain.example",
    title: "Mainstreet MFB",
    subtitle: "Assistant",
    buttonLabel: "Chat",
    accentColor: "#0f766e",
    position: "right"
  };
</script>
<script src="https://your-bot-domain.example/static/mainstreetmfb-sdk.js"></script>
```

Configuration options:

| Option | Default | Description |
| --- | --- | --- |
| `apiBaseUrl` | SDK script origin | Base URL of this FastAPI app. |
| `title` | `Mainstreet MFB` | Small header label in the chat panel. |
| `subtitle` | `Assistant` | Main header text in the chat panel. |
| `buttonLabel` | `Chat` | Text shown on the floating action button. |
| `accentColor` | `#0f766e` | Primary color for the header, button, and user bubbles. |
| `position` | `right` | Button position. Use `right` or `left`. |

The app enables CORS for `/chat`, so the SDK can call the API from another website. For production, replace the wildcard CORS setting in `app.py` with the approved website domains.

## Updating The Knowledge Base

1. Edit or add `.txt` files in `data/`.
2. Run `python ingest.py`.
3. Restart the FastAPI server if it is already running.

`ingest.py` clears the existing ChromaDB collection before storing new chunks, so each run reflects the current files in `data/`.

## Troubleshooting

- `GROQ_API_KEY` errors: confirm `.env` exists and the key is valid.
- Slow first question: the embedding model is loaded lazily on the first `/chat` request.
- Empty or weak answers: confirm `python ingest.py` has been run and the answer exists in the files under `data/`.
- Browser CORS errors: make sure the SDK `apiBaseUrl` points to this FastAPI app and that CORS origins in `app.py` allow the website domain.
