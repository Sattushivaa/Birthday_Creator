import { useEffect, useRef, useState } from 'react';
import { subscribeToasts } from '../../toast.js';

/** Renders transient toasts top-right. Mount once, in the creator shell. */
export default function Toasts() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsub = subscribeToasts((t) => {
      if (t.dismiss) {
        setItems((cur) => cur.filter((x) => x.id !== t.id));
      } else {
        setItems((cur) => [...cur, t]);
      }
    });
    return unsub;
  }, []);

  if (!items.length) return null;
  return (
    <div role="status" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}