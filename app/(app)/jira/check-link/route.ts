export async function POST(request: Request) {
  const backendUrl = `http://localhost:3000/jira/check-link`;

  try {
    // Parse JSON body from client request
    const body = await request.json();

    // Forward POST request to backend
    const backendResponse = await fetch(backendUrl, {
      method: 'POST', // Use POST since you need a body
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const data = await backendResponse.text();

    return new Response(data, {
      status: backendResponse.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    console.error('Proxy POST error:', error);
    return new Response(JSON.stringify({ error: 'Proxy POST error' }), { status: 500 });
  }
}
