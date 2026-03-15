"use client";

import {
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { CallType } from "@repo/types";
import { useSocketContext } from "./SocketContext";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

type CallState = "idle" | "ringing-outgoing" | "ringing-incoming" | "active";

type CallUiMode = "idle" | "mini" | "panel" | "full";

type CallConnectionState = "stable" | "reconnecting" | "failed";

type IncomingCallInfo = {
  callId: string;
  callerId: string;
  callerName: string;
  callType: CallType;
};

type CallContextValue = {
  callState: CallState;
  callType: CallType | null;
  callId: string | null;
  incomingCall: IncomingCallInfo | null;
  callStartedAt: number | null;
  callUiMode: CallUiMode;
  callConnectionState: CallConnectionState;
  /** Groups that have an active call right now (even if we're not in it). groupId -> { callId, participantCount } */
  activeGroupCalls: Record<number, { callId: string; participantCount: number }>;
  /** When we're in a group call, the group id */
  activeGroupId: number | null;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  audioEnabled: boolean;
  videoEnabled: boolean;
  /** Remote participants' media state (userId -> { audioEnabled, videoEnabled }). Updated via call:media-state. */
  remoteMediaState: Map<string, { audioEnabled: boolean; videoEnabled: boolean }>;
  groupParticipants: Map<string, string>;
  initiateCall: (receiverId: string, callType: CallType) => void;
  acceptCall: () => void;
  declineCall: () => void;
  hangup: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  joinGroupCall: (groupId: number, callType: CallType) => void;
  leaveGroupCall: () => void;
  setCallUiMode: (mode: CallUiMode) => void;
};

const noop = () => {};
const noopAsync = async () => {};

const CallContext = createContext<CallContextValue>({
  callState: "idle",
  callType: null,
  callId: null,
  incomingCall: null,
  callStartedAt: null,
  callUiMode: "idle",
  callConnectionState: "stable",
  activeGroupCalls: {},
  activeGroupId: null,
  localStream: null,
  remoteStreams: new Map(),
  audioEnabled: true,
  videoEnabled: true,
  remoteMediaState: new Map(),
  groupParticipants: new Map(),
  initiateCall: noopAsync,
  acceptCall: noopAsync,
  declineCall: noop,
  hangup: noop,
  toggleMute: noop,
  toggleCamera: noop,
  joinGroupCall: noopAsync,
  leaveGroupCall: noop,
  setCallUiMode: noop,
});

function CallProvider({ children }: PropsWithChildren) {
  const { socket } = useSocketContext();
  const [callState, setCallState] = useState<CallState>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(
    null,
  );
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [callUiMode, setCallUiMode] = useState<CallUiMode>("idle");
  const [callConnectionState, setCallConnectionState] =
    useState<CallConnectionState>("stable");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(
    new Map(),
  );
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteMediaState, setRemoteMediaState] = useState<
    Map<string, { audioEnabled: boolean; videoEnabled: boolean }>
  >(new Map());
  const [groupParticipants, setGroupParticipants] = useState<
    Map<string, string>
  >(new Map());
  const [activeGroupCalls, setActiveGroupCalls] = useState<
    Record<number, { callId: string; participantCount: number }>
  >({});
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

  // Refs for values that socket handlers need without triggering effect re-runs
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceCandidateQueues = useRef<Map<string, RTCIceCandidateInit[]>>(
    new Map(),
  );
  const callIdRef = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTypeRef = useRef<CallType | null>(null);
  const incomingCallRef = useRef<IncomingCallInfo | null>(null);
  const callStartedAtRef = useRef<number | null>(null);

  // Audio elements for call sounds
  const incomingSoundRef = useRef<HTMLAudioElement | null>(null);
  const outgoingSoundRef = useRef<HTMLAudioElement | null>(null);
  const endSoundRef = useRef<HTMLAudioElement | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    callIdRef.current = callId;
  }, [callId]);
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);
  useEffect(() => {
    callTypeRef.current = callType;
  }, [callType]);
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);
  useEffect(() => {
    callStartedAtRef.current = callStartedAt;
  }, [callStartedAt]);

  // Initialize audio elements once on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    incomingSoundRef.current = new Audio("/sounds/incoming_call.mp3");
    outgoingSoundRef.current = new Audio("/sounds/outgoing_call.mp3");
    endSoundRef.current = new Audio("/sounds/call_end.mp3");

    if (incomingSoundRef.current) {
      incomingSoundRef.current.loop = true;
      incomingSoundRef.current.volume = 0.6;
    }
    if (outgoingSoundRef.current) {
      outgoingSoundRef.current.loop = true;
      outgoingSoundRef.current.volume = 0.5;
    }
    if (endSoundRef.current) {
      endSoundRef.current.volume = 0.6;
    }
  }, []);

  const getMedia = useCallback(async (type: CallType) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    setLocalStream(stream);
    localStreamRef.current = stream;
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    (remoteUserId: string, stream: MediaStream) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && callIdRef.current) {
          socket.emit("call:ice-candidate", {
            callId: callIdRef.current,
            toUserId: remoteUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (!remoteStream) return;
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(remoteUserId, remoteStream);
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "disconnected" ||
          pc.connectionState === "failed"
        ) {
          const existing = peerConnections.current.get(remoteUserId);
          if (existing) {
            existing.close();
            peerConnections.current.delete(remoteUserId);
          }
          iceCandidateQueues.current.delete(remoteUserId);
          setRemoteStreams((prev) => {
            const next = new Map(prev);
            next.delete(remoteUserId);
            return next;
          });
        }
      };

      peerConnections.current.set(remoteUserId, pc);
      return pc;
    },
    [socket],
  );

  const flushIceCandidates = useCallback(
    async (userId: string, pc: RTCPeerConnection) => {
      const queue = iceCandidateQueues.current.get(userId);
      if (!queue) return;
      for (const candidate of queue) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      iceCandidateQueues.current.delete(userId);
    },
    [],
  );

  const cleanupAll = useCallback(() => {
    for (const [, pc] of peerConnections.current) {
      pc.close();
    }
    peerConnections.current.clear();
    iceCandidateQueues.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStreams(new Map());
    setCallState("idle");
    setCallUiMode("idle");
    setCallConnectionState("stable");
    setCallStartedAt(null);
    setCallType(null);
    setCallId(null);
    setIncomingCall(null);
    setRemoteMediaState(new Map());
    setGroupParticipants(new Map());
    setActiveGroupId(null);
    setAudioEnabled(true);
    setVideoEnabled(true);
    callIdRef.current = null;
    callTypeRef.current = null;
    incomingCallRef.current = null;
    callStartedAtRef.current = null;

    // Stop any playing sounds
    incomingSoundRef.current?.pause();
    outgoingSoundRef.current?.pause();
    if (incomingSoundRef.current) incomingSoundRef.current.currentTime = 0;
    if (outgoingSoundRef.current) outgoingSoundRef.current.currentTime = 0;
  }, []); // No deps — uses only refs and setters (stable)

  // Drive call sounds from high-level call state
  useEffect(() => {
    const incoming = incomingSoundRef.current;
    const outgoing = outgoingSoundRef.current;
    const end = endSoundRef.current;

    if (!incoming || !outgoing) return;

    if (callState === "ringing-incoming") {
      // Incoming call ringtone
      outgoing.pause();
      outgoing.currentTime = 0;
      incoming
        .play()
        .catch(() => {
          // Autoplay might be blocked; ignore
        });
    } else if (callState === "ringing-outgoing") {
      // Outgoing call ringback
      incoming.pause();
      incoming.currentTime = 0;
      outgoing
        .play()
        .catch(() => {
          // Autoplay might be blocked; ignore
        });
    } else {
      // Any other state: stop ringing
      const wasRinging =
        !incoming.paused || !outgoing.paused;
      incoming.pause();
      outgoing.pause();
      incoming.currentTime = 0;
      outgoing.currentTime = 0;
      // Optional: play a short end sound when leaving a ringing state to idle
      if (callState === "idle" && wasRinging && end) {
        end
          .play()
          .catch(() => {
            // ignore
          });
      }
    }
  }, [callState]);

  // ── Socket event listeners — depends only on socket + stable callbacks ──

  useEffect(() => {
    if (!socket) return;

    const onRinging = (data: { callId: string }) => {
      setCallId(data.callId);
      callIdRef.current = data.callId;
    };

    const onIncoming = (data: IncomingCallInfo) => {
      if (callIdRef.current) {
        socket.emit("call:decline", { callId: data.callId });
        return;
      }
      setIncomingCall(data);
      incomingCallRef.current = data;
      setCallState("ringing-incoming");
      setCallType(data.callType);
      callTypeRef.current = data.callType;
      setCallId(data.callId);
      callIdRef.current = data.callId;
    };

    const onAccepted = async (data: { callId: string; userId: string }) => {
      if (data.callId !== callIdRef.current) return;
      setCallState("active");
      setCallUiMode("full");
      setCallStartedAt(Date.now());

      const stream =
        localStreamRef.current ?? (await getMedia(callTypeRef.current!));
      const pc = createPeerConnection(data.userId, stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:offer", {
        callId: data.callId,
        toUserId: data.userId,
        offer: { type: offer.type, sdp: offer.sdp },
      });
    };

    const onDeclined = (data: { callId: string }) => {
      if (data.callId !== callIdRef.current) return;
      cleanupAll();
    };

    const onEnded = (data: { callId: string }) => {
      if (data.callId !== callIdRef.current) return;
      cleanupAll();
    };

    const onOffer = async (data: {
      callId: string;
      fromUserId: string;
      offer: { type: string; sdp?: string };
    }) => {
      if (data.callId !== callIdRef.current) return;
      const stream =
        localStreamRef.current ?? (await getMedia(callTypeRef.current!));
      const pc = createPeerConnection(data.fromUserId, stream);
      await pc.setRemoteDescription(
        new RTCSessionDescription(data.offer as RTCSessionDescriptionInit),
      );
      await flushIceCandidates(data.fromUserId, pc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("call:answer", {
        callId: data.callId,
        toUserId: data.fromUserId,
        answer: { type: answer.type, sdp: answer.sdp },
      });
    };

    const onAnswer = async (data: {
      callId: string;
      fromUserId: string;
      answer: { type: string; sdp?: string };
    }) => {
      if (data.callId !== callIdRef.current) return;
      const pc = peerConnections.current.get(data.fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(
        new RTCSessionDescription(data.answer as RTCSessionDescriptionInit),
      );
      await flushIceCandidates(data.fromUserId, pc);
    };

    const onIceCandidate = async (data: {
      callId: string;
      fromUserId: string;
      candidate: RTCIceCandidateInit;
    }) => {
      if (data.callId !== callIdRef.current) return;
      const pc = peerConnections.current.get(data.fromUserId);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } else {
        const queue =
          iceCandidateQueues.current.get(data.fromUserId) ?? [];
        queue.push(data.candidate);
        iceCandidateQueues.current.set(data.fromUserId, queue);
      }
    };

    const onGroupActive = async (data: {
      callId: string;
      participants: { userId: string; userName: string }[];
    }) => {
      setCallId(data.callId);
      callIdRef.current = data.callId;
      setCallState("active");
      setCallUiMode("full");
      setCallStartedAt(Date.now());

      const stream =
        localStreamRef.current ?? (await getMedia(callTypeRef.current!));

      const newParticipants = new Map<string, string>();
      for (const p of data.participants) {
        newParticipants.set(p.userId, p.userName);
        const pc = createPeerConnection(p.userId, stream);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:offer", {
          callId: data.callId,
          toUserId: p.userId,
          offer: { type: offer.type, sdp: offer.sdp },
        });
      }
      setGroupParticipants(newParticipants);
    };

    const onGroupCallStarted = (data: {
      groupId: number;
      callId: string;
      participantCount: number;
    }) => {
      setActiveGroupCalls((prev) => ({
        ...prev,
        [data.groupId]: {
          callId: data.callId,
          participantCount: data.participantCount,
        },
      }));
    };

    const onGroupJoined = (data: {
      callId: string;
      groupId: number;
      userId: string;
      userName: string;
      participantCount: number;
    }) => {
      setActiveGroupCalls((prev) => ({
        ...prev,
        [data.groupId]: {
          callId: data.callId,
          participantCount: data.participantCount,
        },
      }));
      if (data.callId !== callIdRef.current) return;
      setGroupParticipants((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.userName);
        return next;
      });
    };

    const onGroupLeft = (data: {
      callId: string;
      groupId: number;
      userId: string;
      participantCount: number;
    }) => {
      setActiveGroupCalls((prev) => {
        const next = { ...prev };
        if (data.participantCount <= 0) {
          delete next[data.groupId];
        } else {
          next[data.groupId] = {
            callId: data.callId,
            participantCount: data.participantCount,
          };
        }
        return next;
      });
      if (data.callId !== callIdRef.current) return;
      const pc = peerConnections.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(data.userId);
      }
      iceCandidateQueues.current.delete(data.userId);
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
      setGroupParticipants((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const onGroupCallEnded = (data: { groupId: number }) => {
      setActiveGroupCalls((prev) => {
        const next = { ...prev };
        delete next[data.groupId];
        return next;
      });
    };

    const onError = (data: { message: string }) => {
      console.error("[Call]", data.message);
      cleanupAll();
    };

    const onMediaState = (data: {
      userId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
    }) => {
      setRemoteMediaState((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          audioEnabled: data.audioEnabled,
          videoEnabled: data.videoEnabled,
        });
        return next;
      });
    };

    socket.on("call:ringing", onRinging);
    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:declined", onDeclined);
    socket.on("call:ended", onEnded);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onIceCandidate);
    socket.on("call:group-call-started", onGroupCallStarted);
    socket.on("call:group-active", onGroupActive);
    socket.on("call:group-joined", onGroupJoined);
    socket.on("call:group-left", onGroupLeft);
    socket.on("call:group-call-ended", onGroupCallEnded);
    socket.on("call:error", onError);
    socket.on("call:media-state", onMediaState);

    return () => {
      socket.off("call:ringing", onRinging);
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:declined", onDeclined);
      socket.off("call:ended", onEnded);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onIceCandidate);
      socket.off("call:group-call-started", onGroupCallStarted);
      socket.off("call:group-active", onGroupActive);
      socket.off("call:group-joined", onGroupJoined);
      socket.off("call:group-left", onGroupLeft);
      socket.off("call:group-call-ended", onGroupCallEnded);
      socket.off("call:error", onError);
      socket.off("call:media-state", onMediaState);
    };
  }, [socket, getMedia, createPeerConnection, flushIceCandidates, cleanupAll]);

  // Cleanup on unmount / tab close only
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (callIdRef.current && socket) {
        socket.emit("call:hangup", { callId: callIdRef.current });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket]);

  // ── Exposed actions ──

  const initiateCall = useCallback(
    async (receiverId: string, type: CallType) => {
      if (!socket || callIdRef.current) return;
      setCallType(type);
      callTypeRef.current = type;
      setCallState("ringing-outgoing");
      setCallUiMode("full");
      setCallConnectionState("stable");
      await getMedia(type);
      socket.emit("call:initiate", { receiverId, callType: type });
    },
    [socket, getMedia],
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCallRef.current) return;
    const info = incomingCallRef.current;
    setCallState("active");
    setCallUiMode("full");
    setCallStartedAt(Date.now());
    setCallConnectionState("stable");
    await getMedia(info.callType);
    socket.emit("call:accept", { callId: info.callId });
  }, [socket, getMedia]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCallRef.current) return;
    socket.emit("call:decline", { callId: incomingCallRef.current.callId });
    cleanupAll();
  }, [socket, cleanupAll]);

  const hangup = useCallback(() => {
    if (!socket || !callIdRef.current) return;
    socket.emit("call:hangup", { callId: callIdRef.current });
    cleanupAll();
  }, [socket, cleanupAll]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
      if (socket && callIdRef.current) {
        socket.emit("call:media-state", {
          callId: callIdRef.current,
          audioEnabled: audioTrack.enabled,
          videoEnabled,
        });
      }
    }
  }, [socket, videoEnabled]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
      if (socket && callIdRef.current) {
        socket.emit("call:media-state", {
          callId: callIdRef.current,
          audioEnabled,
          videoEnabled: videoTrack.enabled,
        });
      }
    }
  }, [socket, audioEnabled]);

  const joinGroupCall = useCallback(
    async (groupId: number, type: CallType) => {
      if (!socket || callIdRef.current) return;
      setActiveGroupId(groupId);
      setCallType(type);
      callTypeRef.current = type;
      setCallState("active");
      setCallUiMode("full");
      setCallStartedAt(Date.now());
      setCallConnectionState("stable");
      await getMedia(type);
      socket.emit("call:group-join", { groupId, callType: type });
    },
    [socket, getMedia],
  );

  const leaveGroupCall = useCallback(() => {
    if (!socket || !callIdRef.current) return;
    socket.emit("call:group-leave", { callId: callIdRef.current });
    cleanupAll();
  }, [socket, cleanupAll]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        callId,
        incomingCall,
        callStartedAt,
        callUiMode,
        callConnectionState,
        activeGroupCalls,
        activeGroupId,
        localStream,
        remoteStreams,
        audioEnabled,
        videoEnabled,
        remoteMediaState,
        groupParticipants,
        initiateCall,
        acceptCall,
        declineCall,
        hangup,
        toggleMute,
        toggleCamera,
        joinGroupCall,
        leaveGroupCall,
        setCallUiMode,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

function useCallContext() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallContext must be used within CallProvider");
  return ctx;
}

export { CallProvider, useCallContext };
