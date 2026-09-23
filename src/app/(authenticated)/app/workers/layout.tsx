export default function WorkersLayout({
  children,
  drawer,
}: Readonly<{ children: React.ReactNode; drawer: React.ReactNode }>) {
  return (
    <>
      {children}
      {drawer}
    </>
  );
}
