import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('search') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setQ(params.get('search') || ''); }, [params]);
  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/shop?search=${encodeURIComponent(q.trim())}` : '/shop');
  };

  return (
    <header className="header" data-testid="header">
      <div className="announce">Free delivery across Pakistan on orders over Rs 5,000</div>
      <div className="header__bar container">
        <Link to="/" className="logo" data-testid="logo">Nova<span>Mart</span></Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/shop" end data-testid="nav-shop">Shop all</NavLink>
          <NavLink to="/shop?category=electronics" data-testid="nav-electronics">Electronics</NavLink>
          <NavLink to="/shop?category=fashion" data-testid="nav-fashion">Fashion</NavLink>
          <NavLink to="/shop?category=home" data-testid="nav-home">Home</NavLink>
        </nav>
        <form className="search" onSubmit={onSearch} role="search">
          <input
            type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)}
            aria-label="Search products" data-testid="search-input"
          />
          <button type="submit" aria-label="Search" data-testid="search-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
        </form>
        <div className="header__actions">
          {user ? (
            <div className="account" ref={menuRef}>
              <button className="account__btn" onClick={() => setMenuOpen((o) => !o)} data-testid="account-menu" aria-expanded={menuOpen}>
                <span className="avatar">{user.name[0].toUpperCase()}</span>
                <span className="account__name" data-testid="user-name">{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="dropdown" data-testid="account-dropdown" onClick={() => setMenuOpen(false)}>
                  <div className="dropdown__head">{user.email}</div>
                  <Link to="/orders" data-testid="nav-orders">My orders</Link>
                  {user.role === 'admin' && <Link to="/admin" data-testid="nav-admin">Admin dashboard</Link>}
                  <button onClick={() => { logout(); navigate('/'); }} data-testid="logout-button">Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="link-btn" data-testid="nav-login">Log in</Link>
          )}
          <Link to="/cart" className="cart-btn" data-testid="nav-cart" aria-label={`Cart, ${cart.itemCount} items`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 7h12l-1 13H7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
            {cart.itemCount > 0 && <span className="badge" data-testid="cart-count">{cart.itemCount}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
