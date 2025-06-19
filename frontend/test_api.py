import requests
import json

# Change this to your live domain or local server
url = "https://vinathaal-ai.azhizen.com/generate-questions"

# Minimal test payload
payload = {
    "subjectCode": "CS8493",
    "subjectName": "Operating Systems",
    "regulation": "R2017",
    "sections": []
}

try:
    response = requests.post(url, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        print("✅ API is working")
        print("Response:\n", json.dumps(response.json(), indent=2))
    else:
        print("❌ API responded with error")
        print(response.text)

except requests.exceptions.RequestException as e:
    print("❌ Request failed:", str(e))
