'use server';

import { analyzeResumeForATSCompatibility } from '@/ai/flows/ats-compatibility-check';
import { extractKeywords } from '@/ai/flows/keyword-extraction-from-job-description';
import { identifyAtsErrors } from '@/ai/flows/ats-error-identification';

export interface AnalysisResults {
  compatibilityReport: string;
  extractedKeywords: string[];
  errorAnalysis: string;
}

export async function runFullAnalysis(
  resumeText: string,
  jobDescription: string
): Promise<AnalysisResults> {
  if (!resumeText || !jobDescription) {
    throw new Error('Resume and Job Description are required.');
  }

  try {
    const [compatibilityResult, keywordsResult, errorsResult] = await Promise.all([
      analyzeResumeForATSCompatibility({ resumeText }),
      extractKeywords({ jobDescription }),
      identifyAtsErrors({ resumeContent: resumeText }),
    ]);

    return {
      compatibilityReport: compatibilityResult.atsCompatibilityReport,
      extractedKeywords: keywordsResult.keywords,
      errorAnalysis: errorsResult.atsErrorAnalysis,
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw new Error("Failed to analyze the documents. Please try again.");
  }
}
