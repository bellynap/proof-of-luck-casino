export const metadata = {
  title: 'Proof of Luck Casino',
  description: 'Provably fair gambling on Oasis Sapphire + ROFL',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
