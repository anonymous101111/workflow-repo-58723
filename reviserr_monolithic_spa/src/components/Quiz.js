import React, { useState } from 'react';

/*
  PUBLIC_INTERFACE
  Quiz: MCQ Quiz UI with feedback and accessibility features
  Props: mcqs (array), onComplete(), onRestart()
*/

function shuffle(array) {
  // Fisher–Yates
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// PUBLIC_INTERFACE
export default function Quiz({ mcqs, onComplete, onRestart }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const total = mcqs.length;

  const handleOption = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === mcqs[idx].answer) setScore(x => x+1);
    setTimeout(() => {
      if (idx === total - 1) {
        setDone(true);
        onComplete && onComplete(score + (opt === mcqs[idx].answer ? 1 : 0));
      } else {
        setIdx(idx + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 1350);
  };

  if (!mcqs || mcqs.length === 0) {
    return <div>No quiz data available.</div>
  }

  // Shuffle options for each question
  const options = React.useMemo(() => shuffle([...mcqs[idx].options]), [idx]);

  return (
    <section className="hero" aria-label="Quiz">
      <div className="subtitle">3. Quiz Mode</div>
      <div className="description" style={{marginBottom: 16}}>
        Question {idx + 1} of {total}
        <span style={{ marginLeft:18, fontWeight:500, color: 'var(--kavia-orange)' }}>Score: {score}</span>
      </div>
      <div aria-label={`Question ${idx+1}`}>
        <h2 className="title" style={{fontSize:'2rem'}}>{mcqs[idx].question}</h2>
        <ul style={{listStyle:'none', padding:0, margin:0, maxWidth:360}}>
          {options.map(opt => (
            <li key={opt} style={{margin:'10px 0'}}>
              <button
                className="btn"
                style={{
                  width:'100%',
                  background: selected
                              ? (opt === mcqs[idx].answer
                                  ? '#51CB55' // correct - green
                                  : opt === selected
                                    ? '#F87070' // wrong - red
                                    : 'var(--kavia-orange)')
                              : 'var(--kavia-orange)',
                  cursor: answered ? 'default' : 'pointer',
                  opacity: answered && opt !== selected && opt !== mcqs[idx].answer ? 0.77 : 1
                }}
                disabled={answered}
                aria-pressed={selected === opt}
                onClick={() => handleOption(opt)}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{margin:'26px auto 10px', display:'flex', gap: 16}}>
        <button className="btn" onClick={onRestart}>Restart</button>
        {done && <button className="btn btn-large" onClick={onComplete}>Finish</button>}
      </div>
      <div style={{marginTop:18, color:'var(--text-secondary)', fontSize:'1em'}}>
        {answered && (
          selected === mcqs[idx].answer
            ? <span aria-live="assertive">✅ Correct!</span>
            : <span aria-live="assertive">❌ Incorrect. The correct answer was <b>{mcqs[idx].answer}</b>.</span>
        )}
      </div>
    </section>
  );
}
