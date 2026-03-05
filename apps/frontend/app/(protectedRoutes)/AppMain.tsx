function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto bg-primary">{children}</main>
  );
}

export default AppMain;
