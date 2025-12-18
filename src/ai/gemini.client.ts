import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiClient {
  private readonly endpoint =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  async generate(prompt: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }

    const res = await fetch(`${this.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini API error: ${text}`);
    }

    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      ''
    );
  }
}
