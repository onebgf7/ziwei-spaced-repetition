from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

CARDS_FILE = 'cards.json'
PROGRESS_FILE = 'progress.json'

# 預設紫微斗數卡片資料
DEFAULT_CARDS = [
    {"question": "天機星是什麼？", "answer": "天機星主智慧、變化，屬陰木。"},
    {"question": "命宮是什麼？", "answer": "命宮代表一個人的個性與天賦。"},
    {"question": "紫微星的五行屬性？", "answer": "屬土，主尊貴。"},
    {"question": "四化分別是哪四個？", "answer": "化祿、化權、化科、化忌。"}
]

# 初始化卡片資料
if not os.path.exists(CARDS_FILE):
    with open(CARDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(DEFAULT_CARDS, f, ensure_ascii=False, indent=2)

# 初始化學習進度
if not os.path.exists(PROGRESS_FILE):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump({}, f)

def load_cards():
    with open(CARDS_FILE, encoding='utf-8') as f:
        return json.load(f)

def load_progress():
    with open(PROGRESS_FILE, encoding='utf-8') as f:
        return json.load(f)

def save_progress(progress):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)

@app.route('/api/cards', methods=['GET'])
def get_cards():
    cards = load_cards()
    progress = load_progress()
    now = datetime.now().isoformat()
    # 根據間隔記憶法，篩選需要複習的卡片
    due_cards = []
    for idx, card in enumerate(cards):
        card_id = str(idx)
        last_review = progress.get(card_id, {}).get('last_review')
        interval = progress.get(card_id, {}).get('interval', 1)
        if not last_review:
            due_cards.append({**card, 'id': card_id})
        else:
            next_review = datetime.fromisoformat(last_review) + timedelta(days=interval)
            if datetime.now() >= next_review:
                due_cards.append({**card, 'id': card_id})
    return jsonify(due_cards)

@app.route('/api/review', methods=['POST'])
def review_card():
    data = request.json
    card_id = data['id']
    correct = data['correct']
    progress = load_progress()
    now = datetime.now().isoformat()
    if card_id not in progress:
        progress[card_id] = {'interval': 1, 'last_review': now}
    else:
        if correct:
            progress[card_id]['interval'] = min(progress[card_id]['interval'] * 2, 60)
        else:
            progress[card_id]['interval'] = 1
        progress[card_id]['last_review'] = now
    save_progress(progress)
    return jsonify({'success': True})

@app.route('/api/add_card', methods=['POST'])
def add_card():
    data = request.json
    cards = load_cards()
    cards.append({'question': data['question'], 'answer': data['answer']})
    with open(CARDS_FILE, 'w', encoding='utf-8') as f:
        json.dump(cards, f, ensure_ascii=False, indent=2)
    return jsonify({'success': True})

@app.route('/api/all_cards', methods=['GET'])
def all_cards():
    cards = load_cards()
    return jsonify(cards)

@app.route('/api/delete_card', methods=['POST'])
def delete_card():
    data = request.json
    idx = data['id']
    cards = load_cards()
    try:
        idx = int(idx)
        cards.pop(idx)
        with open(CARDS_FILE, 'w', encoding='utf-8') as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
        # 同步刪除進度
        progress = load_progress()
        progress.pop(str(idx), None)
        # 重新編號剩餘進度
        new_progress = {}
        for i, card in enumerate(cards):
            if str(i) in progress:
                new_progress[str(i)] = progress[str(i)]
        save_progress(new_progress)
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
