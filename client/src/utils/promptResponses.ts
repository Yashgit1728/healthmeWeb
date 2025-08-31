import { Prompt } from '../types/prompts';

export interface PromptResponse {
  message: string;
  followUpQuestion: string;
  encouragement: string;
  insight: string;
}

// Human-like response patterns for different themes
const responsePatterns = {
  gratitude: {
    messages: [
      "That's beautiful! I can feel the warmth in your words. It's amazing how the smallest moments can light up our whole day.",
      "Oh wow, that really touched my heart! Sometimes we don't realize how much these little things matter until we write them down.",
      "That's so lovely! I love how you're finding beauty in the everyday moments. It's such a powerful way to live.",
      "This made me smile! There's something so special about recognizing the good things, no matter how small they seem."
    ],
    followUps: [
      "What was it about that moment that made it so special?",
      "How did it feel to write that down?",
      "Is there someone you'd like to share this gratitude with?",
      "What other small moments brought you joy today?"
    ],
    encouragements: [
      "Keep noticing these beautiful moments - they're building a foundation of joy in your life.",
      "Your gratitude practice is growing something really special inside you.",
      "This kind of awareness is such a gift to yourself and others."
    ]
  },

  reflection: {
    messages: [
      "That's really insightful! I can tell you've been thinking deeply about this. It takes courage to look at ourselves honestly.",
      "Wow, that's powerful self-reflection right there. You're showing such wisdom in how you're processing this.",
      "I love how you're not just experiencing things, but really learning from them. That's growth in action!",
      "That's such honest reflection! It's beautiful how you're turning challenges into opportunities to understand yourself better."
    ],
    followUps: [
      "What did you discover about yourself through this experience?",
      "How do you feel now that you've reflected on this?",
      "What would you do differently next time?",
      "What's the biggest lesson you're taking away from this?"
    ],
    encouragements: [
      "Your self-awareness is growing stronger every day. That's a superpower!",
      "This kind of honest reflection is how we become our best selves.",
      "You're building wisdom through every experience you process."
    ]
  },

  goals: {
    messages: [
      "That's exciting! I can feel your determination coming through. You've got this!",
      "I love how you're thinking about the future! There's something so powerful about having a clear direction.",
      "That's a beautiful goal! I can tell it really matters to you. Let's break it down into steps that feel manageable.",
      "You're showing such vision here! It's inspiring to see someone who knows what they want and is willing to work for it."
    ],
    followUps: [
      "What's the first small step you can take toward this goal?",
      "How does this goal align with who you want to become?",
      "What's motivating you to pursue this right now?",
      "What would success look like to you?"
    ],
    encouragements: [
      "Every big dream starts with one small step. You're already moving forward!",
      "Your determination is inspiring. Keep that fire burning!",
      "Goals give our lives direction and purpose. You're choosing both!"
    ]
  },

  stress: {
    messages: [
      "I can hear how challenging this has been for you. It's okay to feel overwhelmed - that's a normal human response.",
      "That sounds really tough. I'm sorry you're going through this. You don't have to carry it all alone.",
      "I can feel the weight of this in your words. Stress can be so heavy, and it's brave of you to acknowledge it.",
      "That's a lot to handle. It's completely understandable that you're feeling stressed. Your feelings are valid."
    ],
    followUps: [
      "What would help you feel more supported right now?",
      "When you're feeling this way, what usually helps you feel more grounded?",
      "Is there one small thing you can do today to take care of yourself?",
      "What would it look like to give yourself permission to rest?"
    ],
    encouragements: [
      "You're doing the best you can, and that's enough. Be gentle with yourself.",
      "It's okay to not have all the answers right now. Take it one moment at a time.",
      "You're stronger than you know, and this stress won't last forever."
    ]
  },

  relationships: {
    messages: [
      "That's such a beautiful connection! I can feel the warmth and care in your words. Relationships are such precious gifts.",
      "I love how you're paying attention to the people in your life. These connections are what make life meaningful.",
      "That's really thoughtful of you to notice this relationship. Sometimes we don't realize how much someone means to us until we reflect on it.",
      "What a lovely way to honor that connection! Relationships thrive when we give them attention and care."
    ],
    followUps: [
      "How does this relationship make you feel about yourself?",
      "What would you like to do to strengthen this connection?",
      "Is there something you'd like to express to this person?",
      "What have you learned about yourself through this relationship?"
    ],
    encouragements: [
      "You're building something beautiful with the people you care about.",
      "Your attention to relationships shows emotional intelligence and heart.",
      "These connections are the foundation of a meaningful life."
    ]
  },

  'self-care': {
    messages: [
      "That's such important self-awareness! I love how you're prioritizing your own well-being. You deserve this care.",
      "Yes! Taking care of yourself isn't selfish - it's essential. I'm proud of you for recognizing what you need.",
      "That's beautiful self-love in action! You're showing yourself the same kindness you'd offer a dear friend.",
      "I can feel your commitment to your own wellness. That's such a powerful choice to make every day."
    ],
    followUps: [
      "How does this self-care practice make you feel?",
      "What other ways do you like to nurture yourself?",
      "How can you make this self-care a regular part of your routine?",
      "What would it look like to give yourself permission to prioritize your needs?"
    ],
    encouragements: [
      "You're building a beautiful relationship with yourself. That's the foundation of everything else.",
      "Your self-care practice is inspiring others to do the same.",
      "You're teaching yourself that you're worth taking care of."
    ]
  },

  growth: {
    messages: [
      "That's growth in action! I can see how much you've evolved and learned. You're becoming stronger and wiser.",
      "Wow, look at how far you've come! Every challenge you've faced has been building something amazing in you.",
      "That's such powerful self-awareness! You're not just experiencing life - you're learning from it and growing.",
      "I love how you're turning every experience into an opportunity to become better. That's the mindset of someone who's going places!"
    ],
    followUps: [
      "What's the biggest lesson you've learned from this experience?",
      "How has this growth changed how you see yourself?",
      "What would you tell someone else going through something similar?",
      "What's the next step in your growth journey?"
    ],
    encouragements: [
      "Your growth mindset is inspiring. You're building something amazing inside yourself.",
      "Every challenge you overcome makes you stronger and more capable.",
      "You're not just surviving - you're thriving and growing!"
    ]
  },

  mindfulness: {
    messages: [
      "That's such beautiful awareness! I love how you're really paying attention to what's happening in and around you.",
      "You're practicing mindfulness so naturally! It's beautiful how you're noticing the details that most people miss.",
      "That's such present-moment awareness! You're really living in the now, and it's beautiful to witness.",
      "I can feel your mindfulness practice deepening. You're developing such a beautiful relationship with the present moment."
    ],
    followUps: [
      "How did it feel to be so present in that moment?",
      "What did you notice that you might have missed before?",
      "How can you bring this kind of awareness to other parts of your day?",
      "What would it feel like to approach your whole day with this kind of attention?"
    ],
    encouragements: [
      "Your mindfulness practice is creating more peace and joy in your life.",
      "You're developing a superpower - the ability to really be present.",
      "This awareness is making your life richer and more meaningful."
    ]
  }
};

