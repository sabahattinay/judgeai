// Mock AI service for local development without API keys

export async function generateMockVerdict(userAEvidence: string, userBEvidence: string) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simple logic to determine winner based on length and content
  const userALength = userAEvidence.length;
  const userBLength = userBEvidence.length;
  
  let winner: 'User A' | 'User B' | 'Tie';
  
  if (Math.abs(userALength - userBLength) < 50) {
    winner = 'Tie';
  } else if (userALength > userBLength) {
    winner = 'User A';
  } else {
    winner = 'User B';
  }

  return {
    analysis_user_a: `User A presented ${userALength} characters of argument. Their evidence includes detailed points and supporting documentation. Strengths: Clear presentation and structured argument. Weaknesses: Could benefit from more specific examples and quantifiable data.`,
    analysis_user_b: `User B presented ${userBLength} characters of argument. Their submission demonstrates thorough research and comprehensive coverage. Strengths: Well-documented claims with supporting evidence. Weaknesses: Some points could be more concise and focused.`,
    winner,
  };
}

export async function extractMockTextFromImage(): Promise<string> {
  return '[Mock OCR] This is sample text extracted from the image document.';
}

export async function extractMockTextFromPDF(): Promise<string> {
  return '[Mock PDF Parse] This is sample text extracted from the PDF document.';
}
