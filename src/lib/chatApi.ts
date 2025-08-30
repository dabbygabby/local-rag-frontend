import { ChatRequest, ChatStreamChunk } from "@/types/chat";

const API_BASE_URL = "http://localhost:8000";

export async function streamChat(
  request: ChatRequest,
  onChunk: (chunk: ChatStreamChunk) => void,
  onError: (err: Error) => void
) {
  try {
    let requestOptions: RequestInit;
    
    // If images are present, use multipart/form-data; otherwise JSON
    if (request.images && request.images.length > 0) {
      const form = new FormData();
      
      // Add all non-image fields as JSON
      const { images, ...restRequest } = request;
      Object.entries(restRequest).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });
      
      // Add images with data URI prefix for backend to recognize mime type
      images.forEach((base64, index) => {
        form.append(`image_${index}`, `data:image/jpeg;base64,${base64}`);
      });
      
      requestOptions = {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
        },
        body: form,
      };
    } else {
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(request),
      };
    }
    
    const resp = await fetch(`${API_BASE_URL}/api/chat`, requestOptions);

    if (!resp.ok) {
      const txt = await resp.text();
      onError(new Error(`Chat request failed: ${txt}`));
      return;
    }

    if (!resp.body) {
      onError(new Error("No response body received"));
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double new‑lines
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;
        
        // Parse SSE format: "data: {...}"
        const match = trimmedPart.match(/^data:\s*(.*)$/m);
        if (!match) continue;
        
        const dataStr = match[1].trim();
        if (dataStr === "[DONE]") {
          // Signal that streaming is complete
          return;
        }
        
        try {
          const data: ChatStreamChunk = JSON.parse(dataStr);
          onChunk(data);
        } catch (parseErr) {
          console.warn("Failed to parse SSE chunk:", dataStr, parseErr);
          // Continue processing other chunks instead of failing completely
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error occurred"));
  }
}
