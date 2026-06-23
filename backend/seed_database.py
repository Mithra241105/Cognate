import asyncio
import os
from types import SimpleNamespace
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from ml_engine import VectorEngine
from classifier import classify_question_topic, classify_cognitive_level, initialize_topic_centroids, initialize_cognitive_centroids

load_dotenv()

PRO_MAX_SEED_DATA = [
    'What is the fundamental theorem of calculus?', 'How do you calculate the derivative of sin(x)?', 'Explain the difference between rational and irrational numbers.', 'What is the Pythagorean theorem?', 'How do you solve a system of linear equations?', 'What is the definition of a prime number?', 'How do eigenvectors transform in a matrix space?', 'What is the probability of rolling a seven with two dice?', 'Derive the quadratic formula by completing the square.', 'Evaluate the convergence of a Taylor series.',
    'What is the exact speed of light in a perfect vacuum?', 'How does gravity warp the fabric of space-time?', 'Explain the principles of thermodynamics and entropy.', 'What is the difference between kinetic and potential energy?', 'How do quantum particles demonstrate wave-particle duality?', 'Describe the mathematical breakdown of general relativity at a singularity.', 'What is the definition of a photon?', 'How does magnetic induction generate an electric current?', 'Calculate the terminal velocity of a falling object.', 'Why is the conservation of momentum critical in isolated systems?',
    'What is a virus and how does it replicate?', 'How do white blood cells identify foreign pathogens?', 'Explain the replication process of DNA during mitosis.', 'What role does ATP play in cellular respiration?', 'How do chloroplasts convert solar energy into glucose?', 'What is the difference between RNA and DNA?', 'Analyze the structural integrity of the phospholipid bilayer.', 'Evaluate the ethical implications of using CRISPR-Cas9.', 'How do vaccines trigger an immune system response?', 'Describe the function of ribosomes in protein synthesis.',
    'What is the time complexity of a binary search algorithm?', 'Explain the difference between TCP and UDP protocols.', 'How does a hash map resolve memory collisions?', 'What is the definition of object-oriented polymorphism?', 'How does a B-tree index optimize read-heavy databases?', 'Why is Dijkstra algorithm incapable of handling negative edge weights?', 'What is the difference between a stack and a queue?', 'Evaluate the performance trade-offs of NoSQL vs SQL.', 'How does garbage collection manage memory in Java?', 'Describe the OSI model layers in network communications.'
]

async def seed_db():
    print("Initializing Enterprise Seeder...")
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI not found in .env — cannot seed.")
        
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_database("app_db")
    
    print("Executing Hard Reset: Purging stale vectors from MongoDB...")
    await db.questions.drop()
    
    engine = VectorEngine()
    
    app_state = SimpleNamespace()
    app_state.vector_engine = engine
    initialize_topic_centroids(app_state)
    initialize_cognitive_centroids(app_state)
    
    documents = []
    
    for i, text in enumerate(PRO_MAX_SEED_DATA):
        print(f"  [{i + 1:02d}/{len(PRO_MAX_SEED_DATA)}] {text[:60]}...")
        vector = engine.get_embedding(text)
        
        subject_result = classify_question_topic(vector, text, app_state)
        cognitive_result = classify_cognitive_level(vector, app_state)
        
        subject_tag = subject_result["tag"]
        cognitive_tag = cognitive_result["tag"]
        
        documents.append({
            "user_email": "system@seed.internal",
            "question": text,
            "vector": vector,
            "topic_tag": subject_tag,
            "cognitive_level": cognitive_tag
        })
        print(f"         -> {subject_tag} | {cognitive_tag}")
        
    print(f"\nBulk inserting {len(documents)} highly complex vectors into MongoDB...")
    await db.questions.insert_many(documents)
    print(f"[DONE] Successfully seeded {len(PRO_MAX_SEED_DATA)} highly complex vectors.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_db())
