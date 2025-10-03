'use server';

/**
 * @fileOverview Extracts relevant keywords from a job description.
 *
 * - extractKeywords - A function that extracts keywords from a job description.
 * - ExtractKeywordsInput - The input type for the extractKeywords function.
 * - ExtractKeywordsOutput - The return type for the extractKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractKeywordsInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description to extract keywords from.'),
});
export type ExtractKeywordsInput = z.infer<typeof ExtractKeywordsInputSchema>;

const ExtractKeywordsOutputSchema = z.object({
  keywords: z.array(z.string()).describe('The extracted keywords.'),
});
export type ExtractKeywordsOutput = z.infer<typeof ExtractKeywordsOutputSchema>;

export async function extractKeywords(
  input: ExtractKeywordsInput
): Promise<ExtractKeywordsOutput> {
  return extractKeywordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractKeywordsPrompt',
  input: {schema: ExtractKeywordsInputSchema},
  output: {schema: ExtractKeywordsOutputSchema},
  prompt: `You are an expert in resume optimization. Your task is to extract the most relevant keywords from a job description. These keywords should reflect the skills, technologies, and qualifications sought by the employer.

Job Description: {{{jobDescription}}}

Extract keywords:`,
});

const extractKeywordsFlow = ai.defineFlow(
  {
    name: 'extractKeywordsFlow',
    inputSchema: ExtractKeywordsInputSchema,
    outputSchema: ExtractKeywordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
