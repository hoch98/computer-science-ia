// lib/textProcessor.ts

// Standard list of official NLTK English stopwords
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
  'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
  'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
  'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
  'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', "don't", 'should',
  "should've", 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', "aren't", 'couldn', "couldn't",
  'didn', "didn't", 'doesn', "doesn't", 'hadn', "hadn't", 'hasn', "hasn't", 'haven', "haven't", 'isn', "isn't",
  'ma', 'mightn', "mightn't", 'mustn', "mustn't", 'needn', "needn't", 'shan', "shan't", 'shouldn', "shouldn't",
  'wasn', "wasn't", 'weren', "weren't", 'won', "won't", 'wouldn', "wouldn't"
]);

/**
 * Replicates TextProcessor.process_description from text_processor.py
 * Lowercases text, splits out punctuation marks, ignores stopwords, and handles light lemmatization rules.
 */
export function processDescription(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Step 1: Case Normalization and Tokenization
  // Isolates individual alphanumeric word elements (removes standalone punctuation blocks like '.', '!', '?')
  const rawTokens = text.toLowerCase().match(/\b\w+\b/g) || [];
  const processedTokens: string[] = [];

  // Step 2: Filtration and Suffix Lemmatisation
  for (const token of rawTokens) {
    // Exclude matching grammar stopwords
    if (!STOP_WORDS.has(token)) {
      let rootToken = token;

      // Clean morphological plural/noun extensions if word is sufficiently long
      if (rootToken.endsWith('ies') && rootToken.length > 5) {
        rootToken = rootToken.slice(0, -3) + 'y';
      } else if (rootToken.endsWith('s') && !rootToken.endsWith('ss') && rootToken.length > 3) {
        rootToken = rootToken.slice(0, -1);
      }

      // Filter out single-character remnants or leftover junk symbols
      if (rootToken.length > 1) {
        processedTokens.push(rootToken);
      }
    }
  }

  return processedTokens;
}