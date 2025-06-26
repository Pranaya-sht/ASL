import json
import os
import re
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet

# Ensure required resources are downloaded
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('omw-1.4')

# Load gloss dictionary
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DICT_PATH = os.path.join(BASE_DIR, "expanded_gloss_dict.json")

with open(DICT_PATH, "r", encoding="utf-8") as f:
    gloss_dict = json.load(f)

REMOVE_WORDS = set([
    "a", "an", "the", "is", "are", "was", "were", "am", "be", "being", "been",
    "do", "does", "did", "have", "has", "had", "will", "shall", "would", "should",
    "to", "of", "and", "or", "but", "that", "as", "so", "for", "on", "at", "in",
    # Added common auxiliary verbs that might interfere with direct glossing
    "used", "get", "got", "can", "could", "may", "might", "must"
])

TIME_WORDS = {"today", "yesterday", "tomorrow", "now", "later", "morning", "night",
              "evening", "soon", "recently", "ago", "before", "after", "next", "last"}

WH_WORDS = {"who", "what", "where", "when", "why", "how", "which"}
NEGATIONS = {"not", "never", "no", "none", "nothing", "nobody", "nowhere", "neither", "nor"}

PRONOUN_MAP = {
    "i": "ME", "me": "ME", "my": "MY", "mine": "MINE",
    "you": "YOU", "your": "YOUR",
    "he": "YOU", "him": "YOU", "his": "YOUR", # Simplified for general ASL interpretation
    "she": "SHE", "her": "HER",
    "it": "IT", "its": "ITS",
    "we": "WE", "us": "WE", "our": "OUR",
    "they": "THEY", "them": "THEY", "their": "THEIR"
}

lemmatizer = WordNetLemmatizer()

def normalize_negations(text):
    contractions = {
        r"\bdon'?t\b": "do not",
        r"\bdoesn'?t\b": "does not",
        r"\bdidn'?t\b": "did not",
        r"\bwon'?t\b": "will not",
        r"\bwouldn'?t\b": "would not",
        r"\bshouldn'?t\b": "should not",
        r"\bcan'?t\b": "cannot",
        r"\bcouldn'?t\b": "could not",
        r"\bwasn'?t\b": "was not",
        r"\bweren'?t\b": "were not",
        r"\bmustn'?t\b": "must not",
        r"\bhadn'?t\b": "had not",
        r"\bhaven'?t\b": "have not",
        r"\bhasn'?t\b": "has not",
        r"\bneedn'?t\b": "need not",
        r"\boughtn'?t\b": "ought not",
        r"\bmightn'?t\b": "might not",
        r"\bmayn'?t\b": "may not"
    }
    for pattern, replacement in contractions.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    return text

def apply_asl_grammar(tokens):
    # ASL often follows TIME-TOPIC-COMMENT-WH or TOPIC-COMMENT-WH structures.
    # Time is usually at the beginning. WH-words often at the end for questions.
    # Negations typically at the end or before the negated verb.

    wh_items = [t for t in tokens if t in WH_WORDS]
    time_items = [t for t in tokens if t in TIME_WORDS]
    neg_items = [t for t in tokens if t in NEGATIONS]

    # Filter out words that are part of time/wh/neg for core
    core = [t for t in tokens if t not in WH_WORDS | TIME_WORDS | NEGATIONS]

    # Basic ASL order: TIME + CORE + NEGATION + WH
    return time_items + core + neg_items + wh_items

def determine_tense(sentence):
    sent = sentence.lower()
    # Check for explicit future markers
    if any(w in sent for w in ["will", "shall", "going to"]):
        return "future"
    # Check for explicit past markers, including "used to"
    if any(w in sent for w in ["was", "were", "did", "had", "used to"]):
        return "past"
    # Default to present if no clear markers
    return "present"

