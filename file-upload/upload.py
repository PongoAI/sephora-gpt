import json
import weaviate
import os
from llama_index.vector_stores.weaviate import WeaviateVectorStore
from llama_index.core.schema import TextNode
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from dotenv import load_dotenv
load_dotenv()


client = weaviate.Client(
    url=os.getenv('WCS_URL'),
    auth_client_secret=weaviate.auth.AuthApiKey(os.getenv('WCS_KEY')),
)



vector_store = WeaviateVectorStore(
    weaviate_client=client, index_name="SephoraGpt"
)


text_splitter = SentenceSplitter(
    chunk_size=400,
    separator=" ",
)

with open('./jsons/concealer.json') as f:
    imported_json = json.load(f)[0]['result']

nodes = []

product_id = imported_json['info']['id']
print(product_id)

for review in imported_json['reviews']:
    if  review['is_recommended']:
        would_recommend = 'Yes'
    else:
        would_recommend = 'No'

    # review_stirng = f"Title: {review['review_text']}\nWould recommend product: {would_recommend}\nRating: {review['rating']}\nBody: {review['review_text']}"

    cur_text_chunks = text_splitter.split_text(review['review_text'])
    for text_chunk in cur_text_chunks:
        cur_node = TextNode(text=text_chunk)
        cur_node.metadata = {
            'rating': review['rating'],
            'text': review['review_text'],
            'title': review['review_title'],
            'product_id': product_id,
            'recommended': would_recommend,
            'type': 'review'
            
        }
        nodes.append(cur_node)
    



for question in imported_json['questions']:

    for answer in question['answers']:
        if answer['positive_feedback_count'] < answer['negative_feedback_count'] and (len(question['question']) + len(answer['answer'])) < 1900:
            cur_node = TextNode(text=f"Question: {question['question']}\nAnswer: {answer['answer']}")
            cur_node.metadata = {
                'product_id': product_id,
                'type': 'question'
            }
            nodes.append(cur_node)
    
embed_model = OpenAIEmbedding(model="text-embedding-3-small", api_key=os.getenv("OPENAI_APIKEY"), dimensions=1536)

print(len(nodes))
for node in nodes:
    node_embedding = embed_model.get_text_embedding(
        node.get_content(metadata_mode="all")
    )
    node.embedding = node_embedding

vector_store.add(nodes)
