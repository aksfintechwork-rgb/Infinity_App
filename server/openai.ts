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

  const prompt = `You are an expert meeting facilitator and professional business analyst. Generate a comprehensive, well-structured meeting summary based on the following information:

Meeting Title: ${meetingTitle}
${meetingDescription ? `Meeting Description: ${meetingDescription}` : ''}

Create a detailed, professional summary that includes:
1. **Meeting Objective**: Clear statement of the meeting's primary purpose and goals
2. **Key Topics & Discussion Points**: Specific areas to be covered, organized by priority
3. **Expected Outcomes & Deliverables**: Concrete results, decisions, or action items anticipated
4. **Participants' Roles**: How team members should prepare or contribute
5. **Success Criteria**: What would make this meeting productive and successful

Format the summary in a clear, structured manner with appropriate headings or bullet points. Make it actionable and specific rather than generic. The summary should be comprehensive enough (5-8 sentences or bullet points) to give participants a complete understanding of what to expect.

Provide the entire summary in ${languageName} language, maintaining professional business terminology.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert meeting facilitator and business analyst specializing in creating comprehensive, actionable meeting summaries. Your summaries are detailed, well-structured, and provide clear value to meeting participants.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate summary';
  } catch (error) {
    console.error('Error generating meeting summary:', error);
    throw new Error('Failed to generate meeting summary');
  }
}
