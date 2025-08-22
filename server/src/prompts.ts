import { z } from 'zod';

// Zod schema for response validation
const ResponseSchema = z.object({
  message: z.string(),
  follow_up_question: z.string(),
  suggestion: z.object({
    title: z.string(),
    steps: z.array(z.string())
  }),
  tags: z.array(z.string())
});

// Suggestion buckets for rotation
export const SUGGESTION_BUCKETS = {
  breathing: {
    exercises: [
      {
        title: "Box Breathing",
        steps: ["Breathe in for 4 counts", "Hold for 4", "Exhale for 4", "Hold for 4"]
      },
      {
        title: "4-7-8 Breath",
        steps: ["Inhale for 4 counts", "Hold for 7", "Exhale slowly for 8"]
      },
      {
        title: "Paced Breathing",
        steps: ["Set a 3-second rhythm", "Breathe in and out smoothly", "Focus on the steady pace"]
      }
    ]
  },
  reframe: {
    exercises: [
      {
        title: "Evidence Check",
        steps: ["Notice the thought", "List facts that support it", "List facts that don't"]
      },
      {
        title: "Specific Over Labels",
        steps: ["Notice general labels", "Replace with specific situations", "Focus on changeable aspects"]
      }
    ]
  },
  grounding: {
    exercises: [
      {
        title: "5-4-3-2-1 Senses",
        steps: ["Name 5 things you see", "4 things you feel", "3 things you hear", "2 things you smell", "1 thing you taste"]
      },
      {
        title: "Body Scan",
        steps: ["Start at your toes", "Notice each body part", "Release any tension"]
      }
    ]
  },
  microAction: {
    exercises: [
      {
        title: "2-Minute Reset",
        steps: ["Stand up", "Stretch gently", "Take 3 deep breaths"]
      },
      {
        title: "Quick Environment Change",
        steps: ["Step outside briefly", "Notice the temperature", "Take in the surroundings"]
      }
    ]
  },
  journaling: {
    exercises: [
      {
        title: "Three Wins",
        steps: ["List 3 recent successes", "Note why they matter", "Feel the accomplishment"]
      },
      {
        title: "Values Check-in",
        steps: ["Name one important value", "Note how you lived it today", "Plan one way to express it tomorrow"]
      }
    ]
  }
};

interface PromptContext {
  journal: string;
  mood?: number;
  tags?: string[];
  recent?: Array<{ role: string; text: string }>;
  profile?: { aboutMe?: string };
  lastAssistantOpeners?: string[];
  lastAssistantQuestions?: string[];
  lastSuggestionBucket?: string;
}

const SYSTEM_INSTRUCTION = `You are a warm, empathetic mental wellness companion.

Constraints:
- Be supportive and human. Avoid clinical or diagnostic language.
- Reflect back 1–2 feelings you notice (no more).
- Offer at most ONE gentle, open-ended question only if it meaningfully advances the conversation; otherwise ask none.
- Provide ONE tiny, doable suggestion or exercise (rotate across categories: breath, reframe, grounding, micro-action, journaling prompt).
- Vary your opening line and avoid repeats from the last 10 assistant messages (no template reuse).
- Never ask the same question twice within the last 5 turns. If similar, rephrase or skip.
- Keep it under 120–160 words.
- Do not apologize unless you made a mistake.

Few-shot examples:
1. "I notice you're feeling overwhelmed with all these tasks. 🌸 Sometimes taking one small step can help us feel more in control. Here's a tiny practice: pick the easiest task and break it into 2-minute chunks."

2. "That spark of hope you mentioned – even if it feels small right now – shows such resilience. ✨ Let's build on that with a quick grounding exercise to help you stay connected to that feeling."

3. "The way you're navigating this challenge shows real awareness. 💙 One thing that might help: try writing down three specific moments from today when you felt capable, no matter how small."

Output JSON:
{
  "message": "<human conversational reply>",
  "follow_up_question": "<one optional question or empty string>",
  "suggestion": {"title": "...", "steps": ["...","..."]},
  "tags": ["empathy","reflection","action","(optional tag)"]
}`;

export const counselorPrompt = ({
  journal,
  mood,
  tags = [],
  recent = [],
  profile,
  lastAssistantOpeners = [],
  lastAssistantQuestions = [],
  lastSuggestionBucket
}: PromptContext): string => {
  const contextLines = recent.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
  
  return JSON.stringify({
    journal,
    mood: mood ? `${mood}/10` : 'Not specified',
    tags,
    recent_messages: recent.slice(-3),
    last_assistant_openers: lastAssistantOpeners.slice(-10),
    last_assistant_questions: lastAssistantQuestions.slice(-5),
    last_suggestion_bucket: lastSuggestionBucket,
    user_background: profile?.aboutMe || 'Getting to know them',
    context_note: buildContextNote(recent, profile)
  });
};

function buildContextNote(recent: Array<{ role: string; text: string }>, profile?: { aboutMe?: string }): string {
  // Here we would implement logic to identify patterns and create a context note
  // For now returning a simple note based on available info
  const userMessages = recent.filter(m => m.role === 'user').map(m => m.text);
  const patterns = [];
  
  if (userMessages.some(m => m.toLowerCase().includes('anxious') || m.toLowerCase().includes('anxiety'))) {
    patterns.push('user often expresses anxiety');
  }
  
  if (userMessages.some(m => m.toLowerCase().includes('sleep'))) {
    patterns.push('sleep is a recurring theme');
  }
  
  return patterns.length ? patterns.join('; ') : '';
}

export const backupPrompt = ({
  journal,
  mood,
  tags = [],
  recent = [],
  profile,
  lastAssistantOpeners = [],
  lastAssistantQuestions = []
}: PromptContext): string => {
  // Simplified backup prompt for fallback scenarios
  return JSON.stringify({
    journal,
    mood: mood ? `${mood}/10` : 'Not specified',
    tags,
    recent_messages: recent.slice(-3),
    last_assistant_openers: lastAssistantOpeners.slice(-10),
    last_assistant_questions: lastAssistantQuestions.slice(-5)
  });
};