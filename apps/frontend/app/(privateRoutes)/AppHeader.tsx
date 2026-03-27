function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-border flex h-12 items-center gap-4 border-b px-6">
      {children}
    </div>
  );
}

export default AppHeader;
