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
from datetime import datetime, timezone, timedelta
import argparse
import random

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
    "Analyze": {
        "definition": "Break down in order to bring out the essential elements or structure. (To identify parts and relationships, and to interpret information to reach conclusions).",
        "focus": "Identifying underlying patterns, anomalies, causal relationships, and structural implications."
    },
    "Justify": {
        "definition": "Give valid reasons or evidence to support an answer or conclusion.",
        "focus": "Direct thesis, multi-criteria trade-off analysis, concrete data citations, and systematic refutation of alternatives."
    },
    "Evaluate": {
        "definition": "Make an appraisal by weighing up the strengths and limitations.",
        "focus": "Balanced assessment against established specifications or criteria, acknowledging trade-offs before delivering a final reasoned judgment."
    },
    "Explain": {
        "definition": "Give a detailed account including reasons or causes.",
        "focus": "Multi-step causal chains, underlying mechanisms, and linking facts to broader historical, scientific, or social systems."
    },
    "Discuss": {
        "definition": "Offer a considered and balanced review that includes a range of arguments, factors or hypotheses.",
        "focus": "Weighing differing perspectives, evaluating counter-arguments, and synthesizing an informed viewpoint."
    },
    "Formulate": {
        "definition": "Express the relevant concept or argument systematically in a clear, precise manner.",
        "focus": "Synthesizing parameters into a coherent hypothesis, design brief, or strategic solution."
    },
    "Describe": {
        "definition": "Give a detailed account or picture of a situation, event, pattern or process.",
        "focus": "Precise, objective characterization without vague qualitative generalizations."
    }
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
    return f"""You are an elite IB MYP 5 & DP Preparatory Examiner and Curriculum Specialist.
Your task is to generate Day {day_num} ({date_str}) writing exercises consisting of exactly TWO academic tasks:
- Task 1 Subject: {subject1} (Command Term: {cmd1})
- Task 2 Subject: {subject2} (Command Term: {cmd2})

TARGET STUDENT CONTEXT:
The student transitioned from Japanese/Opinion-based writing into IB MYP 5 and wants daily rigorous practice to master IB Command Terms (especially for Humanities, Sciences, Design, and Personal Project).
The student avoids vague opinions and needs structured stimulus data (Tables, Matrices, Historical/Scientific Case Studies) to analyze, paraphrase, and reason with evidence.
Each task must be designed for a strict 15-minute handwritten practice (120-150 words) to print out on an A4 sheet.

OUTPUT JSON SCHEMA:
Return ONLY a valid JSON object matching this exact schema:
{{
  "day": {day_num},
  "date": "{date_str}",
  "tasks": [
    {{
      "id": "day{day_num}-task1",
      "subject": "{subject1}",
      "subCategory": "string (e.g. Environmental Chemistry, Economic Geography, Ergonomic Product Design, Civic Policy)",
      "commandTerm": "{cmd1}",
      "commandTermDefinition": "string (exact official IB MYP definition for {cmd1})",
      "targetTimeMinutes": 15,
      "targetWordCount": "120-150 words",
      "mypCriterion": "string (e.g. Criterion D: Critical Thinking)",
      "title": "string (compelling, realistic academic topic title)",
      "prompt": "string (concise, rigorous task prompt starting with the command term '{cmd1}')",
      "stimulusType": "table",
      "stimulus": {{
        "title": "string (descriptive table title with context)",
        "headers": ["Col 1", "Col 2", "Col 3", "Col 4"],
        "rows": [
          ["Val 1", "Val 2", "Val 3", "Val 4"],
          ["Val 5", "Val 6", "Val 7", "Val 8"],
          ["Val 9", "Val 10", "Val 11", "Val 12"]
        ],
        "notes": "string (essential context, constraints, budgetary limits, or environmental variables that provide necessary criteria for reasoning)"
      }},
      "scaffolding": {{
        "recommendedStructure": [
          "1. Step one (e.g. Direct stance / General correlation)",
          "2. Step two (e.g. Evidence synthesis and constraint comparison)",
          "3. Step three (e.g. Refutation / Structural implication)"
        ],
        "sentenceStarters": [
          "academic sentence starter 1...",
          "academic sentence starter 2...",
          "academic sentence starter 3...",
          "academic sentence starter 4..."
        ],
        "targetAcademicVocabulary": [
          "advanced academic term 1",
          "advanced academic term 2",
          "advanced academic term 3",
          "advanced academic term 4",
          "advanced academic term 5"
        ],
        "wordsToAvoid": [
          "I think / In my opinion (Use: 'The data indicates' or 'It is evident that')",
          "casual word 2 (Use: 'academic alternative')",
          "casual word 3 (Use: 'academic alternative')"
        ],
        "rubricChecklist": [
          "checklist item 1 targeting {cmd1}",
          "checklist item 2 evaluating evidence synthesis",
          "checklist item 3 checking objective academic register",
          "checklist item 4 verifying constraints handling"
        ]
      }}
    }},
    {{
      "id": "day{day_num}-task2",
      "subject": "{subject2}",
      "subCategory": "string",
      "commandTerm": "{cmd2}",
      "commandTermDefinition": "string (exact official IB MYP definition for {cmd2})",
      "targetTimeMinutes": 15,
      "targetWordCount": "120-150 words",
      "mypCriterion": "string",
      "title": "string",
      "prompt": "string (starting with '{cmd2}')",
      "stimulusType": "table",
      "stimulus": {{
        "title": "string",
        "headers": ["Col A", "Col B", "Col C", "Col D"],
        "rows": [
          ["...", "...", "...", "..."],
          ["...", "...", "...", "..."],
          ["...", "...", "...", "..."]
        ],
        "notes": "string"
      }},
      "scaffolding": {{
        "recommendedStructure": ["...", "...", "..."],
        "sentenceStarters": ["...", "...", "...", "..."],
        "targetAcademicVocabulary": ["...", "...", "...", "...", "..."],
        "wordsToAvoid": ["...", "...", "..."],
        "rubricChecklist": ["...", "...", "...", "..."]
      }}
    }}
  ]
}}

CRITICAL GUIDELINES:
1. Always include a concrete 4-5 column, 3-5 row comparison table in `stimulus` with realistic quantitative data or categorized criteria.
2. Ensure the prompt requires processing the table data, not just general background knowledge.
3. Sentence starters and vocabulary must elevate the register to authentic high-level IB English, avoiding direct Japanese-to-English translation habits.
4. Output raw JSON ONLY without markdown fences or extraneous text.
"""

