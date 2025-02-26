export async function hyperOptimizedGetRequest(
  hostname: string,
  path: string,
  queryParams: Record<string, string>
): Promise<any> {
  try {
    const urlParams = new URLSearchParams(queryParams).toString();
    const url = `https://${hostname}${path}?${urlParams}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${await response.text()}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Fetch request error:", error);
    throw error;
  }
}
