
export function calculateTermFrequencies(terms: string[]): Record<string, number> {
  const frequencies: Record<string, number> = {};
  for (const term of terms) {
    frequencies[term] = (frequencies[term] || 0) + 1;
  }
  return frequencies;
}

export function calculateInverseDocumentFrequencies(allTermsInDocuments: string[][]): Record<string, number> {
  const N = allTermsInDocuments.length;
  const ntList: Record<string, number> = {};

  for (const documentTerms of allTermsInDocuments) {
    const uniqueTokens = new Set(documentTerms);
    for (const token of uniqueTokens) {
      ntList[token] = (ntList[token] || 0) + 1;
    }
  }

  const idfWeights: Record<string, number> = {};
  for (const term in ntList) {
    // log = natural log
    idfWeights[term] = Math.log(N / (1 + ntList[term])) + 1;
  }

  return idfWeights;
}

export function calculateTfidfVector(tf: Record<string, number>, idfWeights: Record<string, number>): Record<string, number> {
  const tfidfVector: Record<string, number> = {};
  for (const term in tf) {
    if (term in idfWeights) {
      tfidfVector[term] = tf[term] * idfWeights[term];
    } else {
      tfidfVector[term] = tf[term];
    }
  }
  return tfidfVector;
}

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0.0;
  }
  
  const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return parseFloat((similarity * 100).toFixed(4));
}