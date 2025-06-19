from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import requests, io, re, urllib3, pdfplumber
from googlesearch import search
import google.generativeai as genai

genai.configure(api_key="AIzaSyBWlOysRamwIuYOC7JWdN32s2ztFTPUbsw")
model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def download_pdf(url):
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers, verify=False)
    response.raise_for_status()
    return response.content

def extract_units_only(pdf_content, subject_code, subject_name):
    text = ""
    with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                text += "\n" + txt
    text = re.sub(r'\s+', ' ', text)
    subject_line_pattern = rf"{subject_code}\s+{re.escape(subject_name)}\s+L\s+T\s+P\s+C\s+\d\s+\d\s+\d\s+\d"
    subject_match = re.search(subject_line_pattern, text, re.IGNORECASE)
    if not subject_match:
        return "❌ Couldn't find subject heading with LTPC format."
    unit_start = re.search(r"UNIT\s+I", text[subject_match.start():], re.IGNORECASE)
    if not unit_start:
        return "❌ Couldn't find 'UNIT I' after subject heading."
    unit_start_idx = subject_match.start() + unit_start.start()
    end_match = re.search(r"(OUTCOMES|TEXT BOOKS|REFERENCES|TOTAL\s*:\s*\d+\s*PERIODS)", text[unit_start_idx:], re.IGNORECASE)
    end_idx = unit_start_idx + end_match.start() if end_match else len(text)
    units_text = text[unit_start_idx:end_idx]
    units_text = re.sub(r"(UNIT\s+[IVX]+)", r"\n\n\1", units_text)
    return units_text.strip()

def fetch_units(subject_code, subject_name, regulation):
    query = f"{subject_code} {subject_name} syllabus {regulation} site:annauniv.edu filetype:pdf"
    for url in list(search(query))[:10]:
        if url.lower().endswith(".pdf"):
            try:
                pdf_data = download_pdf(url)
                syllabus = extract_units_only(pdf_data, subject_code, subject_name)
                return syllabus
            except Exception:
                continue
    return "❌ No valid syllabus PDF found."

def generate_questions_with_gemini(syllabus, config):
    prompt = f"""You're a university question paper generator.
Subject: {config['subjectCode']} - {config['subjectName']}
Syllabus:\n{syllabus}\n
Sections:\n"""

    for section in config["sections"]:
        prompt += f"\n{section['name']}:\n"
        prompt += f"Generate {section['numQuestions']} {section['difficulty']} level questions "
        prompt += f"from {', '.join(section['units']).replace('unit', 'UNIT ')} "
        prompt += f"each carrying {section['marksPerQuestion']} marks.\n"

    prompt += "\nReturn in a neat plain format."

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"❌ Gemini Error: {str(e)}"

@api_view(["POST"])
def generate_questions(request):
    try:
        data = request.data
        syllabus = fetch_units(data["subjectCode"], data["subjectName"], data.get("regulation", "R2017"))
        questions = generate_questions_with_gemini(syllabus, data)
        return Response({"syllabus": syllabus, "questions": questions})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
