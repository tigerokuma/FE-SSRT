export async function GET(request: Request) {
  const backendUrl = `http://localhost:3000/jira/gen-code`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
    });

    // Get content type and body
    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const data = await backendResponse.text();

    return new Response(data, {
      status: backendResponse.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  const backendUrl = `http://localhost:3000/jira/gen-code`;

  try {
    const body = await request.text(); // Or request.json() if backend expects JSON
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body,
    });

    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const data = await backendResponse.text();

    return new Response(data, {
      status: backendResponse.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy error' }), { status: 500 });
  }
}
