import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey || apiKey === 'placeholder-key') {
    return NextResponse.json({ error: 'Missing AI_API_KEY' }, { status: 400 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json(
      {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        url,
        data,
      },
      { status: res.ok ? 200 : res.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
