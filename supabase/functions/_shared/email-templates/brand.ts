/// <reference types="npm:@types/react@18.3.1" />

export const brand = {
  name: 'Sportstalent',
  tagline: 'Made for More. Built to Perform.',
  gold: '#F5C842',
  dark: '#0B0C14',
  legal: 'Sportstalent · sportstalent.dk',
}

export const styles = {
  main: {
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, Helvetica, Arial, sans-serif',
    margin: '0',
    padding: '0',
  },
  container: { padding: '24px 20px 40px', maxWidth: '560px' },
  header: {
    backgroundColor: brand.dark,
    borderRadius: '14px 14px 0 0',
    padding: '24px 28px 20px',
  },
  logo: {
    fontSize: '22px',
    fontWeight: 900 as const,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    margin: '0',
  },
  logoAccent: { color: brand.gold },
  tagline: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: '0.08em',
    margin: '6px 0 0',
    textTransform: 'uppercase' as const,
  },
  card: {
    border: '1px solid #e8e8ec',
    borderTop: 'none',
    borderRadius: '0 0 14px 14px',
    padding: '28px',
  },
  h1: {
    fontSize: '22px',
    fontWeight: 800 as const,
    color: brand.dark,
    margin: '0 0 14px',
    letterSpacing: '-0.01em',
  },
  text: {
    fontSize: '15px',
    color: '#4a4d57',
    lineHeight: '1.6',
    margin: '0 0 24px',
  },
  button: {
    backgroundColor: brand.gold,
    color: brand.dark,
    fontSize: '15px',
    fontWeight: 800 as const,
    borderRadius: '10px',
    padding: '13px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  code: {
    fontFamily: 'Courier, monospace',
    fontSize: '28px',
    fontWeight: 800 as const,
    letterSpacing: '0.18em',
    color: brand.dark,
    margin: '0 0 24px',
  },
  link: { color: brand.dark, textDecoration: 'underline' },
  footer: {
    fontSize: '12px',
    color: '#8a8d97',
    lineHeight: '1.5',
    margin: '28px 0 0',
  },
  legal: {
    fontSize: '11px',
    color: '#a5a8b0',
    textAlign: 'center' as const,
    margin: '20px 0 0',
  },
}
