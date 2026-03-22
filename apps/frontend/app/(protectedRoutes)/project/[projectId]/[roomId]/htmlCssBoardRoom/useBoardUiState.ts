"use client";

import { useState } from "react";

export function useBoardUiState() {
  const [layersOpen, setLayersOpen] = useState(true);
  const [propertiesOpen, setPropertiesOpen] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  return {
    layersOpen,
    setLayersOpen,
    propertiesOpen,
    setPropertiesOpen,
    editMode,
    setEditMode,
    showInvite,
    setShowInvite,
  };
}
