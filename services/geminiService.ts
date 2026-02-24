
import { GoogleGenAI, Type } from "@google/genai";
import { Ticket, AppTier, ChatMessage, Vulnerability, VulnerabilitySeverity } from '../types';

// Models are selected based on task complexity per guidelines
const flashModelId = "gemini-3-flash-preview";
const proModelId = "gemini-3-pro-preview";

export const analyzeRisk = async (ticketData: Omit<Ticket, 'id' | 'status' | 'aiRiskAnalysis' | 'messages'>): Promise<{ summary: string, recommendedTier: AppTier }> => {
  // Initialize AI client right before use according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are an expert Application Security Engineer. Analyze the following application assessment request and provide a brief risk analysis and a recommended risk tier.

    Application Details:
    - Name: ${ticketData.appName}
    - Type: ${ticketData.type}
    - URL: ${ticketData.testUrl}
    
    Security Questionnaire Answers:
    - Handles PII: ${ticketData.securityAnswers.handlesPII ? 'Yes' : 'No'}
    - Internet Facing: ${ticketData.securityAnswers.internetFacing ? 'Yes' : 'No'}
    - Stores Payment Data: ${ticketData.securityAnswers.storesPaymentData ? 'Yes' : 'No'}
    - Third Party Integrations: ${ticketData.securityAnswers.thirdPartyIntegrations ? 'Yes' : 'No'}
    - Requires User Authentication: ${ticketData.securityAnswers.requiresUserAuth ? 'Yes' : 'No'}

    Output Requirements:
    1. A concise summary of the potential security risks (max 2 sentences).
    2. A recommended Application Tier (High, Medium, or Low).
  `;

  try {
    const response = await ai.models.generateContent({
      model: flashModelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            recommendedTier: { type: Type.STRING, enum: [AppTier.HIGH, AppTier.MEDIUM, AppTier.LOW] }
          }
        }
      }
    });

    // Access .text property directly (not as a method)
    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        summary: result.summary,
        recommendedTier: result.recommendedTier as AppTier
      };
    }
    throw new Error("No response text generated");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Could not generate analysis at this time.",
      recommendedTier: AppTier.MEDIUM
    };
  }
};

export const summarizeDiscussion = async (messages: ChatMessage[]): Promise<string> => {
  if (messages.length === 0) return "No messages to summarize.";
  
  // Initialize AI client right before use according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const conversation = messages.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
  
  const prompt = `
    Summarize the key points of this discussion between a Vendor and the Security Team.
    
    Conversation:
    ${conversation}
    
    Focus on action items and decisions.
  `;

  try {
      const response = await ai.models.generateContent({
        model: flashModelId,
        contents: prompt,
      });
      // Access .text property directly
      return response.text || "No summary generated.";
  } catch (error) {
      console.error("Gemini Summary Error:", error);
      return "Could not generate summary at this time.";
  }
};

export const generateExecutiveSummary = async (stats: any): Promise<string> => {
  // Initialize AI client right before use according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a CISO. Generate a professional executive security summary based on these metrics:
    - Total: ${stats.total}, Completed: ${stats.completed}, In Progress: ${stats.inProgress}, Expedited: ${stats.expedited}
    - Findings: ${stats.totalIssues}, Open: ${stats.issuesOpen}
    
    Tone: Professional and data-driven.
  `;

  try {
    const response = await ai.models.generateContent({
      model: flashModelId,
      contents: prompt,
    });
    // Access .text property directly
    return response.text || "Summary generation failed.";
  } catch (error) {
    console.error("Executive Summary Error:", error);
    return "Error generating executive summary.";
  }
};

export const analyzeReport = async (fileBase64: string, mimeType: string): Promise<Omit<Vulnerability, 'id' | 'status' | 'readyForRetest'>[]> => {
  // Initialize AI client right before use according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    CRITICAL SECURITY ANALYST TASK: 
    Extract vulnerability findings from the provided report (PDF or Image). 
    Maintain surgical precision. Only include information explicitly present in the report.

    For EVERY finding identified in the document, extract:
    1. Title: Exact name of the vulnerability.
    2. Severity: Map to one of [Critical, High, Medium, Low, Info].
    3. Impact: The verbatim or summarized risk impact described in the report.
    4. Observation: Technical discovery details (what was found, where, how).
    5. Affected URL: Endpoint or path if mentioned.
    6. Remediation: Exact remediation steps or guidance from the report.

    Format your output as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: proModelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'] },
              impact: { type: Type.STRING },
              observation: { type: Type.STRING },
              affectedUrl: { type: Type.STRING },
              remediation: { type: Type.STRING }
            },
            required: ["title", "severity", "impact", "observation", "remediation"]
          }
        }
      }
    });

    // Access .text property directly
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Complex Report Analysis Error:", error);
    return [];
  }
};

export const analyzeRetestReport = async (fileBase64: string, mimeType: string): Promise<{ title: string, status: 'Open' | 'Remediated', comment: string }[]> => {
  // Initialize AI client right before use according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    CRITICAL SECURITY ANALYST TASK:
    Analyze the attached RETEST report. Your goal is to determine which previously identified vulnerabilities have been successfully remediated and which remain open.

    For each vulnerability mentioned in the retest report, extract:
    1. Title: The name of the vulnerability.
    2. Status: Exactly 'Remediated' if the report confirms the fix, or 'Open' if the issue persists.
    3. Comment: A brief explanation from the analyst regarding the retest result.

    Format your output as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: proModelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: fileBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              status: { type: Type.STRING, enum: ['Open', 'Remediated'] },
              comment: { type: Type.STRING }
            },
            required: ["title", "status", "comment"]
          }
        }
      }
    });

    // Access .text property directly
    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Retest Analysis Error:", error);
    return [];
  }
};
