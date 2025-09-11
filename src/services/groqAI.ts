import Groq from 'groq-sdk';
import { GlossaryTerm, GrammarError } from '../types';

class GroqAIService {
  private groq: Groq | null = null;
  private apiKey: string | null = null;
  
  initialize(apiKey: string): void {
    if (!apiKey) {
      console.error('Groq API key is required');
      return;
    }
    
    this.apiKey = apiKey;
    this.groq = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  
  isReady(): boolean {
    return this.groq !== null;
  }
  
  async generateSummary(content: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise 1-2 line summaries of text content. Keep summaries brief and informative.'
          },
          {
            role: 'user',
            content: `Please summarize the following text in 1-2 lines:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 100,
      });
      
      return response.choices[0]?.message?.content || 'Unable to generate summary';
    } catch (error) {
      console.error('Failed to generate summary:', error);
      throw error;
    }
  }
  
  async suggestTags(content: string): Promise<string[]> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that suggests relevant tags for text content. Return exactly 3-5 tags as a comma-separated list. Tags should be single words or short phrases, lowercase, no special characters.'
          },
          {
            role: 'user',
            content: `Suggest 3-5 relevant tags for the following text:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.5,
        max_tokens: 50,
      });
      
      const tagsText = response.choices[0]?.message?.content || '';
      const tags = tagsText
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length < 30)
        .slice(0, 5);
      
      return tags;
    } catch (error) {
      console.error('Failed to suggest tags:', error);
      return [];
    }
  }
  
  async findGlossaryTerms(content: string): Promise<GlossaryTerm[]> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that identifies key technical terms, concepts, or jargon in text that might need explanation. 
            Return a JSON object with this exact structure: {"terms": [{"term": "term", "definition": "brief definition"}]}. 
            Find up to 5 most important terms. Only include terms that are actually present in the text.`
          },
          {
            role: 'user',
            content: `Identify key terms that need definitions in this text:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
      
      const responseText = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsed = JSON.parse(responseText);
        const terms = Array.isArray(parsed.terms) ? parsed.terms : (Array.isArray(parsed) ? parsed : []);
        
        const glossaryTerms: GlossaryTerm[] = [];
        const lowerContent = content.toLowerCase();
        
        for (const item of terms) {
          if (item.term && item.definition) {
            const termLower = item.term.toLowerCase();
            const index = lowerContent.indexOf(termLower);
            
            if (index !== -1) {
              glossaryTerms.push({
                term: item.term,
                definition: item.definition,
                startIndex: index,
                endIndex: index + item.term.length,
              });
            }
          }
        }
        
        return glossaryTerms.slice(0, 5);
      } catch (parseError) {
        console.error('Failed to parse glossary terms:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Failed to find glossary terms:', error);
      return [];
    }
  }
  
  async checkGrammar(content: string): Promise<GrammarError[]> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a grammar and spelling checker. Analyze the text and return a JSON object with this exact structure: {"errors": [{"text": "incorrect text", "suggestion": "corrected text", "type": "spelling|grammar|punctuation"}]}.
            Only include actual errors, not style suggestions. Return maximum 10 most important errors.`
          },
          {
            role: 'user',
            content: `Check for grammar and spelling errors in this text:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });
      
      const responseText = response.choices[0]?.message?.content || '{}';
      
      try {
        const parsed = JSON.parse(responseText);
        const errors = Array.isArray(parsed.errors) ? parsed.errors : (Array.isArray(parsed) ? parsed : []);
        
        const grammarErrors: GrammarError[] = [];
        const lowerContent = content.toLowerCase();
        
        for (const error of errors) {
          if (error.text && error.suggestion) {
            const errorTextLower = error.text.toLowerCase();
            const index = lowerContent.indexOf(errorTextLower);
            
            if (index !== -1) {
              grammarErrors.push({
                text: error.text,
                suggestion: error.suggestion,
                startIndex: index,
                endIndex: index + error.text.length,
                type: error.type || 'grammar',
              });
            }
          }
        }
        
        return grammarErrors.slice(0, 10);
      } catch (parseError) {
        console.error('Failed to parse grammar errors:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Failed to check grammar:', error);
      return [];
    }
  }
  
  async translateText(content: string, targetLanguage: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the text accurately to ${targetLanguage}. Maintain the original formatting, HTML tags, and structure. Preserve any markdown formatting, links, and styling. Only translate the text content, not the HTML structure.`
          },
          {
            role: 'user',
            content: `Translate the following text to ${targetLanguage}:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 2000,
      });
      
      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('Failed to translate text:', error);
      throw error;
    }
  }

  getSupportedLanguages(): Array<{code: string, name: string, nativeName: string}> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    ];
  }
  
  async getDefinition(term: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides clear, concise definitions. Keep definitions brief (1-2 sentences) and easy to understand.'
          },
          {
            role: 'user',
            content: `Define: ${term}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.3,
        max_tokens: 100,
      });
      
      return response.choices[0]?.message?.content || 'No definition available';
    } catch (error) {
      console.error('Failed to get definition:', error);
      return 'Unable to fetch definition';
    }
  }
  async generateMeetLink(content: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a JSON-only response assistant. You MUST respond with ONLY valid JSON, no other text.

TASK: Analyze text for meeting date and time, then respond with JSON.

RULES:
1. Look for clear date AND time patterns: "meeting on [date] at [time]", "call tomorrow at 2 PM", "scheduled for [date] [time]"
2. If date AND time found: {"hasDateTime": true, "meetLink": "https://meet.google.com/abc-def-ghi"}
3. If no clear date/time: {"hasDateTime": false, "message": "No date and time detected"}
4. Meet link format: https://meet.google.com/[3letters]-[3letters]-[3letters]
5. RESPOND WITH ONLY JSON, NO OTHER TEXT`
          },
          {
            role: 'user',
            content: `Analyze this text for meeting date and time:\n\n${content}\n\nRespond with JSON only.`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 100,
      });
      
      const responseContent = response.choices[0]?.message?.content;
      if (!responseContent) return 'Error Generating Link';

      let cleanResponse = responseContent.trim();
      
      const jsonMatch = cleanResponse.match(/\{.*\}/s);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      try {
        const jsonResponse = JSON.parse(cleanResponse);
        
        if (jsonResponse.hasDateTime === false) {
          return 'NO_DATE_TIME_DETECTED';
        }
        
        if (jsonResponse.hasDateTime === true && jsonResponse.meetLink) {
          return jsonResponse.meetLink;
        }
        
        return 'NO_DATE_TIME_DETECTED';
      } catch (error) {
        console.error('Failed to parse meet link response:', error);
        console.error('Raw response:', responseContent);
        return 'NO_DATE_TIME_DETECTED';
      }
    } catch (error) {
      console.error('Failed to generate meet link:', error);
      throw error;
    }
  }
  
  async improveWriting(content: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Groq AI service not initialized');
    }
    
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a professional editor. Improve the clarity, flow, and professionalism of the text while maintaining the original meaning and tone. Fix any grammar or spelling issues.'
          },
          {
            role: 'user',
            content: `Please improve the following text:\n\n${content}`
          }
        ],
        model: 'llama-3.1-8b-instant',
        temperature: 0.4,
        max_tokens: 2000,
      });
      
      return response.choices[0]?.message?.content || content;
    } catch (error) {
      console.error('Failed to improve writing:', error);
      throw error;
    }
  }
}



export const groqAIService = new GroqAIService();
