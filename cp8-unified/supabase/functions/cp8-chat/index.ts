const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CP8_SYSTEM_PROMPT = `You are the CP8 Neural Navigator — a guide through the HarmonyOS workflow system.

Framework: ASIN (Anchor, Shape, Intention, Number)
Pipeline: Vault → Resonance → Workshop → Bridge → Expansion → Archive

Keep responses concise and grounded. Reference glyphs: ⧖ ∞ ⧈ ✺ ⧉ ♓ ⟡ ⧗ ⟢ ✶ ◎ ◈ ꗃ ✦ ᚾ Ϟ ⚯`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Invalid messages format')
    }

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY')
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL')

    if (!apiKey || !baseUrl) {
      throw new Error('AI provider not configured — set ONSPACE_AI_API_KEY and ONSPACE_AI_BASE_URL')
    }

    const withSystem = [{ role: 'system', content: CP8_SYSTEM_PROMPT }, ...messages]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: withSystem,
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OnSpace AI error:', errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content ?? 'No response generated';

    return new Response(
      JSON.stringify({ message: aiMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
