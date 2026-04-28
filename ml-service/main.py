from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from google import genai
from transformers import pipeline

# ─── LOAD ENV ───────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

gemini_client = genai.Client(api_key=GEMINI_API_KEY)

print("MONGO_URI loaded:", MONGO_URI is not None)
print("GEMINI_API_KEY loaded:", GEMINI_API_KEY is not None)

# ─── LOAD SENTIMENT MODEL ONCE ON STARTUP ───────────────────
print("Loading sentiment model... (first run downloads ~500MB)")
sentiment_pipeline = pipeline(  # type: ignore
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
)
print("Sentiment model ready ✅")

app = FastAPI()

# ─── DB HELPERS ───────────────────────────────────────────────


def get_db():
    mongo_client = MongoClient(MONGO_URI)
    return mongo_client["shoppio_db"]


def get_product_by_id(product_id: str):
    db = get_db()
    return db.products.find_one({"_id": ObjectId(product_id)})


def get_reviews_by_product(product_id: str):
    db = get_db()
    return list(db.reviews.find({"productId": ObjectId(product_id)}))


# ─── GEMINI HELPER ───────────────────────────────────────────


def call_gemini(prompt: str) -> str:
    try:
        response = gemini_client.models.generate_content(
            model="models/gemini-2.5-flash", contents=prompt
        )
        if not response.text:
            raise Exception("Empty response")
        return response.text.strip()
    except Exception as e:
        print("Gemini error:", str(e))
        return (
            "This product looks like a good option based on its features and ratings."
        )


# ─── SENTIMENT HELPER ────────────────────────────────────────


def analyze_sentiment(comment: str) -> dict:
    try:
        if not comment or not comment.strip():
            return {"label": "none", "score": 0.0}

        result = sentiment_pipeline(comment[:512])[0]

        # nlptown returns "1 star" to "5 stars"
        label_raw = result["label"]  # e.g. "4 stars"
        stars = int(label_raw.split()[0])

        if stars >= 4:
            label = "positive"
        elif stars == 3:
            label = "neutral"
        else:
            label = "negative"

        score = round(result["score"], 4)
        return {"label": label, "score": score}

    except Exception as e:
        print("Sentiment error:", str(e))
        return {"label": "none", "score": 0.0}


def get_product_sentiment_summary(reviews: list) -> dict:
    """
    Aggregates sentiment across all reviews for a product.
    Returns counts and percentages.
    """
    counts = {"positive": 0, "neutral": 0, "negative": 0, "none": 0}

    for r in reviews:
        sentiment = r.get("sentiment", {})
        label = sentiment.get("label", "none")
        counts[label] = counts.get(label, 0) + 1

    total_with_sentiment = counts["positive"] + counts["neutral"] + counts["negative"]

    if total_with_sentiment == 0:
        return {
            "positive": 0,
            "neutral": 0,
            "negative": 0,
            "total": 0,
            "hasData": False,
        }

    return {
        "positive": round((counts["positive"] / total_with_sentiment) * 100),
        "neutral": round((counts["neutral"] / total_with_sentiment) * 100),
        "negative": round((counts["negative"] / total_with_sentiment) * 100),
        "total": total_with_sentiment,
        "hasData": True,
    }


# ─── REQUEST MODELS ──────────────────────────────────────────


class SummaryRequest(BaseModel):
    product_id: str


class SentimentRequest(BaseModel):
    comment: str
    review_id: str
    product_id: str


# ─── ROUTES ──────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def get_models():
    models = gemini_client.models.list()
    return [m.name for m in models]


# SENTIMENT ROUTE — called by Node.js after review is saved
@app.post("/sentiment")
def analyze_review_sentiment(request: SentimentRequest):
    try:
        result = analyze_sentiment(request.comment)

        # update the review in MongoDB with sentiment
        db = get_db()
        db.reviews.update_one(
            {"_id": ObjectId(request.review_id)},
            {"$set": {"sentiment": result}},
        )

        return {
            "reviewId": request.review_id,
            "sentiment": result,
        }

    except Exception as e:
        print("Sentiment route error:", str(e))
        return {"error": str(e)}


# SUMMARY ROUTE — includes sentiment summary in prompt
@app.post("/summary")
def product_summary(request: SummaryRequest):
    try:
        product = get_product_by_id(request.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        reviews = get_reviews_by_product(request.product_id)
        total = len(reviews)

        if total > 0:
            avg = sum(r["rating"] for r in reviews) / total
            five_star = sum(1 for r in reviews if r["rating"] == 5)
            four_star = sum(1 for r in reviews if r["rating"] == 4)
            three_star = sum(1 for r in reviews if r["rating"] == 3)
            low_star = sum(1 for r in reviews if r["rating"] <= 2)

            rating_text = (
                f"Average rating: {avg:.1f}/5 from {total} reviews. "
                f"5★: {five_star}, 4★: {four_star}, "
                f"3★: {three_star}, ≤2★: {low_star}."
            )

            # user comments
            comments = [
                r["comment"].strip() for r in reviews if r.get("comment", "").strip()
            ]
            if comments:
                comment_lines = "\n".join(f'- "{c}"' for c in comments[:10])
                comment_text = f"\n\nUser comments:\n{comment_lines}"
            else:
                comment_text = "\n\nUser comments: None yet."

            # sentiment summary
            sentiment_summary = get_product_sentiment_summary(reviews)
            if sentiment_summary["hasData"]:
                sentiment_text = (
                    f"\n\nSentiment analysis of comments: "
                    f"{sentiment_summary['positive']}% positive, "
                    f"{sentiment_summary['neutral']}% neutral, "
                    f"{sentiment_summary['negative']}% negative "
                    f"(from {sentiment_summary['total']} comments)."
                )
            else:
                sentiment_text = ""

        else:
            rating_text = "No reviews yet."
            comment_text = "\n\nUser comments: None yet."
            sentiment_text = ""

        prompt = f"""
You are a smart shopping assistant.

Write a short 2-3 sentence summary focusing on:
- What the product does
- Whether it's worth the price
- What the ratings, comments and sentiment suggest
- Who should buy it

Be honest and helpful. Do NOT hallucinate features.
If user comments are available, use them to reflect real buyer experiences.

Product: {product.get('name')}
Category: {product.get('category')}
Price: ₹{product.get('price')}
Description: {product.get('description')}
Stock: {product.get('stock')}
Ratings: {rating_text}{comment_text}{sentiment_text}
"""

        summary = call_gemini(prompt)
        return {"summary": summary}

    except HTTPException:
        raise
    except Exception as e:
        return {
            "summary": "⚠️ AI is busy right now. Try again later.",
            "error": str(e),
        }
