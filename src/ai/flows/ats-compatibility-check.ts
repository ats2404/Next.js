'use server';

/**
 * @fileOverview This flow analyzes resume content to identify elements that may cause issues with Applicant Tracking Systems.
 *
 * - analyzeResumeForATSCompatibility - A function that analyzes resume content for ATS compatibility.
 * - ATSCompatibilityInput - The input type for the analyzeResumeForATSCompatibility function.
 * - ATSCompatibilityOutput - The return type for the analyzeResumeForATSCompatibility function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ATSCompatibilityInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the resume to be analyzed.'),
});
export type ATSCompatibilityInput = z.infer<typeof ATSCompatibilityInputSchema>;

const ATSCompatibilityOutputSchema = z.object({
  atsCompatibilityReport: z
    .string()
    .describe(
      'A report identifying potential ATS parsing errors and areas for improvement in the resume.'
    ),
});
export type ATSCompatibilityOutput = z.infer<typeof ATSCompatibilityOutputSchema>;

export async function analyzeResumeForATSCompatibility(
  input: ATSCompatibilityInput
): Promise<ATSCompatibilityOutput> {
  return analyzeResumeForATSCompatibilityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'atsCompatibilityPrompt',
  input: {schema: ATSCompatibilityInputSchema},
  output: {schema: ATSCompatibilityOutputSchema},
  prompt: `You are an expert in Applicant Tracking Systems (ATS) and resume optimization.

  Analyze the provided resume content and identify any elements that may cause issues with ATS parsing.
  Provide a detailed report with specific recommendations for improvement.

  Resume Content: {{{resumeText}}}

  Report Format: Clearly list potential issues and provide actionable steps to resolve them. Focus on formatting, keyword usage, and content structure.`,
});

const analyzeResumeForATSCompatibilityFlow = ai.defineFlow(
  {
    name: 'analyzeResumeForATSCompatibilityFlow',
    inputSchema: ATSCompatibilityInputSchema,
    outputSchema: ATSCompatibilityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
