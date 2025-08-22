import { Router } from 'express';
import { z } from 'zod';
import { getOptimizedReply } from '../gemini-optimized';
import db from '../db';

const router = Router();

const ReflectionSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  mood: z.number().min(0).max(10).optional(),
  tags: z.array(z.string()).optional()
});

// GET /reflections - Get user's reflections
router.get('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const reflections = await db.getReflections(req.user.id);
    res.json(reflections);
  } catch (error) {
    console.error('Get reflections error:', error);
    res.status(500).json({ error: 'Failed to get reflections' });
  }
});



router.post('/', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const parsed = ReflectionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      errors: parsed.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    });
  }

  try {
    const { text, mood, tags } = parsed.data;
    const userId = req.user.id;

    console.log(`Processing reflection for user ${userId}:`, { text, mood, tags });

    // Get recent messages for conversation context
    const recentMessages = await db.getRecentMessages(userId, 6);
    const conversationContext = recentMessages.map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      text: msg.text
    }));

    // Generate AI response using optimized Gemini integration
    const aiResponse = await getOptimizedReply(text, mood, tags, conversationContext);
    
    console.log('Generated optimized AI response:', aiResponse);

    // Store the conversation messages for context
    try {
      console.log('Storing user message...');
      await db.addMessage(userId, text, true); // User message
      
      console.log('Storing assistant response...');
      await db.addMessage(userId, aiResponse.message, false); // Assistant response
      
      console.log('Messages stored successfully');
    } catch (messageError) {
      console.error('Failed to store conversation messages:', messageError);
      // Continue with reflection creation even if message storage fails
    }

    // Store the reflection with optimized response format
    const reflection = await db.createReflection({
      userId,
      text,
      mood,
      tags,
      response: aiResponse.message,
      suggestion: {
        title: `${aiResponse.intent} support`,
        steps: aiResponse.chips.length > 0 ? aiResponse.chips : ["Take a moment to breathe", "Reflect on your feelings", "Be kind to yourself"]
      }
    });

    console.log('Stored reflection and messages:', reflection.id);

    // Get updated stats
    const stats = await db.getStats(userId, '7d');

    // Return the expected format for the frontend
    const responseData = {
      reflection: {
        id: reflection.id,
        userId: reflection.userId,
        text: reflection.text,
        mood: reflection.mood,
        tags: reflection.tags,
        createdAt: reflection.createdAt
      },
      ai: {
        response: aiResponse.message,
        chips: aiResponse.chips
      },
      stats
    };

    console.log('Sending response to frontend:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Reflection error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Failed to process reflection', details: errorMessage });
  }
});

export default router;