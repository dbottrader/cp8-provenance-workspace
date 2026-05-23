const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt } = await req.json();

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content ?? '';

    // Parse response for code, explanation, and glyphs
    const codeMatch = fullResponse.match(/```[\w]*\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : fullResponse;
    
    const glyphRegex = /[⧖∞⧈✺⧉♓⟡⧗⟢✶◎◈ꗃ✦ᚾϞ⚯]/g;
    const glyphs = [...new Set(code.match(glyphRegex) || [])];

    const explanation = fullResponse.split('```')[0].trim() || 'Code generated with CP8 patterns';

    return new Response(
      JSON.stringify({ 
        code, 
        explanation,
        glyphs 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Code gen error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
