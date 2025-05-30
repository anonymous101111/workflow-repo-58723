import React, { useState, useRef } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import MCQGeneration from './components/MCQGeneration';
import Quiz from './components/Quiz';
import APIModal from './components/APIModal';
import ServiceWorkerReg from './components/ServiceWorkerReg';
import InfoBanner from './components/InfoBanner';

/* 
 PUBLIC_INTERFACE
 App: Main SPA container for Reviserr.
 Handles file upload, API key, extraction, MCQ generation, quiz, and error management. 
*/

function App() {
  const [apiKey, setApiKey] = useState('');
  const [llmProvider, setLlmProvider] = useState('openai');
  const [textExtracted, setTextExtracted] = useState('');
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [mcqs, setMcqs] = useState([]);
  const [stage, setStage] = useState('landing'); // landing | extracting | mcq | quiz | done
  const [quizIdx, setQuizIdx] = useState(0);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const extractedTextRef = useRef(''); // For privacy: in-memory only

  // Handle API Modal
  const openApiKeyModal = () => setShowAPIModal(true);
  const closeApiKeyModal = () => setShowAPIModal(false);

  // Step 1: File Upload and Extraction Handler
  // PUBLIC_INTERFACE
  const onTextExtracted = (text) => {
    if (!text || text.length < 20) {
      setError('The extracted text is too short. Please upload a valid study material.');
      return;
    }
    setTextExtracted(text);
    extractedTextRef.current = text;
    setStage('mcq');
    setError('');
  };

  // PUBLIC_INTERFACE
  const handleMCQGenerated = (questions) => {
    setMcqs(questions);
    setStage('quiz');
    setQuizIdx(0);
    setError('');
  };

  // PUBLIC_INTERFACE
  const handleQuizDone = () => {
    setStage('done');
  };

  // PUBLIC_INTERFACE
  const resetAll = () => {
    setStage('landing');
    setTextExtracted('');
    setMcqs([]);
    setApiKey('');
    setQuizIdx(0);
    extractedTextRef.current = '';
    setError('');
    setInfo('');
  };

  // Accessibility: focus main content on stage change
  React.useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.focus();
  }, [stage]);

  // Offline/online info banner
  React.useEffect(() => {
    function handleConnectivity() {
      setInfo(navigator.onLine ? '' : 'You are currently offline. Some features may be unavailable.');
    }
    window.addEventListener('online', handleConnectivity);
    window.addEventListener('offline', handleConnectivity);
    handleConnectivity();
    return () => {
      window.removeEventListener('online', handleConnectivity);
      window.removeEventListener('offline', handleConnectivity);
    };
  }, []);

  // Privacy: Clear all sensitive data on reload/unmount
  React.useEffect(() => {
    return () => {
      setApiKey('');
      setTextExtracted('');
      setMcqs([]);
      extractedTextRef.current = '';
    }
  }, []);
  
  return (
    <div className="app" aria-live="polite">
      <ServiceWorkerReg />
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo" tabIndex="0">
              <span className="logo-symbol" aria-label="Reviserr Star">★</span>
              Reviserr
            </div>
            <button
              className="btn"
              onClick={openApiKeyModal}
              aria-label={apiKey ? "Change API Key" : "Set API Key"}
              style={{marginRight: '8px'}}
            >
              {apiKey ? "API Key Set" : "Set API Key"}
            </button>
          </div>
        </div>
      </nav>
      <main tabIndex={-1}>
        <div className="container" style={{ paddingTop: 120, paddingBottom: 32 }}>
          {info && <InfoBanner type="info" message={info} />}
          {error && <InfoBanner type="error" message={error} />}
          {stage === 'landing' &&
            <section aria-labelledby="landing-title" className="hero" style={{minHeight: 380, justifyContent: 'start'}}>
              <div className="subtitle" id="landing-title">AI-powered Revision Helper</div>
              <h1 className="title">Reviserr</h1>
              <div className="description">
                Quickly convert your study material (PDF/Word) into interactive multiple-choice quizzes using your own LLM API key.<br />
                <span style={{color:'var(--kavia-orange)'}}>No uploads to external servers &mdash; all processing is privacy-first, browser-only.</span>
              </div>
              <button className="btn btn-large" onClick={()=>setStage('extracting')}>Start Now</button>
            </section>
          }
          {stage === 'extracting' &&
            <FileUpload
              onExtracted={onTextExtracted}
              onError={(msg) => { setError(msg) }}
              onCancel={resetAll}
            />
          }
          {stage === 'mcq' && (
            <MCQGeneration
              llmProvider={llmProvider}
              apiKey={apiKey}
              text={textExtracted}
              onComplete={handleMCQGenerated}
              onError={(msg) => setError(msg)}
              openApiKeyModal={openApiKeyModal}
              isGenerating={isGenerating}
              setIsGenerating={setIsGenerating}
              onCancel={resetAll}
            />
          )}
          {stage === 'quiz' && mcqs.length > 0 && (
            <Quiz
              mcqs={mcqs}
              onComplete={handleQuizDone}
              onRestart={resetAll}
            />
          )}
          {stage === 'done' && (
            <section className="hero" aria-labelledby="done-title">
              <div className="subtitle" id="done-title">Quiz Complete!</div>
              <h1 className="title">🎉 Congratulations!</h1>
              <div className="description">
                You have finished revising. Want to try with another study material or a different API key?
              </div>
              <div style={{ display: "flex", gap: 16, justifyContent:'center'}}>
                <button className="btn btn-large" onClick={resetAll}>Start Over</button>
              </div>
            </section>
          )}
        </div>
        {showAPIModal && (
          <APIModal
            apiKey={apiKey}
            setApiKey={setApiKey}
            setLlmProvider={setLlmProvider}
            closeModal={closeApiKeyModal}
          />
        )}
      </main>
      <footer style={{
        padding: 24,
        color: 'var(--text-secondary)',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.08)',
        fontSize: '0.98rem'
      }}>
        <span>🛡️</span> Privacy-first – all data processed in-browser. &copy; {new Date().getFullYear()} Reviserr
      </footer>
    </div>
  );
}
export default App;
