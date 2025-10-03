import { config } from 'dotenv';
config();

import '@/ai/flows/ats-compatibility-check.ts';
import '@/ai/flows/keyword-extraction-from-job-description.ts';
import '@/ai/flows/ats-error-identification.ts';