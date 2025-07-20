import WhiteBoard from "../../../_components/WhiteBoard";

function Page() {
  return (
    <main className="bg-red h-screen w-screen">
      <div style={{ position: "fixed", inset: 0 }}>
        <WhiteBoard />
      </div>
    </main>
  );
}

export default Page;
