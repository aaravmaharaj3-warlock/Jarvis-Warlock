export const metadata = {
  title: "Jarvis",
  description: "Your personal AI assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
