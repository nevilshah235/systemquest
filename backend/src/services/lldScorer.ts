// LLD Phase scorer — evaluates class design, API contracts, and data schema

export interface LLDSubmission {
  classDesign: string;
  apiContracts: string;
  dataSchema: string;
}

export interface LLDFeedbackItem {
  type: 'success' | 'warning' | 'error';
  dimension: 'classDesign' | 'apiContracts' | 'dataSchema' | 'overall';
  message: string;
}

export interface LLDScoreResult {
  score: number; // 0-100
  xpEarned: number;
  feedback: LLDFeedbackItem[];
  breakdown: {
    classDesign: number;   // 0-40
    apiContracts: number;  // 0-35
    dataSchema: number;    // 0-25
  };
}

const WORD_THRESHOLD = 20; // minimum words per section to be considered non-empty

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasApiPatterns(text: string): boolean {
  return /\b(GET|POST|PUT|DELETE|PATCH)\b/i.test(text) ||
    /\/(api|v\d|endpoint)/i.test(text) ||
    text.includes('→') || text.includes('->') || text.includes(':');
}

function hasSchemaPatterns(text: string): boolean {
  return /(table|collection|schema|column|field|index|pk|fk|id|created_at)/i.test(text) ||
    /\b(int|string|varchar|text|boolean|timestamp|uuid)\b/i.test(text);
}

function hasClassPatterns(text: string): boolean {
  return /(class|entity|model|service|repository|interface|struct)/i.test(text) ||
    /(method|field|attribute|property|\(\))/i.test(text);
}

export function scoreLLDSubmission(
  submission: LLDSubmission,
  missionSlug: string,
): LLDScoreResult {
  const feedback: LLDFeedbackItem[] = [];
  let classScore = 0;
  let apiScore = 0;
  let dataScore = 0;

  // ── Class Design (0-40) ────────────────────────────────────────────────────
  const classWords = countWords(submission.classDesign);
  if (classWords < WORD_THRESHOLD) {
    feedback.push({ type: 'error', dimension: 'classDesign', message: 'Class design is too brief — describe your key entities, their attributes, and relationships.' });
  } else {
    classScore += 20; // base for non-trivial response
    if (hasClassPatterns(submission.classDesign)) {
      classScore += 15;
      feedback.push({ type: 'success', dimension: 'classDesign', message: 'Good — you\'ve identified core classes/entities and their roles.' });
    } else {
      feedback.push({ type: 'warning', dimension: 'classDesign', message: 'Consider naming specific classes, their methods, and relationships (e.g. User, Message, Conversation).' });
    }
    if (classWords > 80) classScore += 5; // bonus for depth
  }

  // ── API Contracts (0-35) ────────────────────────────────────────────────────
  const apiWords = countWords(submission.apiContracts);
  if (apiWords < WORD_THRESHOLD) {
    feedback.push({ type: 'error', dimension: 'apiContracts', message: 'API contracts are too sparse — define your key endpoints with method, path, and request/response shape.' });
  } else {
    apiScore += 15;
    if (hasApiPatterns(submission.apiContracts)) {
      apiScore += 15;
      feedback.push({ type: 'success', dimension: 'apiContracts', message: 'Good — endpoints are clearly defined with HTTP methods and paths.' });
    } else {
      feedback.push({ type: 'warning', dimension: 'apiContracts', message: 'Use HTTP verbs (GET, POST, PUT, DELETE) and clear path patterns like /messages/:id.' });
    }
    if (apiWords > 60) apiScore += 5;
  }

  // ── Data Schema (0-25) ────────────────────────────────────────────────────
  const dataWords = countWords(submission.dataSchema);
  if (dataWords < WORD_THRESHOLD) {
    feedback.push({ type: 'error', dimension: 'dataSchema', message: 'Data schema is too brief — define your tables/collections with key fields and data types.' });
  } else {
    dataScore += 10;
    if (hasSchemaPatterns(submission.dataSchema)) {
      dataScore += 10;
      feedback.push({ type: 'success', dimension: 'dataSchema', message: 'Good — schema includes field definitions and data types.' });
    } else {
      feedback.push({ type: 'warning', dimension: 'dataSchema', message: 'Define specific fields with types (e.g. id UUID, content TEXT, created_at TIMESTAMP).' });
    }
    if (dataWords > 50) dataScore += 5;
  }

  const totalScore = Math.min(100, classScore + apiScore + dataScore);

  if (totalScore >= 80) {
    feedback.push({ type: 'success', dimension: 'overall', message: 'Excellent LLD! Your design demonstrates strong understanding of component responsibilities, API contracts, and data modelling.' });
  } else if (totalScore >= 50) {
    feedback.push({ type: 'warning', dimension: 'overall', message: 'Solid start. Deepen the missing sections to reach a production-quality LLD.' });
  } else {
    feedback.push({ type: 'error', dimension: 'overall', message: 'LLD needs more detail across all three dimensions — class design, API contracts, and data schema.' });
  }

  const xpEarned = Math.round((totalScore / 100) * 150); // up to 150 XP for LLD

  return {
    score: totalScore,
    xpEarned,
    feedback,
    breakdown: { classDesign: classScore, apiContracts: apiScore, dataSchema: dataScore },
  };
}
