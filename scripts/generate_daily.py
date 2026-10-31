#!/usr/bin/env python3
"""
Daily IB MYP Writing Prompt Generator
Generates 2 new daily prompts using Gemini API (gemini-3.8-flash).
Appends to data/prompts.json and tracks progression from Day 1 onward.
"""

import os
import sys
import json
import urllib.request
import urllib.error
import time
from datetime import datetime, timezone
import argparse

MODEL_NAME = "gemini-3.8-flash"
API_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"

DATA_FILE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "prompts.json")

SUBJECT_COMBOS = [
    ("Humanities", "Sciences"),
    ("Sciences", "Design"),
    ("Design", "Humanities"),
    ("Humanities", "Personal Project"),
    ("Sciences", "Personal Project"),
    ("Design", "Sciences")
]

COMMAND_TERMS_INFO = {
    "Analyze": "Break down in order to bring out the essential elements or structure. (To identify parts and relationships, interpret patterns, and reach conclusions).",
    "Justify": "Give valid reasons or evidence to support an answer or conclusion.",
    "Evaluate": "Make an appraisal by weighing up the strengths and limitations.",
    "Explain": "Give a detailed account including reasons or causes.",
    "Discuss": "Offer a considered and balanced review that includes a range of arguments, factors or hypotheses.",
    "Formulate": "Express the relevant concept or argument systematically in a clear, precise manner.",
    "Describe": "Give a detailed account or picture of a situation, event, pattern or process.",
    "Outline": "Give a brief summary of the essential features or general principles.",
    "To what extent": "Consider the efficacy or validity of an argument or hypothesis; identify nuances and counter-perspectives."
}