def handle_spatial_references(text):
    index_map = {}
    next_idx = 1
    def replacer(match):
        nonlocal next_idx
        word = match.group(0).lower()
        if word not in index_map:
            index_map[word] = f"INDEX_{next_idx}"
            next_idx += 1
        return index_map[word]
    return re.sub(r"\b(this|that|here|there)\b", replacer, text, flags=re.IGNORECASE)

def glossize(sentence):
    sentence = normalize_negations(sentence)
    sentence = handle_spatial_references(sentence)
    result_lines = []

    for sent in sent_tokenize(sentence):
        original_sent_lower = sent.lower() # Keep original for "used to" check
        tense = determine_tense(original_sent_lower)
        tokens = word_tokenize(original_sent_lower)

        # Handle "used to" specifically for habitual aspect
        asl_aspect_marker = ""
        if "used to" in original_sent_lower:
            asl_aspect_marker = "FINISH" # Or REPEATEDLY, HABITUAL, PAST

        # Filter out auxiliary verbs that are not directly glossed
        # and replace pronouns
        filtered = [
            PRONOUN_MAP.get(t, t) for t in tokens
            if t.isalnum() and t not in REMOVE_WORDS and t not in ["to"] # 'to' after 'used'
        ]

        # Lemmatize verbs
        lemmatized = [lemmatizer.lemmatize(t, wordnet.VERB) for t in filtered]

        # Process instrumental phrases like "with my hands"
        # This is a very basic implementation and might need more sophistication
        instrumental_phrase = ""
        # Look for "with X"
        if "with" in lemmatized:
            with_index = lemmatized.index("with")
            # Assuming the instrumental object follows "with"
            if with_index + 1 < len(lemmatized):
                # Take the "with" and the subsequent words until a verb or punctuation
                instrumental_words = []
                for i in range(with_index, len(lemmatized)):
                    # Stop if we hit another verb (simplistic) or a common grammatical marker
                    if lemmatized[i] in ['verb', 'noun', 'pronoun'] and i > with_index: # Placeholder logic
                        break
                    instrumental_words.append(lemmatized[i])

                # Remove these words from the main token list for ordering
                for word in instrumental_words:
                    if word in lemmatized:
                        lemmatized.remove(word)

                # ASL often implies the instrument through verb modification or separate sign,
                # but for glossing, we can represent it with a phrase like "USING HANDS"
                # or integrate it conceptually. For now, let's simplify.
                if "hand" in instrumental_words or "hands" in instrumental_words:
                    instrumental_phrase = "USING HANDS"
                elif "foot" in instrumental_words or "feet" in instrumental_words:
                    instrumental_phrase = "USING FEET"
                elif "tool" in instrumental_words: # Generic example
                    instrumental_phrase = "USING TOOL"
                # Remove "with" itself if it's been handled
                if "with" in instrumental_words:
                    instrumental_words.remove("with")


        ordered = apply_asl_grammar(lemmatized)

        gloss_tokens = []
        subject = None

        # Add tense marker if not a time word already present
        if not any(t in TIME_WORDS for t in ordered) and tense == "past":
            gloss_tokens.append("PAST") # Or FINISH, BEFORE

        elif not any(t in TIME_WORDS for t in ordered) and tense == "future":
            gloss_tokens.append("FUTURE") # Or WILL, LATER

        # Add aspect marker if determined
        if asl_aspect_marker:
            gloss_tokens.append(asl_aspect_marker)


        for token in ordered:
            if token in PRONOUN_MAP.values():
                subject = token
            gloss = gloss_dict.get(token, token).upper()
            gloss_tokens.append(gloss)

        # Add instrumental phrase at a logical ASL position (often after the verb or at the end)
        if instrumental_phrase:
            # A common ASL structure for instruments is after the action
            # For simplicity, let's append it. More advanced would integrate with verb.
            gloss_tokens.append(instrumental_phrase)

        # Handle TOPIC marker for sentences starting with time words
        if any(t in TIME_WORDS for t in ordered) and ordered[0] in TIME_WORDS:
            gloss_tokens[0] += " TOPIC"


        result_lines.append(" ".join(gloss_tokens))

    return "\n".join(result_lines)