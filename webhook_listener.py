from fastapi import FastAPI, Request
import subprocess

app = FastAPI()

@app.post("/webhook")
async def github_webhook(request: Request):
    payload = await request.json()

    try:
        subprocess.run(["git", "pull"], cwd="/home/ubuntu/paper-ai-genesis", check=True)
        return {"status": "success", "message": "Pulled latest code"}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "message": str(e)}
