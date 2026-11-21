import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const sections = [
  ['repairs', 'Repairs & Prices'],
  ['book', 'Book a Repair'],
  ['hours', 'Opening Hours']
];
const dateLabel = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC'
});

function slotLabel(slot) {
  return dateLabel.format(new Date(slot.date + 'T12:00:00Z')) + ' at ' + slot.time;
}

async function request(path, options) {
  const response = await fetch('/api/' + path, options);
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error);
    error.status = response.status;
    throw error;
  }
  return data;
}

function Booking({ repairs }) {
  const [slots, setSlots] = useState(null);
  const [slotError, setSlotError] = useState('');
  const [error, setError] = useState('');
  const [repair, setRepair] = useState('');
  const [slot, setSlot] = useState('');
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(null);
  const service = repairs.find(item => item.id === repair);
  const appointment = slots?.find(item => item.id === slot);

  async function loadSlots() {
    setSlotError('');
    setSlots(null);
    try {
      setSlots(await request('slots'));
    } catch {
      setSlotError('Available times could not be loaded.');
    }
  }

  useEffect(() => { loadSlots(); }, []);

  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const name = new FormData(event.currentTarget).get('name');
      setConfirmed(await request('bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, repair, slot })
      }));
    } catch (failure) {
      setError(failure.status ? failure.message : 'Could not connect. Try again.');
      if (failure.status === 409) {
        setSlot('');
        await loadSlots();
      }
    } finally {
      setPending(false);
    }
  }

  if (confirmed) return <section className="panel confirmation" aria-live="polite">
    <h2>Booking confirmed</h2>
    <p>{confirmed.repair} · {slotLabel(confirmed.appointment)}</p>
    <p>Reference <strong>{confirmed.reference}</strong></p>
    <button onClick={() => { setConfirmed(null); setSlot(''); loadSlots(); }}>Book another repair</button>
  </section>;

  return <section className="panel">
    <h2>Book a repair</h2>
    <div className="booking">
      <form onSubmit={submit}>
        <fieldset disabled={pending}>
          <label>Your name<input name="name" autoComplete="name" maxLength="80" required /></label>
          <label>Repair<select value={repair} onChange={event => setRepair(event.target.value)} required>
            <option value="">Choose a repair</option>
            {repairs.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
          </select></label>
          <label>Available time<select value={slot} onChange={event => setSlot(event.target.value)} disabled={!slots?.length} required>
            <option value="">{slots ? 'Choose a time' : slotError ? 'Times unavailable' : 'Loading times…'}</option>
            {slots?.map(item => <option key={item.id} value={item.id}>{slotLabel(item)}</option>)}
          </select></label>
          {slotError && <p role="alert">{slotError} <button type="button" onClick={loadSlots}>Retry</button></p>}
          {slots?.length === 0 && <p role="status">There are no appointments available in the next ten days.</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={!repair || !slot || !slots?.length}>{pending ? 'Booking…' : 'Confirm booking'}</button>
        </fieldset>
      </form>
      <aside className="summary" aria-live="polite">
        <h3>Booking summary</h3>
        <p>{service ? service.name + ' · £' + service.price : 'Choose a repair to see the price.'}</p>
        {appointment && <p>{slotLabel(appointment)} (UK time)</p>}
      </aside>
    </div>
  </section>;
}

function App() {
  const [section, setSection] = useState('repairs');
  const [repairs, setRepairs] = useState(null);
  const [error, setError] = useState(false);

  function loadRepairs() {
    setError(false);
    request('repairs').then(setRepairs).catch(() => setError(true));
  }

  useEffect(loadRepairs, []);

  return <main>
    <header>
      <p className="brand">Spoke &amp; Spanner</p>
      <h1>Bike repairs and servicing</h1>
      <p>Check prices, pick a time and book your bike in.</p>
    </header>
    <nav aria-label="Workshop services">
      {sections.map(([id, label]) => <button key={id} className={id === 'book' ? 'primary' : ''}
        aria-pressed={section === id} onClick={() => setSection(id)}>{label}</button>)}
    </nav>
    {section === 'hours' ? <section className="panel">
      <h2>Opening hours</h2>
      <dl className="hours"><dt>Tuesday to Saturday</dt><dd>10:00–17:00</dd><dt>Sunday and Monday</dt><dd>Closed</dd></dl>
      <p>Spoke &amp; Spanner is a fictional workshop.</p>
    </section> : !repairs ? <section className="panel">
      {error ? <p role="alert">Repairs could not be loaded. <button onClick={loadRepairs}>Retry</button></p> : <p role="status">Loading repairs…</p>}
    </section> : section === 'book' ? <Booking repairs={repairs} /> : <section className="panel">
      <h2>Repairs &amp; prices</h2>
      <ul className="services">{repairs.map(item => <li key={item.id}>
        <div><h3>{item.name}</h3><p>{item.detail}</p></div><strong>£{item.price}</strong>
      </li>)}</ul>
    </section>}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
