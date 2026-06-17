import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  BallIcon, BankIcon, SettingsIcon, LogoutIcon, ChipIcon, MenuIcon, XIcon, TrophyIcon
} from '../../assets/Icons'

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar">
        <div className="nav-inner">
          <NavLink to="/betting" className="nav-logo">
            <span className="nav-logo-icon"><TrophyIcon size={20} /></span>
            Mundial Bet 2026
          </NavLink>

          <div className="nav-links">
            <NavLink to="/betting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <BallIcon size={16} /> Apuestas
            </NavLink>
            <NavLink to="/bank" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <BankIcon size={16} /> Banco
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <SettingsIcon size={16} /> Admin
              </NavLink>
            )}
            <div className="nav-balance">
              <ChipIcon size={15} />
              {Number(profile?.chips_balance ?? 0).toFixed(0)}
            </div>
            <button className="nav-signout" onClick={handleSignOut}>
              <LogoutIcon size={16} /> Salir
            </button>
          </div>

          <button className="nav-mobile-toggle" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>
      </nav>

      <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}>
        <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
          <div className="nav-balance" style={{ display: 'inline-flex' }}>
            <ChipIcon size={15} /> {Number(profile?.chips_balance ?? 0).toFixed(0)} fichas
          </div>
        </div>
        <NavLink to="/betting" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
          <BallIcon size={16} /> Apuestas
        </NavLink>
        <NavLink to="/bank" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
          <BankIcon size={16} /> Banco
        </NavLink>
        {profile?.role === 'admin' && (
          <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
            <SettingsIcon size={16} /> Admin
          </NavLink>
        )}
        <button className="nav-signout" onClick={handleSignOut}>
          <LogoutIcon size={16} /> Cerrar sesion
        </button>
      </div>
    </>
  )
}
