import React from 'react';
import { Link } from 'react-router-dom'; // ייבוא Link
import './Header.css'

function Header() {
  return (
    <header className="header bg-dark text-white">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="/">MotorSport</a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link to="/" className="nav-link">דף הבית</Link>
              </li>
              <li className="nav-item">
                <Link to="/services" className="nav-link">שירותים</Link>
              </li>
              <li className="nav-item">
                <Link to="/contact" className="nav-link">צור קשר</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
