"""
Cognate — Vector Similarity Classifier.

Provides centroid-based topic and cognitive-level classification using
cosine similarity against pre-computed semantic anchor embeddings.
A disambiguation matrix applies rule-based score corrections for
vocabulary that produces ambiguous embeddings across subject domains.
"""

from vector_math import calculate_cosine_similarity


SUBJECT_CENTROIDS = {
    "Mathematics": (
        "Mathematics, calculus, algebra, geometry, probability, statistics, number theory, "
        "differential equations, partial derivatives, integrals, theorems, linear algebra, "
        "eigenvalues, eigenvectors, determinants, matrices, vector spaces, basis, span, "
        "orthogonality, Fourier series, Laplace transform, complex analysis, topology, "
        "manifolds, homeomorphism, metric spaces, real analysis, epsilon-delta, continuity, "
        "compactness, Riemann integral, Lebesgue measure, abstract algebra, group theory, "
        "ring theory, field extensions, Galois theory, combinatorics, graph theory, "
        "discrete mathematics, modular arithmetic, prime factorization, cryptographic number theory, "
        "stochastic processes, Markov chains, Bayesian inference, hypothesis testing, "
        "regression analysis, multivariate calculus, gradient, divergence, curl, "
        "tensor calculus, differential geometry, curvature, geodesic, Taylor series, "
        "convergence, divergence of series, proof by induction, contradiction, bijection, "
        "cardinality, set theory, Cantor, infinity, limit, asymptote, logarithm, exponent."
    ),
    "Physics": (
        "Physics, classical mechanics, quantum mechanics, thermodynamics, electromagnetism, "
        "general relativity, special relativity, statistical mechanics, fluid dynamics, "
        "optics, wave mechanics, particle physics, nuclear physics, condensed matter, "
        "bosons, fermions, quarks, leptons, photons, gluons, Higgs boson, Standard Model, "
        "Schrodinger equation, wave function, superposition, entanglement, uncertainty principle, "
        "Planck constant, de Broglie wavelength, quantum tunneling, spin, orbital, "
        "Maxwell equations, electromagnetic induction, Faraday law, Gauss law, Lorentz force, "
        "electric field, magnetic field, capacitance, inductance, impedance, "
        "entropy, enthalpy, Gibbs free energy, Carnot cycle, heat engine, second law of thermodynamics, "
        "Boltzmann constant, ideal gas law, kinetic theory, phase transitions, "
        "Newton laws, conservation of momentum, conservation of energy, gravitational potential, "
        "orbital mechanics, Kepler laws, escape velocity, black holes, spacetime curvature, "
        "tensor, Riemann tensor, geodesic equation, dark matter, dark energy, cosmology, "
        "kinematics, acceleration, velocity, projectile, torque, angular momentum."
    ),
    "Biology": (
        "Biology, molecular genetics, cellular biology, evolutionary theory, biochemistry, "
        "anatomy, physiology, microbiology, immunology, neuroscience, ecology, bioinformatics, "
        "CRISPR, gene editing, DNA replication, transcription, translation, RNA polymerase, "
        "ribosomes, codons, amino acids, polypeptides, protein folding, enzyme kinetics, "
        "Michaelis-Menten, ATP synthesis, cellular respiration, glycolysis, Krebs cycle, "
        "electron transport chain, oxidative phosphorylation, photosynthesis, chloroplasts, "
        "mitochondria, endoplasmic reticulum, Golgi apparatus, lysosomes, cell membrane, "
        "phospholipid bilayer, osmosis, active transport, signal transduction, "
        "mitosis, meiosis, cell cycle, apoptosis, cancer biology, oncogenes, tumor suppressors, "
        "Mendelian genetics, phenotypes, genotypes, alleles, dominant, recessive, "
        "Hardy-Weinberg equilibrium, natural selection, genetic drift, speciation, phylogenetics, "
        "nucleotides, purines, pyrimidines, double helix, chromosome, karyotype, "
        "immune response, antibodies, antigens, T-cells, B-cells, cytokines, inflammation, "
        "virus, bacteria, prokaryotes, eukaryotes, archaea, symbiosis, mutualism."
    ),
    "Computer Science": (
        "Computer science, algorithms, data structures, computational complexity, operating systems, "
        "computer networks, database systems, software engineering, artificial intelligence, "
        "machine learning, deep learning, neural networks, natural language processing, "
        "binary trees, AVL trees, red-black trees, heaps, hash tables, graphs, adjacency matrix, "
        "depth-first search, breadth-first search, Dijkstra, dynamic programming, memoization, "
        "recursion, divide and conquer, greedy algorithms, backtracking, NP-completeness, "
        "P vs NP, Big-O notation, time complexity, space complexity, amortized analysis, "
        "polymorphism, inheritance, encapsulation, abstraction, design patterns, SOLID principles, "
        "microservices, RESTful APIs, GraphQL, distributed systems, consensus algorithms, "
        "CAP theorem, eventual consistency, distributed ledgers, blockchain, cryptography, "
        "TCP/IP, HTTP, DNS, load balancing, caching, latency, throughput, bandwidth, "
        "relational databases, SQL, normalization, transactions, ACID properties, indexing, "
        "NoSQL, document stores, key-value stores, column-family, eventual consistency, "
        "virtual memory, paging, segmentation, process scheduling, concurrency, deadlock, "
        "compilers, lexer, parser, abstract syntax tree, code generation, optimization, "
        "version control, continuous integration, containerization, orchestration, cloud computing."
    )
}

