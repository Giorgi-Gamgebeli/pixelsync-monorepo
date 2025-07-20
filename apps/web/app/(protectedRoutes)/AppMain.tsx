function AppMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="col-start-2 col-end-4 row-start-2 -row-end-1 bg-gray-100">
      {children}
    </main>
  );
}

export default AppMain;
