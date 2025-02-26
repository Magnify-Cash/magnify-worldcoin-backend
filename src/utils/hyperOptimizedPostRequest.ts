export async function hyperOptimizedPostRequest(
    hostname: string,
    path: string,
    body: Record<string, any>
  ): Promise<any> {
    try {
      const url = `https://${hostname}${path}`;
  
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${await response.text()}`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("Fetch POST request error:", error);
      throw error;
    }
  }