import json
import logging
import re
import io
import requests
import pdfplumber
import urllib3
from googlesearch import search

from rest_framework.decorators import api_view
from rest_framework.response import Response

import google.generativeai as genai

# Setup Gemini
genai.configure(api_key="AIzaSyBWlOysRamwIuYOC7JWdN32s2ztFTPUbsw")  # Replace with your actual key
model = genai.GenerativeModel(model_name="models/gemini-1.5-pro")

# Logger setup
logger = logging.getLogger(__name__)

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
    pattern = rf"{subject_code}\s+{re.escape(subject_name)}\s+L\s+T\s+P\s+C\s+\d\s+\d\s+\d\s+\d"
    match = re.search(pattern, text, re.IGNORECASE)
    if not match:
        return None
    unit_start = re.search(r"UNIT\s+I", text[match.start():], re.IGNORECASE)
    if not unit_start:
        return None
    unit_start_idx = match.start() + unit_start.start()
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
                print("📝 Extracted Syllabus:\n", syllabus)
                if syllabus:
                    return syllabus
            except Exception as e:
                logger.warning(f"Failed to extract syllabus from {url}: {e}")
    return None


def split_units(syllabus_text):
    unit_matches = re.finditer(
        r"(UNIT\s+(X|IX|VIII|VII|VI|V|IV|III|II|I)[^\n]*)\s+(.*?)(?=(UNIT\s+(X|IX|VIII|VII|VI|V|IV|III|II|I)|$))", 
        syllabus_text, re.IGNORECASE | re.DOTALL
    )
    
    unit_dict = {}
    for match in unit_matches:
        title = match.group(1).strip()  # e.g., "UNIT IV FILE SYSTEMS AND I/O SYSTEMS 9"
        body = match.group(3).strip()
        key = normalize_unit_key(title)
        unit_dict[key] = body

    return unit_dict


def normalize_unit_key(unit_title):
    roman_to_digit = {
        "I": "1", "II": "2", "III": "3", "IV": "4", "V": "5",
        "VI": "6", "VII": "7", "VIII": "8", "IX": "9", "X": "10"
    }
    match = re.search(r"UNIT\s+(X|IX|VIII|VII|VI|V|IV|III|II|I)", unit_title.upper())
    if match:
        roman = match.group(1)
        digit = roman_to_digit.get(roman)
        return f"unit{digit}"
    return unit_title.lower().replace(" ", "")


def generate_questions_gemini(subject_code, subject_name, unit_title, unit_content, num_questions=5, marks=2, difficulty="easy"):
    complexity = {
        "easy": "definition or concept-based question",
        "medium": "application-based question with brief explanation",
        "hard": "analytical or scenario-based question"
    }.get(difficulty.lower(), "conceptual question")

    length_hint = {
        2: "one-line answer",
        5: "one and half-line answer",
        10: "two-line answer",
        13: "two-line answer",
        15: "three-line answer",
        16: "three-line answer",
    }.get(marks, "brief answer")

    prompt = f"""
You are an AI question generator for a university subject titled "{unit_title}" under the course "{subject_code} - {subject_name}".

Based only on the syllabus content provided below, generate exactly {num_questions} UNIQUE exam questions that are:
- {complexity}
- Appropriate for a {marks}-mark question
- Around {length_hint} in size
- Not repetitive
- Technically accurate and on-topic

Syllabus Content:
{unit_content}

### Output Format:
Return the questions in a numbered list (1. ..., 2. ..., etc.). DO NOT include answers or extra explanation.
Only return the questions.
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"❌ Error: {str(e)}"


@api_view(['POST'])
def generate_questions(request):
    try:
        body = json.loads(request.body)
        subject_code = body.get("subjectCode", "")
        subject_name = body.get("subjectName", "")
        regulation = body.get("regulation", "R2017")
        sections = body.get("sections", [])

        if not subject_code or not subject_name or not sections:
            return Response({"error": "Missing subject code, name, or sections"}, status=400)

        # Step 1: Fetch syllabus
        syllabus = fetch_units(subject_code, subject_name, regulation)
        if not syllabus:
            return Response({"error": "Syllabus not found."}, status=404)

        # Step 2: Extract units from syllabus
        unit_mapping = split_units(syllabus)

        all_questions = []

        # Step 3: Generate for each section
        for section in sections:
            unit_ids = section.get("units", [])
            num_questions = int(section.get("numQuestions", 5))
            marks = int(section.get("marksPerQuestion", 2))
            difficulty = section.get("difficulty", "easy")

            # Filter units present in syllabus
            selected_units = [
                (title, unit_mapping[title])
                for title in unit_mapping
                if normalize_unit_key(title) in unit_ids
            ]
            print("Normalized:", [normalize_unit_key(title) for title in unit_mapping.keys()])
            print("Selected:", unit_ids)

            if not selected_units:
                continue

            # Distribute questions approximately across units
            questions_per_unit = max(1, num_questions // len(selected_units))
            remaining = num_questions

            for i, (unit_title, unit_content) in enumerate(selected_units):
                # Last unit gets remaining questions
                if i == len(selected_units) - 1:
                    q_count = remaining
                else:
                    q_count = min(questions_per_unit, remaining)
                remaining -= q_count

                # Gemini generate call
                questions_text = generate_questions_gemini(subject_code, subject_name, unit_title, unit_content, q_count, marks, difficulty)

                lines = [q.strip() for q in questions_text.split("\n") if re.match(r"^\d+[\.\)]\s*", q.strip())]
                parsed_questions = []
                for q in lines:
                    cleaned = re.sub(r"^\d+[\.\)]\s*", "", q)
                    if cleaned:
                        parsed_questions.append(cleaned)
                    if len(parsed_questions) == q_count:
                        break

                for question in parsed_questions:
                    all_questions.append({
                        "text": question,
                        "unit": normalize_unit_key(unit_title),
                        "marks": marks
                    })

        return Response({"questions": all_questions})

    except Exception as e:
        logger.error("❌ Exception: %s", str(e))
        return Response({"error": str(e)}, status=500)
