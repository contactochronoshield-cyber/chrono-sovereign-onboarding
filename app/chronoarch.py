"""
ChronoArch Agent - Puente soberano entre Chrono Shield y la red Archipelag / Ollama local.
Permite inferencia de IA distribuida mediante API compatible con OpenAI y fallback local.
"""
from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
import openai

load_dotenv()

app = Flask(__name__)
ARCHIPELAG_BASE = "https://app.archipelag.io/api/v1"
ARCHIPELAG_KEY = os.getenv("ARCHIPELAG_API_KEY", "ak_mock_key_sovereign")

@app.route('/api/archipelag', methods=['POST'])
def proxy_to_archipelag():
    data = request.json
    model = data.get("model", "mistral-7b")
    messages = data.get("messages", [])
    
    try:
        client = openai.OpenAI(
            base_url=ARCHIPELAG_BASE,
            api_key=ARCHIPELAG_KEY
        )
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True
        )
        
        return app.response_class(
            response.stream_with_context(lambda: response),
            content_type="text/event-stream"
        )
    except Exception as e:
        return jsonify({"error": str(e), "fallback": "Using local Ollama engine"}), 500

@app.route('/api/ollama-bridge', methods=['POST'])
def ollama_bridge():
    data = request.json
    prompt = data.get("prompt", "Hola desde Chrono Shield")
    model = data.get("model", "llama3.2")
    
    try:
        url = "http://localhost:11434/api/generate"
        payload = {"model": model, "prompt": prompt, "stream": True}
        
        r = requests.post(url, json=payload, stream=True)
        return app.response_class(r.iter_lines(), content_type="text/event-stream")
    except Exception as e:
        return jsonify({"error": "Ollama no disponible localmente. Configure ARCHIPELAG_API_KEY."}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5002)
