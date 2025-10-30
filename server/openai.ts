import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || '',
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function generateMeetingSummary(
  meetingTitle: string,
  meetingDescription: string | null,
  targetLanguage: string = 'en'
): Promise<string> {
  const languageMap: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    hi: 'Hindi',
    bn: 'Bengali',
    ta: 'Tamil',
    te: 'Telugu',
    mr: 'Marathi',
    gu: 'Gujarati',
    kn: 'Kannada',
    ml: 'Malayalam',
    pa: 'Punjabi',
    ur: 'Urdu',
    vi: 'Vietnamese',
    th: 'Thai',
    id: 'Indonesian',
    nl: 'Dutch',
    tr: 'Turkish',
    pl: 'Polish',
    sv: 'Swedish',
    no: 'Norwegian',
    da: 'Danish',
  };

  const languageName = languageMap[targetLanguage] || 'English';

  const prompt = `You are a professional meeting assistant. Generate a concise meeting summary based on the following information:

Meeting Title: ${meetingTitle}
${meetingDescription ? `Meeting Description: ${meetingDescription}` : ''}

Create a brief, professional summary that includes:
1. Meeting purpose
2. Key topics to discuss
3. Expected outcomes

Keep the summary concise (3-5 sentences) and in ${languageName} language.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional meeting assistant that creates clear, concise summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    throw new Error('Failed to generate meeting summary');
  }
}
