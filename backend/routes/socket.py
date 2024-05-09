from fastapi import (
    APIRouter,
    WebSocket,
)

import json
from dotenv import load_dotenv
import os
import json
import pongo
from openai import OpenAI
from exa_py import Exa
import weaviate
socket_router = APIRouter()
load_dotenv()



together_client = OpenAI(api_key=os.environ.get("TOGETHER_API_KEY"), base_url='https://api.together.xyz/v1')
groq_client = OpenAI(api_key=os.environ.get("GROQ_API_KEY"), base_url='https://api.groq.com/openai/v1')
pongo_client = pongo.PongoClient(os.environ.get("PONGO_API_KEY"))

exa_client = Exa( os.environ.get("EXA_API_KEY"))

#In prod, just include names in your data base objs 
product_ids_to_names = {
    'P417238': 'Green Clean Makeup Removing Cleansing Balm',
    'P411540': 'Cicapair™ Tiger Grass Color Correcting Treatment SPF 30',
    'P88779809': 'Pro Filtr Instant Retouch Longwear Liquid Concealer',
    'P468206': 'Glowy Super Gel Lightweight Dewy Multipurpose Illuminator',
    'P454380': 'Supergoop Unseen Sunscreen Invisible Broad Spectrum SPF 40'
}
weaviate_client = weaviate.Client(
    url=os.getenv('WCS_URL'),
    auth_client_secret=weaviate.auth.AuthApiKey(os.getenv('WCS_KEY')),
)
oai_client = OpenAI(api_key=os.environ.get("OPENAI_APIKEY"))





@socket_router.websocket("/sockets/sephora")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    while True:
        input_obj = json.loads(await websocket.receive_text())


        query = input_obj['query']
        product_id = input_obj['product_id']

        llm_prompt = ''

        query_vector = (
            oai_client.embeddings.create(
                input=query, model="text-embedding-3-small", dimensions=1536
            )
            .data[0]
            .embedding
        )

        search_results = weaviate_client.query.get("SephoraGpt", ['rating', 'type', 'text', 'title', 'product_id']
        ).with_where({'path': 'product_id', 'valueText': product_id, "operator": "Equal"}
        ).with_near_vector( #P88779809
        {'vector': query_vector}
        ).with_limit(300).do()

        data_for_pongo = []


        i = 0
        for cur_result in search_results['data']['Get']['SephoraGpt']:

            if cur_result['type'] == 'review':
                metadata = {}
                if 'review_title' in cur_result:
                    metadata = {
                    'title': cur_result['review_title'],
                }

                data_for_pongo.append({'text': cur_result['text'], 
                    'metadata': metadata, 
                    'rating': cur_result['rating'],
                    'type': 'review',
                'id': i})

            else: #question
                data_for_pongo.append({'text': cur_result['text'], 
                    'type': 'question',
                'id': i})


            
            i+=1
        
        filtered_results = pongo_client.filter(query=query, docs=data_for_pongo, num_results=10, public_metadata_field="metadata", key_field="id", text_field='text')
        filtered_body = filtered_results.json()
        await websocket.send_text("JSON_STRING:" + json.dumps(filtered_body))

        sources_string = ''
        i = 0
        while (i < 10):
            cur_source = filtered_body[i] 

            if(len(sources_string) > 10000):
                break
            
            if cur_source['type'] == 'review':
                title = ''
                if 'title' in cur_source['metadata']:
                    title = f"Title: {cur_source['metadata']['title']}\n"

                sources_string += f'''Source #{i+1} (review): \n{title} {cur_source['text']}\n\n'''

            else:
                sources_string += f'''Source #{i+1} (question & answer): {cur_source['text']}\n\n'''

            i+=1

    

        llm_prompt = f'''Plesae concisely answer the following question about "{product_ids_to_names[product_id]}" using ONLY the reviews and Q&A's from provided at the bottom of this prompt.  If the question cannot be answered from the sources, then just say so. 
        Make sure you cite each source used inline with ONLY the source number wrapped in brackets, so you would cite Source #2 as just "[2]".
        DO NOT include a list of references at the end, only use inline citations as previously described.
        Provide your answer in valid markdown format.

        Question: {query}

        Sources: {sources_string}'''

        groq_completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": llm_prompt}],
            stream=True,
            temperature=0.2,
        )

        if int(groq_completion.response.headers.get('x-ratelimit-remaining-tokens', 0)) > 500 and groq_completion.response.status_code != 429:
            completion_to_use = groq_completion
            
        
        else: #prefer groq, but fallback to together
            completion_to_use = together_client.chat.completions.create(
            model="META-LLAMA/LLAMA-3-70B-CHAT-HF",
            messages=[{"role": "user", "content": llm_prompt}],
            stream=True,
            temperature=0.2,
        )


        for chunk in completion_to_use:
            if isinstance(chunk.choices[0].delta.content, str):
                await websocket.send_text(chunk.choices[0].delta.content)

        

        
        
        



        

