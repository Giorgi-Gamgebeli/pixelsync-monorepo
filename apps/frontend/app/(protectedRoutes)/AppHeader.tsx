function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-12 items-center gap-4 border-b border-border px-6">
      {children}
    </div>
  );
}

export default AppHeader;
