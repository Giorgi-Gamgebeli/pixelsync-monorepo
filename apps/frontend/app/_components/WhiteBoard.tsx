"use client";

import { defaultTools, Editor, Tldraw } from "tldraw";
import "tldraw/tldraw.css";

function WhiteBoard() {
  const handleMount = (editor: Editor) => {
    editor.createShape({
      type: "text",
      x: 20,
      y: 20,
      props: {
        text: "Hello world!",
      },
    });
    editor.setCurrentTool("select");
  };

  return (
    <Tldraw
      tools={defaultTools}
      autoFocus={true}
      onMount={handleMount}
      // className="border-primary  border"

      // persistenceKey="example"
    />
  );
}

export default WhiteBoard;
