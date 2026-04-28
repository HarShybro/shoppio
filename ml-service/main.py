from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from google import genai

# ─── LOAD ENV ───────────────────────────────────────────────

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

MONGO_URI = os.getenv("MONGO_URI")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

print("MONGO_URI loaded:", MONGO_URI is not None)
print("GEMINI_API_KEY loaded:", GEMINI_API_KEY is not None)

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
        response = client.models.generate_content(
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


# ─── REQUEST MODEL ──────────────────────────────────────────


class SummaryRequest(BaseModel):
    product_id: str


# ─── ROUTES ──────────────────────────────────────────────────


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/models")
def get_models():
    models = client.models.list()
    return [m.name for m in models]


# ✅ ONLY FEATURE: AI SUMMARY
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

            # ─── collect user comments ───────────────────────
            comments = [
                r["comment"].strip() for r in reviews if r.get("comment", "").strip()
            ]

            if comments:
                # cap at 10 comments so prompt doesn't get too long
                comment_lines = "\n".join(f'- "{c}"' for c in comments[:10])
                comment_text = f"\n\nUser comments:\n{comment_lines}"
            else:
                comment_text = "\n\nUser comments: None yet."

        else:
            rating_text = "No reviews yet."
            comment_text = "\n\nUser comments: None yet."

        prompt = f"""
You are a smart shopping assistant.

Write a short 2-3 sentence summary focusing on:
- What the product does
- Whether it's worth the price
- What the ratings and user comments suggest
- Who should buy it

Be honest and helpful. Do NOT hallucinate features.
If user comments are available, use them to reflect real buyer experiences.

Product: {product.get('name')}
Category: {product.get('category')}
Price: ₹{product.get('price')}
Description: {product.get('description')}
Stock: {product.get('stock')}
Ratings: {rating_text}{comment_text}
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
