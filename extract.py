import json
import os

path = r'C:\Users\Usuario\.gemini\antigravity\brain\17b6decb-7a0d-4b5d-8630-b24b4924365b\.system_generated\logs\transcript_full.jsonl'
if not os.path.exists(path):
    path = r'C:\Users\Usuario\.gemini\antigravity\brain\17b6decb-7a0d-4b5d-8630-b24b4924365b\.system_generated\logs\transcript.jsonl'

last_user_text = None
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'USER_INPUT':
            last_user_text = data.get('content')

if last_user_text:
    out_path = r'C:\Users\Usuario\.gemini\antigravity\scratch\veteranos_5be\relatorio_bruto.txt'
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(last_user_text)
    print(f'Saved raw text, length: {len(last_user_text)} chars')
else:
    print('No user input found')
