function AppMain({ children }: { children: React.ReactNode }) {
  return <main className="bg-primary flex-1 overflow-y-auto">{children}</main>;
}

export default AppMain;
