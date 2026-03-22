"use client";

import InviteModal from "../InviteModal";
import BoardCanvas from "@/app/(protectedRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/BoardCanvas";
import DesignPanel from "./htmlCssBoardRoom/DesignPanel";
import GrapesEditorCanvas from "@/app/(protectedRoutes)/project/[projectId]/[roomId]/htmlCssBoardRoom/GrapesEditorCanvas";
import LayersPanel from "./htmlCssBoardRoom/LayersPanel";
import RoomHeader from "./htmlCssBoardRoom/RoomHeader";
import { BoardProvider, useBoard } from "./htmlCssBoardRoom/BoardContext";
import type { HtmlCssBoardRoomProps } from "./htmlCssBoardRoom/types";

export default function HtmlCssBoardRoom(props: HtmlCssBoardRoomProps) {
  return (
    <BoardProvider
      roomId={props.roomId}
      projectId={props.projectId}
      roomName={props.roomName}
      onlineCount={props.onlineCount}
    >
      <HtmlCssBoardRoomContent />
    </BoardProvider>
  );
}

function HtmlCssBoardRoomContent() {
  const {
    layersOpen,
    propertiesOpen,
    editMode,
    showInvite,
    setShowInvite,
    projectId,
    roomName,
  } = useBoard();

  return (
    <div className="flex h-screen max-w-screen flex-col overflow-hidden bg-[#121212] text-white">
      <RoomHeader />

      <div className="flex flex-1 overflow-hidden">
        {layersOpen && <LayersPanel />}

        <main
          className={`relative flex-1 overflow-hidden ${
            editMode ? "bg-[#0d1220]" : "bg-[#121212]"
          }`}
          style={
            editMode
              ? undefined
              : {
                  backgroundImage:
                    "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)",
                  backgroundSize: "28px 28px",
                }
          }
        >
          <BoardCanvas />
          <GrapesEditorCanvas />
        </main>

        {editMode && propertiesOpen && <DesignPanel />}
      </div>

      {showInvite && (
        <InviteModal
          projectId={projectId}
          projectName={roomName}
          onClose={() => setShowInvite(false)}
        />
      )}

      <style jsx global>{`
        .html-css-edit-root,
        .html-css-edit-root .gjs-editor,
        .html-css-edit-root .gjs-cv-canvas,
        .html-css-edit-root .gjs-cv-canvas__frames {
          width: 100% !important;
          height: 100% !important;
          min-height: 0 !important;
        }

        .html-css-edit-root .gjs-editor,
        .html-css-edit-root .gjs-one-bg {
          background: transparent !important;
        }

        .html-css-edit-root .gjs-editor {
          position: relative !important;
        }

        .html-css-edit-root .gjs-cv-canvas {
          position: absolute !important;
          right: 0 !important;
          bottom: 0 !important;
          top: 0 !important;
          left: 0 !important;
          background: #0d1220 !important;
        }

        .html-css-edit-root .gjs-cv-canvas__frames {
          position: relative !important;
          display: flex !important;
          justify-content: flex-start !important;
          align-items: flex-start !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          padding: 0 !important;
        }

        .html-css-edit-root .gjs-frame-wrapper {
          position: relative !important;
          padding: 0 !important;
          margin: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .html-css-edit-root .gjs-frame {
          border: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .html-css-edit-root .gjs-frame > iframe {
          max-width: none !important;
          background: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
