import React, { useState } from 'react';

/*
  PUBLIC_INTERFACE
  MCQGeneration: Handles MCQ creation using external LLM API (OpenAI, Cohere, others possible).
  Props: text, apiKey, llmProvider, onComplete(questions[]), onCancel(), onError(msg), openApiKeyModal()
  LLM API key is held in-memory only, not persisted.
*/

function buildPrompt(text) {
  // Careful: keep prompt clear and LLM-neutral
  return `
Generate 10 multiple choice questions (MCQs) from the following study material.
For each question, provide:
  - question (string)
  - options (array of 4)
  - answer (string, identical to one of the options)

Study Material:
<<<
${text.length > 3200 ? text.substring(0, 3200) + "\n[truncated]" : text}
>>>

Respond in valid JSON of the following format:
[
  {
    "question": "Sample question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option B"
  },
  ...
]
`;
}

// PUBLIC_INTERFACE
export default function MCQGeneration({
  text,
  apiKey,
  llmProvider,
  onComplete,
  onError,
  isGenerating,
  setIsGenerating,
  openApiKeyModal,
  onCancel
}) {
  const [progress, setProgress] = useState(0);

  // Only supports OpenAI and Cohere for now.
  // PUBLIC_INTERFACE
  async function generateMCQs() {
    setIsGenerating(true);
    setProgress(0.2);
    onError(""); // Clear error
    try {
      if (!apiKey) {
        onError("Please set your LLM API key first.");
        openApiKeyModal();
        setIsGenerating(false);
        return;
      }
      if (!text || text.length < 20) throw new Error("Text content is insufficient to generate MCQs.");

      let jsonString = '';
      if (llmProvider === 'openai') {
        jsonString = await callOpenAI(apiKey, buildPrompt(text));
      } else if (llmProvider === 'cohere') {
        jsonString = await callCohere(apiKey, buildPrompt(text));
      } else {
        throw new Error("Currently only OpenAI and Cohere APIs are supported.");
      }
      setProgress(0.85);

      let parsed;
      try {
        parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed) || !parsed[0]?.question) throw new Error();
      } catch {
        // In case the model spits out preamble, try to salvage JSON
        const match = jsonString.match(/\[.*\]/s);
        if (match) {
          try { parsed = JSON.parse(match[0]); }
          catch { throw new Error("Malformed JSON returned from LLM API."); }
        } else {
          throw new Error("Malformed response from LLM API.");
        }
      }
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) throw new Error("No MCQs could be generated.");
      // Sanity: check shape
      parsed = parsed.filter(q =>
        q.question && Array.isArray(q.options) && q.options.length === 4 && q.options.includes(q.answer)
      );
      if (parsed.length === 0) throw new Error("No valid MCQs returned.");
      setProgress(1.0);
      setTimeout(() => onComplete(parsed), 600); // pause for user UX
    } catch (e) {
      onError("MCQ generation failed: " + (e.message || e));
      setIsGenerating(false);
      setProgress(0);
    }
  }

  // OpenAI API call - browser-only, with fetch
  // PUBLIC_INTERFACE
  async function callOpenAI(apiKey, prompt) {
    // fetch to api.openai.com/v1/chat/completions
    const url = "https://api.openai.com/v1/chat/completions";
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.3,
      max_tokens: 1200,
      n: 1
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload)
    });
    setProgress(0.7);
    if (!resp.ok) {
      let err = await resp.text();
      throw new Error("OpenAI API error: " + (err || resp.status));
    }
    const data = await resp.json();
    // Use most likely completion, extract content
    const choice = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!choice) throw new Error("No choices returned from OpenAI.");
    return choice;
  }

  // Cohere API call, browser-only
  // PUBLIC_INTERFACE
  async function callCohere(apiKey, prompt) {
    const url = "https://api.cohere.ai/v1/chat";
    const payload = {
      model: "command-r",
      message: prompt,
      temperature: 0.3,
      max_tokens: 1200
    };
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload)
    });
    setProgress(0.7);
    if (!resp.ok) {
      let err = await resp.text();
      throw new Error("Cohere API error: " + (err || resp.status));
    }
    const data = await resp.json();
    const content = data.text || data.reply || (data.generations && data.generations[0] && data.generations[0].text);
    if (!content) throw new Error("No completions returned from Cohere.");
    return content;
  }

  return (
    <section className="hero" aria-label="Generate MCQs">
      <div className="subtitle">2. Generate MCQs with LLM</div>
      <div className="description" style={{marginBottom: 22}}>
        Use your API key for <b>OpenAI</b> or <b>Cohere</b>. No keys are ever stored.<br />
        The LLM will generate multiple-choice questions based on your extracted study material.
      </div>
      <div>
        <button className="btn btn-large"
                onClick={generateMCQs}
                disabled={isGenerating}
                aria-label="Generate MCQs">
          {isGenerating ? (
            <span>Generating... <span aria-live="polite" aria-busy="true">⏳</span></span>
          ) : "Generate MCQs"}
        </button>
        <button className="btn" onClick={onCancel} style={{marginLeft:10}} disabled={isGenerating}>Back</button>
      </div>
      <div style={{ margin: '34px auto', textAlign:'center', minHeight:40, width: '80%' }} aria-live="assertive">
        {isGenerating && (
          <div>
            <progress style={{width:'70%',maxWidth:'340px'}} value={progress} max={1} aria-valuenow={progress} aria-valuemax={1} />
            <div style={{color:'var(--kavia-orange)', marginTop: 6}}>Talking to the LLM provider...</div>
          </div>
        )}
      </div>
      <ul style={{fontSize:'0.92em', color:'var(--text-secondary)', maxWidth:440, margin:'0 auto', textAlign:'left'}}>
        <li>Keys are <b>never stored</b>; they're only held in memory for your session</li>
        <li>See <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer">OpenAI</a> or <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noopener noreferrer">Cohere</a> for more info</li>
        <li>Having trouble? <button style={{ color: 'var(--kavia-orange)', background: 'none', border:'none', textDecoration:'underline', cursor:'pointer', padding:0 }} onClick={openApiKeyModal}>Edit API Key</button></li>
      </ul>
    </section>
  );
}
