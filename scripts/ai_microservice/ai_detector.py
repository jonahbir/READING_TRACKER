from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)
classifier = pipeline("text-classification", model="roberta-base-openai-detector")

@app.route('/detect_ai', methods=['POST'])
data = request.get_json()
text = data.get('text', '')
result = classifier(text)[0]
score = result['score'] if result['label'] == 'Fake' else 1 - result['score']  # 'Fake' = AI probability
return jsonify({'ai_score': score, 'label': result['label']})

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=5001)
