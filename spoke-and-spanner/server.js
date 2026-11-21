import express from 'express';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
const file = process.env.BOOKINGS_FILE || fileURLToPath(new URL('./bookings.json', import.meta.url));
let bookings = [];
try {
  bookings = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const repairs = [
  { id: 'puncture', name: 'Puncture repair', detail: 'Replace an inner tube and check the tyre.', price: 15 },
  { id: 'brakes', name: 'Brake adjustment', detail: 'Adjust front and rear brakes.', price: 25 },
  { id: 'service', name: 'Basic service', detail: 'Check gears, brakes and tyres.', price: 55 }
];
const hours = ['10:00', '11:30', '14:00', '15:30'];
function availableSlots() {
  const slots = [];
  const day = new Date();
  for (let offset = 0; offset < 10; offset++) {
    day.setUTCDate(day.getUTCDate() + 1);
    if (day.getUTCDay() === 0 || day.getUTCDay() === 1) continue;
    const date = day.toISOString().slice(0, 10);
    for (const time of hours) {
      const id = date + 'T' + time;
      if (!bookings.some(booking => booking.slot === id)) slots.push({ id, date, time });
    }
  }
  return slots;
}

app.use(express.json({ limit: '8kb' }));
app.get('/api/repairs', (_req, res) => res.json(repairs));
app.get('/api/slots', (_req, res) => res.set('Cache-Control', 'no-store').json(availableSlots()));
app.post('/api/bookings', (req, res) => {
  const { repair, slot, name } = req.body ?? {};
  const service = repairs.find(item => item.id === repair);
  if (!service || typeof name !== 'string' || !name.trim() || name.trim().length > 80 || typeof slot !== 'string') {
    return res.status(400).json({ error: 'Enter your name and choose a repair and time.' });
  }
  const appointment = availableSlots().find(item => item.id === slot);
  if (!appointment) return res.status(409).json({ error: 'That time is unavailable. Choose another time.' });
  const booking = { reference: randomUUID(), repair, slot, name: name.trim() };
  const updated = [...bookings, booking];
  writeFileSync(file + '.tmp', JSON.stringify(updated, null, 2));
  renameSync(file + '.tmp', file);
  bookings = updated;
  res.status(201).json({ reference: booking.reference, repair: service.name, appointment });
});
app.use('/api', (_req, res) => res.status(404).json({ error: 'Page not found.' }));
app.use(express.static(fileURLToPath(new URL('./dist', import.meta.url))));
app.use((error, _req, res, _next) => {
  if (error.status === 400 || error.status === 413) {
    return res.status(error.status).json({ error: 'The booking request could not be read.' });
  }
  console.error(error);
  res.status(500).json({ error: 'The server could not complete the request. Try again.' });
});
app.listen(process.env.PORT || 3000, () => console.log('Spoke & Spanner is running.'));
