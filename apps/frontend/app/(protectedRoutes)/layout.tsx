import PageHeading from "./PageHeading";
import Servers from "./Projects";

function layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen min-h-[40rem] w-screen min-w-[40rem] flex-col bg-white">
      <PageHeading />

      <div className="flex grow">
        <Servers />
        <div className="w-full rounded-tl-3xl border border-gray-300 bg-gray-50">
          {children}
        </div>
      </div>
    </div>
  );
}

export default layout;
