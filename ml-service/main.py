from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient
import numpy as np
import os
from dotenv import load_dotenv


# load env
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI loaded:", MONGO_URI is not None)  # prints True/False

app = FastAPI()

# load model once on startup
model = SentenceTransformer("paraphrase-MiniLM-L3-v2")
model.max_seq_length = 128  # ← add this line


class SearchRequest(BaseModel):
    query: str
    limit: int = 10


def get_products():
    client = MongoClient(MONGO_URI)
    print("MONGO_URI:", MONGO_URI)  # ← add this
    db = client["shoppio_db"]  # change to your DB name if different
    products = list(
        db.products.find(
            {},
            {
                "_id": 1,
                "name": 1,
                "description": 1,
                "category": 1,
                "price": 1,
                "images": 1,
                "averageRating": 1,
                "totalReviews": 1,
                "stock": 1,
            },
        )
    )
    client.close()
    return products


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/search")
def semantic_search(request: SearchRequest):
    try:
        products = get_products()
        if not products:
            return {"results": []}

        # combine name + description + category for each product
        product_texts = [
            f"{p.get('name', '')} {p.get('description', '')} {p.get('category', '')}"
            for p in products
        ]

        # encode query and all products
        query_embedding = model.encode([request.query], convert_to_numpy=True)
        product_embeddings = model.encode(product_texts, convert_to_numpy=True)

        # cosine similarity
        similarities = cosine_similarity(query_embedding, product_embeddings)[0]

        # rank by similarity
        ranked_indices = np.argsort(similarities)[::-1][: request.limit]

        results = []
        for idx in ranked_indices:
            product = products[idx]
            product["_id"] = str(product["_id"])
            product["score"] = float(similarities[idx])
            results.append(product)

        return {"results": results}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
