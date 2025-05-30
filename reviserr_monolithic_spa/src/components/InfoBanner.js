import React from 'react';

// PUBLIC_INTERFACE
// InfoBanner: Banner for error/info with contrast, supports ARIA
export default function InfoBanner({ type, message }) {
  return (
    <div
      role={type === 'error' ? "alert" : "status"}
      aria-live={type === 'error' ? "assertive" : "polite"}
      style={{
        background: type === 'error' ? '#FF5959' : '#61D4B3',
        color: '#181818',
        borderRadius: 4,
        padding: '8px 18px',
        margin: '12px auto 24px',
        fontWeight: 500,
        maxWidth: '93vw'
      }}
    >
      {type === 'error' ? "⚠️ " : "ℹ️ "}
      {message}
    </div>
  )
}