def call_gemini_api(prompt_text, api_key):
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
            "temperature": 0.7,
            "responseMimeType": "application/json"
        }
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
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
        raise RuntimeError(f"Gemini API HTTP Error {e.code}: {error_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to communicate with Gemini API: {str(e)}")

def generate_mock_day(day_num, date_str, subject1, subject2, cmd1, cmd2):
    """Fallback generator for dry-run testing without an active API key."""
    return {
        "day": day_num,
        "date": date_str,
        "tasks": [
            {
                "id": f"day{day_num}-task1",
                "subject": subject1,
                "subCategory": "Resource Management & Sustainability",
                "commandTerm": cmd1,
                "commandTermDefinition": COMMAND_TERMS_INFO.get(cmd1, {}).get("definition", ""),
                "targetTimeMinutes": 15,
                "targetWordCount": "120-150 words",
                "mypCriterion": "Criterion D: Critical Thinking",
                "title": f"Analysis of Renewable Microgrid Efficiency in Day {day_num}",
                "prompt": f"{cmd1} the quantitative performance trade-offs between Solar-Battery storage and Wind-Hydro hybrid systems under variable seasonal demand.",
                "stimulusType": "table",
                "stimulus": {
                    "title": "Seasonal Power Output vs Storage Loss Metrics",
                    "headers": ["System Architecture", "Capital Expenditure ($/kW)", "Winter Efficacy Drop", "Storage Degradation Rate / yr", "Discharge Reliability"],
                    "rows": [
                        ["Architecture 1: Solar-LiFePO4", "$1,450", "-42%", "1.8%", "96.4%"],
                        ["Architecture 2: Micro-Wind Hybrid", "$2,100", "-8%", "3.2%", "91.0%"],
                        ["Architecture 3: Gravity Hydro Storage", "$3,400", "-5%", "0.4%", "98.5%"]
                    ],
                    "notes": "Regional profile: High latitude region experiencing 16 hours of darkness in winter; peak heating demand occurs during sub-zero cold snaps."
                },
                "scaffolding": {
                    "recommendedStructure": [
                        "1. Identify structural differences in seasonal reliability",
                        "2. Compare degradation rate against upfront capital outlay",
                        "3. Synthesize operational suitability for high-latitude winter constraints"
                    ],
                    "sentenceStarters": [
                        f"When subjecting the systems to {cmd1.lower()} scrutiny, a pronounced divergence appears in...",
                        "While Architecture 1 offers minimal upfront capital expenditure, its viability is constrained by...",
                        "Consequently, the data indicates that seasonal resilience demands...",
                        "This operational trade-off underlines the necessity of prioritizing..."
                    ],
                    "targetAcademicVocabulary": [
                        "divergence", "capital expenditure", "resilience", "seasonal volatility", "degradation"
                    ],
                    "wordsToAvoid": [
                        "I think Architecture 2 is better",
                        "cheap (Use: 'economically accessible' or 'cost-effective')",
                        "bad in winter (Use: 'experiences severe winter attenuation')"
                    ],
                    "rubricChecklist": [
                        f"Directly addressed the {cmd1} command term",
                        "Synthesized multi-variable data from the table",
                        "Avoided subjective opinion language",
                        "Met the 120-150 word pacing target"
                    ]
                }
            },
            {
                "id": f"day{day_num}-task2",
                "subject": subject2,
                "subCategory": "User-Centered Sustainable Architecture",
                "commandTerm": cmd2,
                "commandTermDefinition": COMMAND_TERMS_INFO.get(cmd2, {}).get("definition", ""),
                "targetTimeMinutes": 15,
                "targetWordCount": "120-150 words",
                "mypCriterion": "Criterion B: Inquiring and Designing / Criterion D: Evaluating",
                "title": f"Selection of Acoustic Baffle Material for Study Commons (Day {day_num})",
                "prompt": f"{cmd2} the adoption of Material Option Y over Options X and Z for the high-traffic school learning commons, adhering to fire safety and sound absorption benchmarks.",
                "stimulusType": "table",
                "stimulus": {
                    "title": "Acoustic Partition Material Test Results",
                    "headers": ["Material Option", "Noise Reduction Coeff (NRC)", "Flame Spread Index (Class A < 25)", "VOC Emission (ug/m3)", "Recycled Content (%)"],
                    "rows": [
                        ["Option X: Expanded Polyurethane", "0.85 (Pass)", "38 (Fail: Class B)", "120 (Elevated)", "0%"],
                        ["Option Y: Compressed PET Felt", "0.78 (Pass)", "18 (Pass: Class A)", "< 5 (Ultra-low)", "85%"],
                        ["Option Z: Perforated Timber Panel", "0.62 (Marginal)", "22 (Pass: Class A)", "< 10 (Low)", "30%"]
                    ],
                    "notes": "Building code requirement: Mandatory Class A flame spread index (< 25). Indoor air quality standard: VOC must remain below 20 ug/m3."
                },
                "scaffolding": {
                    "recommendedStructure": [
                        f"1. Formulate unequivocal selection of Material Y supported by {cmd2.lower()} criteria",
                        "2. Contrast compliance against rigid regulatory safety standards (Class A fire index and VOC levels)",
                        "3. Refute Option X due to safety disqualification and Option Z due to acoustic insufficiency"
                    ],
                    "sentenceStarters": [
                        f"Material Option Y is definitively {cmd2.lower()}ed because it satisfies both...",
                        "Although Option X exhibits a superior NRC of 0.85, it is automatically disqualified by...",
                        "Furthermore, while Option Z meets regulatory safety benchmarks, its acoustic coefficient...",
                        "Therefore, balancing acoustic efficacy against stringent occupant safety mandates..."
                    ],
                    "targetAcademicVocabulary": [
                        "disqualified", "stringent", "coefficient", "mandate", "uncompromising", "benchmark"
                    ],
                    "wordsToAvoid": [
                        "I think Option Y looks best",
                        "very safe (Use: 'exceeds Class A fire resistance and indoor air quality thresholds')",
                        "Option X is dangerous (Use: 'Option X fails to satisfy mandatory fire compliance codes')"
                    ],
                    "rubricChecklist": [
                        f"Clear opening justification in alignment with {cmd2}",
                        "Direct citation of regulatory pass/fail benchmarks",
                        "Systematic disqualification of non-compliant materials",
                        "Maintained objective, professional technical writing style"
                    ]
                }
            }
        ]
    }