def load_existing_data():
    if not os.path.exists(DATA_FILE_PATH):
        return {"lastUpdated": None, "totalDays": 0, "days": []}
    with open(DATA_FILE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    os.makedirs(os.path.dirname(DATA_FILE_PATH), exist_ok=True)
    with open(DATA_FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def build_system_prompt(day_num, date_str, subject1, subject2, cmd1, cmd2):
    return f"""You are an elite IB MYP 5 / DP Curriculum Specialist.
Generate exactly TWO high-density academic writing drills for Day {day_num} ({date_str}):
- Drill 1: {subject1} (Command Term: {cmd1})
- Drill 2: {subject2} (Command Term: {cmd2})

TARGET STUDENT CONTEXT:
The student transitioned from Japanese/Opinion writing into IB MYP 5.
They need rigorous, evidence-based drills to paste into their notebook.
Each drill must focus on objective data analysis and command terms, completely avoiding casual or subjective English.

Return a JSON object matching this schema:
{{
  "day": {day_num},
  "date": "{date_str}",
  "tasks": [
    {{
      "id": "day{day_num}-task1",
      "subject": "{subject1}",
      "subCategory": "string (e.g. Environmental Chemistry, Economic Geography, Ergonomic Product Design)",
      "commandTerm": "{cmd1}",
      "commandTermDefinition": "{COMMAND_TERMS_INFO.get(cmd1, '')}",
      "targetWordCount": "120-150 words",
      "title": "string (academic drill title)",
      "prompt": "string (rigorous task prompt starting with '{cmd1}')",
      "stimulus": {{
        "title": "string (concrete comparison table title)",
        "headers": ["Column 1", "Column 2", "Column 3", "Column 4"],
        "rows": [
          ["Row1 A", "Row1 B", "Row1 C", "Row1 D"],
          ["Row2 A", "Row2 B", "Row2 C", "Row2 D"],
          ["Row3 A", "Row3 B", "Row3 C", "Row3 D"]
        ],
        "notes": "string (context, constraints, or benchmarks)"
      }},
      "requiredVocab": [
        "High-register academic phrase 1 (e.g. It is crucial to recognize that...)",
        "High-register academic phrase 2 (e.g. This is underpinned by the fact that...)",
        "High-register academic phrase 3 (e.g. Consequently, it becomes clear that...)"
      ],
      "structureRule": "string (explicit step-by-step logic rule avoiding 'I think'. E.g. Construct a 3-step validation framework: State claim -> provide data metrics -> explain mechanism.)",
      "bannedWords": ["I think", "In my opinion", "because", "bad", "good", "so"],
      "scaffolding": {{
        "recommendedStructure": ["1. Stance/Correlation", "2. Data synthesis", "3. Consequence/Conclusion"],
        "sentenceStarters": ["starter 1", "starter 2"],
        "targetAcademicVocabulary": ["term 1", "term 2", "term 3"],
        "wordsToAvoid": ["I think", "good/bad"],
        "rubricChecklist": ["Checklist 1", "Checklist 2"]
      }}
    }},
    {{
      "id": "day{day_num}-task2",
      "subject": "{subject2}",
      "subCategory": "string",
      "commandTerm": "{cmd2}",
      "commandTermDefinition": "{COMMAND_TERMS_INFO.get(cmd2, '')}",
      "targetWordCount": "120-150 words",
      "title": "string",
      "prompt": "string (starting with '{cmd2}')",
      "stimulus": {{
        "title": "string",
        "headers": ["Col 1", "Col 2", "Col 3", "Col 4"],
        "rows": [
          ["...", "...", "...", "..."],
          ["...", "...", "...", "..."],
          ["...", "...", "...", "..."]
        ],
        "notes": "string"
      }},
      "requiredVocab": ["Phrase 1...", "Phrase 2...", "Phrase 3..."],
      "structureRule": "string",
      "bannedWords": ["and then", "so", "because", "like"],
      "scaffolding": {{
        "recommendedStructure": ["..."],
        "sentenceStarters": ["..."],
        "targetAcademicVocabulary": ["..."],
        "wordsToAvoid": ["..."],
        "rubricChecklist": ["..."]
      }}
    }}
  ]
}}

CRITICAL: Return valid JSON ONLY. Keep descriptions concise, factual, and academically rigorous.
"""

def call_gemini_api(prompt_text, api_key, max_retries=3):
    url = f"{API_ENDPOINT}?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.5,
            "responseMimeType": "application/json"
        }
    }
    
    req_data = json.dumps(payload).encode("utf-8")
    
    for attempt in range(1, max_retries + 1):
        try:
            print(f"Calling Gemini API with {MODEL_NAME} (attempt {attempt}/{max_retries}, timeout=120s)...")
            req = urllib.request.Request(
                url,
                data=req_data,
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                resp_body = resp.read().decode("utf-8")
                data = json.loads(resp_body)
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                
                # Clean possible markdown wrapping if returned
                if raw_text.startswith("```"):
                    lines = raw_text.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    raw_text = "\n".join(lines).strip()
                    
                return json.loads(raw_text)
        except urllib.error.HTTPError as e:
            error_msg = e.read().decode("utf-8") if e.fp else str(e)
            print(f"HTTP Error {e.code} on attempt {attempt}: {error_msg}")
            if attempt == max_retries or e.code in [400, 401, 403]:
                raise RuntimeError(f"Gemini API HTTP Error {e.code}: {error_msg}")
        except Exception as e:
            print(f"Connection/Timeout Error on attempt {attempt}: {str(e)}")
            if attempt == max_retries:
                raise RuntimeError(f"Failed to communicate with Gemini API after {max_retries} attempts: {str(e)}")
        
        wait_time = attempt * 5
        print(f"Waiting {wait_time}s before retrying...")
        time.sleep(wait_time)

def generate_mock_day(day_num, date_str, subject1, subject2, cmd1, cmd2):
    """Fallback generator for dry-run testing."""
    return {
        "day": day_num,
        "date": date_str,
        "tasks": [
            {
                "id": f"day{day_num}-task1",
                "subject": subject1,
                "subCategory": "Resource Economics & Policy",
                "commandTerm": cmd1,
                "commandTermDefinition": COMMAND_TERMS_INFO.get(cmd1, ""),
                "targetWordCount": "120-150 words",
                "title": f"Decarbonization Policy Trade-Offs (Day {day_num})",
                "prompt": f"{cmd1} why regional microgrids must integrate decentralized storage rather than relying entirely on centralized grid transmission, utilizing the operational trial data.",
                "stimulus": {
                    "title": "Operational Grid Loss & Downtime Metrics Across 3 Infrastructure Models",
                    "headers": ["Model Architecture", "Transmission Loss (%)", "Storm Outage Recovery", "Levelized Cost ($/MWh)"],
                    "rows": [
                        ["Centralized High-Voltage", "14.2%", "72 hours (Avg)", "$68"],
                        ["Decentralized Microgrid (Solar/Battery)", "3.1%", "2.5 hours", "$82"],
                        ["Hybrid Substation Network", "6.8%", "18 hours", "$74"]
                    ],
                    "notes": "Regional profile: Vulnerable coastal zone with severe storm incidents increasing by 40% over the last decade."
                },
                "requiredVocab": [
                    f"When subjecting the systems to {cmd1.lower()} scrutiny, a pronounced divergence appears in...",
                    "This discrepancy is underpinned by the fact that decentralized architectures...",
                    "Consequently, the data demonstrates that resilience outweighs marginal cost increases..."
                ],
                "structureRule": f"Avoid 'I think' or personal opinions. Construct a 3-step {cmd1.lower()} framework: State the core operational disparity clearly, provide quantitative loss and recovery metrics from the table, and explicitly explain the causal mechanism linking storage distribution to systemic resilience.",
                "bannedWords": ["I think", "In my opinion", "because", "bad", "cheap", "good"],
                "scaffolding": {
                    "recommendedStructure": ["1. Identify primary disparity", "2. Synthesize quantitative metrics", "3. Conclude structural resilience"],
                    "sentenceStarters": [f"When subjecting the data to {cmd1.lower()} scrutiny..."],
                    "targetAcademicVocabulary": ["divergence", "decentralized", "resilience", "discrepancy"],
                    "wordsToAvoid": ["I think", "cheap", "good"],
                    "rubricChecklist": [f"Directly satisfies {cmd1}", "Cites table metrics"]
                }
            },
            {
                "id": f"day{day_num}-task2",
                "subject": subject2,
                "subCategory": "Biotechnology & Public Health",
                "commandTerm": cmd2,
                "commandTermDefinition": COMMAND_TERMS_INFO.get(cmd2, ""),
                "targetWordCount": "120-150 words",
                "title": f"Pathogen Containment Protocol Evaluation (Day {day_num})",
                "prompt": f"{cmd2} the adoption of Protocol B over Protocols A and C for municipal water testing, considering detection speed, false-negative risk, and operating costs.",
                "stimulus": {
                    "title": "Bio-Detection Protocol Field Trials (Municipal Water District)",
                    "headers": ["Protocol Code", "Time-to-Result", "Sensitivity Rate", "Cost / 100 Tests", "Specialized Tech Required"],
                    "rows": [
                        ["Protocol A (Agar Culture)", "48 hours", "86.5%", "$45", "Low (Standard lab)"],
                        ["Protocol B (Automated PCR)", "3.5 hours", "99.2%", "$130", "Moderate (Cartridge-based)"],
                        ["Protocol C (Flow Cytometry)", "1.0 hour", "97.8%", "$310", "High (Specialized technician)"]
                    ],
                    "notes": "Regulatory requirement: Detection results for suspected contamination must be certified within 6 hours. District budget: Max $180 / 100 tests."
                },
                "requiredVocab": [
                    f"Protocol B is decisively {cmd2.lower()}ed because it fulfills both...",
                    "While Protocol C provides the fastest turnaround, it violates the...",
                    "Conversely, Protocol A is rendered unfeasible due to its 48-hour incubation latency..."
                ],
                "structureRule": f"Avoid 'I think' or personal opinions. Construct an evidence-based {cmd2.lower()} chain: Formulate your definitive selection based on regulatory constraints, systematically refute competing alternatives using data points, and synthesize the trade-off balance.",
                "bannedWords": ["I think", "In my opinion", "because", "good", "fast", "best"],
                "scaffolding": {
                    "recommendedStructure": ["1. Stance based on threshold", "2. Multi-parameter comparison", "3. Refutation of alternatives"],
                    "sentenceStarters": [f"Protocol B is decisively {cmd2.lower()}ed..."],
                    "targetAcademicVocabulary": ["turnaround", "incubation latency", "unfeasible", "constraint"],
                    "wordsToAvoid": ["I think", "best"],
                    "rubricChecklist": [f"Directly satisfies {cmd2}", "Systematically refutes alternatives"]
                }
            }
        ]
    }

def main():
    parser = argparse.ArgumentParser(description="Generate daily IB MYP Writing Prompts using gemini-3.8-flash")
    parser.add_argument("--dry-run", action="store_true", help="Generate mock day without calling Gemini API")
    parser.add_argument("--force-day", type=int, default=None, help="Force a specific day number")
    args = parser.parse_args()

    data = load_existing_data()
    days_list = data.get("days", [])

    if args.force_day:
        next_day_num = args.force_day
    else:
        if days_list:
            last_day = max(d["day"] for d in days_list)
            next_day_num = last_day + 1
        else:
            next_day_num = 1

    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")

    combo_idx = (next_day_num - 1) % len(SUBJECT_COMBOS)
    subject1, subject2 = SUBJECT_COMBOS[combo_idx]

    available_terms = list(COMMAND_TERMS_INFO.keys())
    cmd1 = available_terms[(next_day_num * 2 - 2) % len(available_terms)]
    cmd2 = available_terms[(next_day_num * 2 - 1) % len(available_terms)]
    if cmd1 == cmd2:
        cmd2 = available_terms[(next_day_num * 2) % len(available_terms)]

    print(f"Generating Day {next_day_num} ({date_str}):")
    print(f"  Task 1: {subject1} -> Command Term: {cmd1}")
    print(f"  Task 2: {subject2} -> Command Term: {cmd2}")

    api_key = os.environ.get("GEMINI_API_KEY")

    if args.dry_run or not api_key:
        if not api_key and not args.dry_run:
            print("WARNING: GEMINI_API_KEY environment variable not set. Falling back to dry-run mock generation.")
        day_entry = generate_mock_day(next_day_num, date_str, subject1, subject2, cmd1, cmd2)
    else:
        prompt_text = build_system_prompt(next_day_num, date_str, subject1, subject2, cmd1, cmd2)
        day_entry = call_gemini_api(prompt_text, api_key)
        day_entry["day"] = next_day_num
        day_entry["date"] = date_str

    # Update or append
    existing_idx = None
    for idx, d in enumerate(days_list):
        if d.get("day") == next_day_num:
            existing_idx = idx
            break

    if existing_idx is not None:
        days_list[existing_idx] = day_entry
        print(f"Updated existing entry for Day {next_day_num}.")
    else:
        days_list.append(day_entry)
        print(f"Appended Day {next_day_num} successfully.")

    days_list.sort(key=lambda x: x["day"])
    data["days"] = days_list
    data["totalDays"] = len(days_list)
    data["lastUpdated"] = datetime.now(timezone.utc).isoformat()

    save_data(data)
    print(f"Saved prompts.json! Total days now: {len(days_list)}")

if __name__ == "__main__":
    main()
