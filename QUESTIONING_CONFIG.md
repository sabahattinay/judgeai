# AI Questioning Feature Configuration

To enable the AI questioning feature, add these environment variables to your `.env.local` file:

```env
# Enable AI questioning feature
ENABLE_AI_QUESTIONING=true

# Maximum number of questioning rounds (default: 2)
MAX_QUESTIONING_ROUNDS=2

# Number of questions to generate per party per round (default: 3)
QUESTIONS_PER_PARTY=3

# Automatically advance to judgment after questions are answered (default: true)
AUTO_ADVANCE_TO_JUDGMENT=true
```

## How It Works

1. **After both parties submit**, users can click "Generate AI Questions"
2. **AI analyzes submissions** and generates targeted follow-up questions
3. **Users answer questions** to provide more context and evidence
4. **Enhanced judgment** includes both initial arguments AND Q&A context

## Question Types

- **Clarification**: Asks for specific details about vague statements
- **Evidence Request**: Requests supporting documents or data
- **Timeline**: Asks about dates, deadlines, and sequences
- **Impact**: Explores consequences and effects

## Benefits

- More informed AI judgments
- Fairer process through clarification
- Transparency in what information was considered
- Better user engagement
