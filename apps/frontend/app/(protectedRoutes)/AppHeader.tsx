function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-start-2 col-end-4 row-start-1 row-end-2 flex items-center gap-5 border-b border-gray-300 bg-gray-100 px-10">
      {children}
    </div>
  );
}

export default AppHeader;