def main():
    parser = argparse.ArgumentParser(description="Generate daily IB MYP Writing Prompts using gemini-3.8-flash")
    parser.add_argument("--dry-run", action="store_true", help="Generate mock day without calling Gemini API (useful for testing)")
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

    # Calculate date
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%Y-%m-%d")

    # Select subject combination and command terms systematically
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
        print(f"Calling Gemini API with model: {MODEL_NAME} ...")
        day_entry = call_gemini_api(prompt_text, api_key)
        # Ensure day and date match
        day_entry["day"] = next_day_num
        day_entry["date"] = date_str

    # Check if this day already exists in data; if so, replace it; otherwise append
    existing_idx = None
    for idx, d in enumerate(days_list):
        if d.get("day") == next_day_num:
            existing_idx = idx
            break

    if existing_idx is not None:
        days_list[existing_idx] = day_entry
        print(f"Replaced existing entry for Day {next_day_num}.")
    else:
        days_list.append(day_entry)
        print(f"Appended Day {next_day_num} successfully.")

    # Sort days by day number
    days_list.sort(key=lambda x: x["day"])

    data["days"] = days_list
    data["totalDays"] = len(days_list)
    data["lastUpdated"] = datetime.now(timezone.utc).isoformat()

    save_data(data)
    print(f"Saved prompts.json! Total days now: {len(days_list)}")

if __name__ == "__main__":
    main()
