// always go through our Next.js proxy (adds Clerk JWT)
const apiBase = "/api/backend";

export async function GET(request: Request) {
  const backendUrl = `${apiBase}/jira/insert-code`;

  try {
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
    });

    const contentType = backendResponse.headers.get('content-type') || 'application/json';
    const data = await backendResponse.text();

    return new Response(data, {
      status: backendResponse.status,
      headers: { 'content-type': contentType },
    });
  } catch (error) {
    console.error('Proxy GET error:', error);
    return new Response(JSON.stringify({ error: 'Proxy GET error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  const backendUrl = `${apiBase}/jira/insert-code`;

  try {
    const body = await request.json(); // parse JSON body from client request

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body), // stringify JSON for backend
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