// Generate a human-like response based on the prompt theme and user's response
export function generateHumanResponse(
  prompt: Prompt, 
  userResponse: string, 
  userName?: string
): PromptResponse {
  const theme = prompt.theme;
  const patterns = responsePatterns[theme as keyof typeof responsePatterns];
  
  // Randomly select from available patterns
  const message = patterns.messages[Math.floor(Math.random() * patterns.messages.length)];
  const followUp = patterns.followUps[Math.floor(Math.random() * patterns.followUps.length)];
  const encouragement = patterns.encouragements[Math.floor(Math.random() * patterns.encouragements.length)];
  
  // Generate a personalized insight based on the user's response
  const insight = generatePersonalInsight(userResponse);
  
  // Personalize the message if we have a name
  const personalizedMessage = userName 
    ? message.replace(/^That's/, `${userName}, that's`)
    : message;
  
  return {
    message: personalizedMessage,
    followUpQuestion: followUp,
    encouragement,
    insight
  };
}

// Generate a personal insight based on the user's response
function generatePersonalInsight(userResponse: string): string {
  const responseLength = userResponse.length;
  const hasEmotionalWords = /feel|felt|feeling|happy|sad|excited|worried|grateful|thankful|love|care/i.test(userResponse);
  
  if (responseLength > 100 && hasEmotionalWords) {
    return "You're really diving deep into your emotions and experiences. That kind of honest reflection is so valuable.";
  } else if (responseLength > 50) {
    return "You're developing such thoughtful awareness of your inner world. Keep exploring!";
  } else if (hasEmotionalWords) {
    return "Even in just a few words, you're showing emotional intelligence and self-awareness.";
  } else {
    return "Every response, no matter how brief, is a step toward greater self-understanding.";
  }
}

// Generate a follow-up prompt for continued reflection
export function generateFollowUpPrompt(theme: string): string {
  const followUps = {
    gratitude: [
      "What else are you grateful for today?",
      "How does practicing gratitude affect your mood?",
      "Who would you like to thank today?"
    ],
    reflection: [
      "What else did you learn about yourself?",
      "How can you apply this insight going forward?",
      "What would you tell a friend going through something similar?"
    ],
    goals: [
      "What's the next step toward this goal?",
      "How will you celebrate small wins along the way?",
      "What support do you need to reach this goal?"
    ],
    stress: [
      "What's one thing you can do right now to feel better?",
      "Who can you reach out to for support?",
      "What would help you feel more in control?"
    ],
    relationships: [
      "How can you strengthen this relationship?",
      "What would you like to express to this person?",
      "How does this relationship help you grow?"
    ],
    'self-care': [
      "What other ways can you take care of yourself today?",
      "How can you make this self-care a habit?",
      "What would it feel like to prioritize your needs more?"
    ],
    growth: [
      "What's the next challenge you'd like to take on?",
      "How has this growth changed your perspective?",
      "What would you like to learn next?"
    ],
    mindfulness: [
      "How can you bring this awareness to other moments?",
      "What would it feel like to be this present all day?",
      "How does this mindfulness practice serve you?"
    ]
  };
  
  const themeFollowUps = followUps[theme as keyof typeof followUps] || followUps.gratitude;
  return themeFollowUps[Math.floor(Math.random() * themeFollowUps.length)];
}
