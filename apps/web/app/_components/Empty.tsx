function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <p>{text}</p>
    </div>
  );
}

export default Empty;
