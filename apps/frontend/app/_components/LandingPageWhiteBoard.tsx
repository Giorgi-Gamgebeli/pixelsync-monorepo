"use client";

import { Editor, Tldraw } from "tldraw";
import Tilt from "react-parallax-tilt";
import "tldraw/tldraw.css";

function LandingPageWhiteBoard() {
  const handleMount = (editor: Editor) => {
    editor.createShape({
      type: "text",
      x: 250,
      y: 250,
      props: {
        text: "Hello world!",
      },
    });
    editor.setCurrentTool("select");
  };

  return (
    <Tilt tiltAngleXManual={10} tiltAngleYManual={-25} scale={1.01}>
      <Tldraw
        autoFocus={true}
        onMount={handleMount}
        className="border-primary border"
        // persistenceKey="example"
        components={{
          PageMenu: () => null,
          MenuPanel: () => null,
          ZoomMenu: () => null,
          ActionsMenu: () => null,
          KeyboardShortcutsDialog: () => null,

          // Toolbar: () => (
          //   <DefaultToolbar>
          //     <SelectToolbarItem />
          //     <DrawToolbarItem />
          //     <RectangleToolbarItem />
          //     <TextToolbarItem />
          //     <EraserToolbarItem />
          //     <EllipseToolbarItem />
          //     <ArrowToolbarItem />
          //     <FrameToolbarItem />
          //     <NoteToolbarItem />
          //     <LineToolbarItem />
          //   </DefaultToolbar>
          // ),
        }}
      />
    </Tilt>
  );
}

export default LandingPageWhiteBoard;
