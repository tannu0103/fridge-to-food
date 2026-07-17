export default function Header() {
  return (
    <header className="site-header">
      <div className="site-header__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="26" height="26" fill="none">
          <path d="M9 3c-1.2 3-1.2 6 0 9M16 3c-1.6 3.5-1.6 6.5 0 10M23 3c-1.2 3-1.2 6 0 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M6 15c0-1.1.9-2 2-2h16a2 2 0 0 1 2 2v0a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6v0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M9 21v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="site-header__word">FridgeFeast</span>
      <span className="site-header__tag">fridge → recipe</span>
    </header>
  );
}
