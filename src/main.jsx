import React from 'react';
import { createRoot } from 'react-dom/client';
import movieText from '../assets/text-content.md?raw';
import './style.css';

const posters = [
  'who-framed-roger-rabbit', 'hook', 'la-la-land',
  'hidden-figures', 'palm-springs', 'barbie',
];
const images = import.meta.glob('../assets/*.jpg', { eager: true, import: 'default' });
const movies = movieText.trim().split(/^# /m).filter(Boolean).map((entry, index) => {
  const [title, ...description] = entry.trim().split('\n');
  return {
    title,
    description: description.join(' ').trim(),
    poster: images['../assets/' + posters[index] + '.jpg'],
  };
});

function Header() {
  return (
    <header className="site-header">
      <h1>watch.it</h1>
      <nav aria-label="Movie genres">
        <ul>
          {['Action', 'Comedy', 'Romance', 'Drama'].map((genre) => (
            <li key={genre}>{genre}</li>
          ))}
        </ul>
      </nav>
      <button type="button">Search</button>
    </header>
  );
}

function MovieCard({ movie }) {
  return (
    <article className="movie-card">
      <img src={movie.poster} alt={movie.title + ' poster'} />
      <div className="movie-details">
        <div>
          <h2>{movie.title}</h2>
          <p>{movie.description}</p>
        </div>
        <button type="button" aria-label={'Watch ' + movie.title}>Watch now</button>
      </div>
    </article>
  );
}

function App() {
  return (
    <>
      <Header />
      <main className="movie-grid" aria-label="Movies">
        {movies.map((movie) => <MovieCard key={movie.title} movie={movie} />)}
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
