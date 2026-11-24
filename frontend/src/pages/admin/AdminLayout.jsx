import { NavLink, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="container admin" data-testid="admin-layout">
      <aside className="admin__nav">
        <div className="admin__label">Admin</div>
        <NavLink to="/admin" end data-testid="admin-nav-dashboard">Dashboard</NavLink>
        <NavLink to="/admin/products" data-testid="admin-nav-products">Products</NavLink>
        <NavLink to="/admin/orders" data-testid="admin-nav-orders">Orders</NavLink>
        <a href="/api-docs" target="_blank" rel="noreferrer">API docs ↗</a>
      </aside>
      <section className="admin__body"><Outlet /></section>
    </div>
  );
}
