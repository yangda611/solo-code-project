export const metadata = {
  title: 'Phononic Bandgap Designer - Backend',
  description: 'Backend API for Phononic Bandgap Designer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
