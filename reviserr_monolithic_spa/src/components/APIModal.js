import React, { useState } from 'react';

/*
  PUBLIC_INTERFACE
  APIModal: In-memory API key input & LLM provider selection
  Props: apiKey, setApiKey, setLlmProvider, closeModal
*/

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI (GPT-4, GPT-3.5)' },
  { id: 'cohere', label: 'Cohere (Command-R, Command-Nightly)' }
];

export default function APIModal({ apiKey, setApiKey, setLlmProvider, closeModal }) {
  const [key, setKey] = useState(apiKey || '');
  const [provider, setProvider] = useState('openai');

  // PUBLIC_INTERFACE
  const submit = e => {
    e.preventDefault();
    if (!key.trim()) return;
    setApiKey(key.trim());
    setLlmProvider(provider);
    closeModal();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
        background:'rgba(0,0,0,0.56)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'
      }}
      tabIndex="-1"
      onClick={closeModal}
    >
      <div
        style={{
          background:'#fff', color:'#181818', width:340, maxWidth:'95vw', padding:'30px 36px 22px', borderRadius:8,
          boxShadow:'0 8px 40px rgba(0,0,0,0.25)', position:'relative'
        }}
        role="document"
        aria-label="API Key Form"
        tabIndex="0"
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{margin:'0 0 16px 0'}}>Set LLM API Key</h2>
        <p style={{marginBottom:18, fontSize: '0.96rem'}}>
          Please enter your <b>private LLM API key</b>.<br/>
          Your key is never stored or sent anywhere except for direct LLM API calls.
        </p>
        <form onSubmit={submit}>
          <div style={{marginBottom:16}}>
            <label htmlFor="provider-select">LLM Provider:</label>
            <select
              id="provider-select"
              value={provider}
              onChange={e => setProvider(e.target.value)}
              style={{marginLeft:10, padding:4, fontSize:'1em'}}
            >
              {PROVIDERS.map(p => <option value={p.id} key={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div style={{marginBottom: 18}}>
            <label htmlFor="api-input">API Key:</label>
            <input
              type="password"
              id="api-input"
              required
              autoFocus
              value={key}
              onChange={e=>setKey(e.target.value)}
              style={{
                width:'100%',
                fontSize:'1.1em',
                marginTop:8,
                padding: 8,
                borderRadius: 3,
                border: '1px solid #e8e8e8'
              }}
              aria-label="API Key field"
              autoComplete="off"
            />
          </div>
          <div style={{display:'flex', gap:16, justifyContent:'end'}}>
            <button className="btn" type="submit" style={{marginTop:0,background:'var(--kavia-orange)', color:'#fff', minWidth:80}}>Save</button>
            <button type="button" className="btn" style={{marginTop:0,background:'#eaeaea', color:'#444'}} onClick={closeModal}>Cancel</button>
          </div>
        </form>
        <div style={{fontSize:'0.8em', marginTop:14, color:'#836B45'}}>
          Keys are held in-memory only and erased on refresh.
        </div>
      </div>
    </div>
  );
}
