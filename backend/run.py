"""Run the FastAPI server with Uvicorn."""
import sys
sys.path.insert(0, '.')
import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=4000, reload=True)
