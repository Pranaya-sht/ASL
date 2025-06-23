from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json
from nltk.tokenize import word_tokenize
import nltk

nltk.download('punkt')
app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load your gloss dictionary
with open("expanded_gloss_dict.json", "r") as f:
    gloss_dict = json.load(f)

def glossize(sentence: str):
    tokens = word_tokenize(sentence.lower())
    gloss = []

    for word in tokens:
        mapped = gloss_dict.get(word)
        if mapped:
            gloss.append(mapped.upper())
    return gloss

@app.post("/api/gloss")
async def get_gloss(request: Request):
    data = await request.json()
    sentence = data.get("sentence", "")
    gloss = glossize(sentence)
    return {"input": sentence, "gloss": gloss}
