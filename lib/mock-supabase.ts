// Mock Supabase data for local development without database

interface MockRoom {
  id: string;
  created_at: string;
  status: 'waiting' | 'ready' | 'questioning' | 'answering' | 'judging' | 'completed';
  user_a_token: string;
  user_b_token: string;
  user_a_submitted: boolean;
  user_b_submitted: boolean;
  verdict_json: any;
  engagement_score: number;
  title: string | null;
  questioning_round: number;
  max_questioning_rounds: number;
  user_id: string | null;
}

interface MockSubmission {
  id: string;
  room_id: string;
  user_type: 'user_a' | 'user_b';
  story: string;
  created_at: string;
  user_id: string | null;
}

interface MockDocument {
  id: string;
  submission_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at: string;
}

// Use global singleton to persist across hot reloads and API routes
declare global {
  var mockRooms: Map<string, MockRoom> | undefined;
  var mockSubmissions: Map<string, MockSubmission> | undefined;
  var mockDocuments: Map<string, MockDocument> | undefined;
  var mockEngagement: Map<string, Set<string>> | undefined;
  var mockFiles: Map<string, Buffer> | undefined;
  var mockQuestions: Map<string, any> | undefined;
}

// In-memory storage for demo - use global to persist
export const mockRooms = global.mockRooms || new Map<string, MockRoom>();
export const mockSubmissions = global.mockSubmissions || new Map<string, MockSubmission>();
export const mockDocuments = global.mockDocuments || new Map<string, MockDocument>();
export const mockEngagement = global.mockEngagement || new Map<string, Set<string>>();
export const mockFiles = global.mockFiles || new Map<string, Buffer>();
export const mockQuestions = global.mockQuestions || new Map<string, any>();

// Assign to global
global.mockRooms = mockRooms;
global.mockSubmissions = mockSubmissions;
global.mockDocuments = mockDocuments;
global.mockEngagement = mockEngagement;
global.mockFiles = mockFiles;
global.mockQuestions = mockQuestions;

// Helper functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generateToken(): string {
  return `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
}

// Sample demo data
const demoRoomId = 'demo-room-123';
const demoRoom: MockRoom = {
  id: demoRoomId,
  created_at: new Date(Date.now() - 3600000).toISOString(),
  status: 'completed',
  user_a_token: 'demo-token-a',
  user_b_token: 'demo-token-b',
  user_a_submitted: true,
  user_b_submitted: true,
  verdict_json: {
    analysis_user_a: "User A presented a compelling argument with strong evidence supporting their position. Their documentation was thorough and well-organized. Strengths: Clear logical flow, credible sources, specific examples. Weaknesses: Could have addressed counterarguments more directly.",
    analysis_user_b: "User B provided detailed counterpoints with supporting documentation. Their argument was well-structured and addressed key concerns. Strengths: Comprehensive coverage, strong rebuttal points, good use of evidence. Weaknesses: Some claims lacked specific quantitative data.",
    winner: "User A"
  },
  questioning_round: 0,
  max_questioning_rounds: 2,
  engagement_score: 42,
  title: "Who should pay for the broken window?",
  user_id: null
};

export function initializeMockData() {
  if (!mockRooms.has(demoRoomId)) {
    mockRooms.set(demoRoomId, demoRoom);
    const engagementSet = new Set<string>();
    for (let i = 0; i < 42; i++) {
      engagementSet.add(`ip-${i}`);
    }
    mockEngagement.set(demoRoomId, engagementSet);
  }
}

// Initialize on load
initializeMockData();
