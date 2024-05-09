import json
import weaviate
import os
from dotenv import load_dotenv
load_dotenv()

query_vector = [1] * 1536

client = weaviate.Client(
    url=os.getenv('WCS_URL'),
    auth_client_secret=weaviate.auth.AuthApiKey(os.getenv('WCS_KEY')),
)



result = client.query.get("SephoraGpt", ['rating', 'type', 'text', 'title', 'recommended', 'product_id']
).with_near_vector(
{'vector': query_vector}
).with_limit(300).do()
