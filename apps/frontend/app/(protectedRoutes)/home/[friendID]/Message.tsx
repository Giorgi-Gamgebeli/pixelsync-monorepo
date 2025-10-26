type MesasageProps = {
  text: string;
};

function Message({ text }: MesasageProps) {
  return (
    <div>
      <p>{text}</p>
    </div>
  );
}

export default Message;