COGNITIVE_CENTROIDS = {
    "Recall":    "What is, define, state, identify, list, describe, basic facts, definitions, terminology, memorization, fundamental theorem.",
    "Apply":     "How to, calculate, solve, implement, use, demonstrate, construct, derive, execute algorithms, techniques used to handle situations, mechanisms involved.",
    "Evaluate":  "Analyze, compare, contrast, evaluate, trade-offs, why does, assess, critique, systemic implications, theoretical difference, advantages, disadvantages."
}

DISAMBIGUATION_MATRIX = {
    "computer": {"boost": "Computer Science", "penalize": "Biology", "penalty_factor": 0.4, "boost_factor": 1.3},
    "software": {"boost": "Computer Science", "penalize": "Biology", "penalty_factor": 0.4, "boost_factor": 1.3},
    "digital":  {"boost": "Computer Science", "penalize": "Biology", "penalty_factor": 0.4, "boost_factor": 1.3},
    "app":      {"boost": "Computer Science", "penalize": "Biology", "penalty_factor": 0.4, "boost_factor": 1.3},
    "server":   {"boost": "Computer Science", "penalize": "Biology", "penalty_factor": 0.4, "boost_factor": 1.3}
}

JUNK_ANCHORS = [
    "weather", "recipe", "movie", "film", "song", "music", "sports", "score",
    "restaurant", "food", "news", "flight", "hotel", "travel", "shopping",
    "celebrity", "gossip", "stock", "crypto", "meme", "joke"
]


def initialize_topic_centroids(app_state):
    """
    Pre-computes and caches topic centroid vectors on the app state object.

    Called during application startup so that classification at inference time
    is a pure cosine similarity lookup with no embedding overhead.
    """
    centroids = {}
    for topic, definition in SUBJECT_CENTROIDS.items():
        centroids[topic] = app_state.vector_engine.get_embedding(definition)
    app_state.topic_centroids = centroids


def initialize_cognitive_centroids(app_state):
    """
    Pre-computes and caches cognitive-level centroid vectors on the app state object.

    Mirrors the topic centroid initialization pattern for Bloom's taxonomy levels.
    """
    centroids = {}
    for level, definition in COGNITIVE_CENTROIDS.items():
        centroids[level] = app_state.vector_engine.get_embedding(definition)
    app_state.cognitive_centroids = centroids


def classify_question_topic(vector: list[float], text: str, app_state) -> dict:
    """
    Classifies a question vector into one of the four STEM subject domains.

    Gate order:
      1. Negative lexical anchor check — instantly rejects text containing
         known off-topic vocabulary (JUNK_ANCHORS) before any vector math.
      2. Disambiguation matrix — corrects cosine scores for vocabulary that
         is semantically ambiguous across domains (e.g., 'app', 'server').
      3. Threshold gate — rejects any question whose highest centroid score
         falls below 0.45, returning 'Out of Domain'.
    """
    text_lower = text.lower()

    for junk in JUNK_ANCHORS:
        if junk in text_lower:
            return {"tag": "Out of Domain", "confidence": 0.0}

    scores = {
        topic: calculate_cosine_similarity(vector, centroid)
        for topic, centroid in app_state.topic_centroids.items()
    }

    for anchor, rules in DISAMBIGUATION_MATRIX.items():
        if anchor in text_lower:
            scores[rules["penalize"]] *= rules["penalty_factor"]
            scores[rules["boost"]]    *= rules["boost_factor"]

    top_topic     = max(scores, key=lambda t: scores[t])
    highest_score = scores[top_topic]

    if highest_score < 0.42:
        return {"tag": "Out of Domain", "confidence": highest_score}

    return {"tag": top_topic, "confidence": highest_score}


def classify_cognitive_level(vector: list[float], app_state) -> dict:
    """
    Classifies a question vector into a Bloom's taxonomy cognitive level.

    Returns the level name and its cosine similarity confidence score.
    """
    highest_score = -1.0
    top_level     = ""

    for level, centroid in app_state.cognitive_centroids.items():
        score = calculate_cosine_similarity(vector, centroid)
        if score > highest_score:
            highest_score = score
            top_level     = level

    return {"tag": top_level, "confidence": highest_score}
