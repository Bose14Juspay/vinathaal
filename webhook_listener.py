from fastapi import FastAPI, Request
import subprocess

app = FastAPI()

@app.post("/webhook")
async def webhook(request: Request):
    payload = await request.json()
    # Optional: Validate repo or branch from payload
    subprocess.run(["git", "pull"], cwd="/home/ubuntu/paper-ai-genesis")  # Your repo path
    subprocess.run(["systemctl", "restart", "uvicorn"])  # Or reload your app if systemd is used
    return {"status": "updated"}
