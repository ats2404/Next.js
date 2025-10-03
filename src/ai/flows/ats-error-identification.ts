'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying potential ATS parsing errors in a resume.
 *
 * The flow takes resume content as input and uses generative AI to identify potential ATS parsing errors and areas for improvement.
 * It exports:
 *   - `identifyAtsErrors`: A function that takes resume content and returns a promise with the identified errors and suggestions.
 *   - `IdentifyAtsErrorsInput`: The input type for the `identifyAtsErrors` function.
 *   - `IdentifyAtsErrorsOutput`: The output type for the `identifyAtsErrors` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyAtsErrorsInputSchema = z.object({
  resumeContent: z
    .string()
    .describe('The text content of the resume to be analyzed.'),
});
export type IdentifyAtsErrorsInput = z.infer<typeof IdentifyAtsErrorsInputSchema>;

const IdentifyAtsErrorsOutputSchema = z.object({
  atsErrorAnalysis: z
    .string()
    .describe(
      'An analysis of the resume content, identifying potential ATS parsing errors and areas for improvement.'
    ),
});
export type IdentifyAtsErrorsOutput = z.infer<typeof IdentifyAtsErrorsOutputSchema>;

const identifyAtsErrorsPrompt = ai.definePrompt({
  name: 'identifyAtsErrorsPrompt',
  input: {schema: IdentifyAtsErrorsInputSchema},
  output: {schema: IdentifyAtsErrorsOutputSchema},
  prompt: `You are an expert in Applicant Tracking Systems (ATS) and resume parsing.

  Analyze the following resume content and identify potential parsing errors that might occur when processed by an ATS.
  Provide specific suggestions for improvement to ensure the resume is accurately processed.

  Resume Content:
  {{resumeContent}}
  `,
});

const identifyAtsErrorsFlow = ai.defineFlow(
  {
    name: 'identifyAtsErrorsFlow',
    inputSchema: IdentifyAtsErrorsInputSchema,
    outputSchema: IdentifyAtsErrorsOutputSchema,
  },
  async input => {
    const {output} = await identifyAtsErrorsPrompt(input);
    return output!;
  }
);

export async function identifyAtsErrors(input: IdentifyAtsErrorsInput): Promise<IdentifyAtsErrorsOutput> {
  return identifyAtsErrorsFlow(input);
}
