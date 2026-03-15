"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

const BG_COLORS = [
  "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",
  "d1e8e2", "e2f0cb", "f9f871", "ffc75f", "ff9671",
  "ffc1cc", "fde2e4", "e2ece9", "bee1e6", "f0efeb",
  "transparent",
];

const dicebearSchema = (adventurer as any).meta?.schema || (adventurer as any).schema;
const getOptions = (key: string): string[] => {
  return dicebearSchema?.properties?.[key]?.items?.enum || dicebearSchema?.properties?.[key]?.default || [];
};

const CATEGORIES = [
  {
    id: "head",
    label: "Head & Hair",
    icon: "mdi:face-man-profile",
    attributes: [
      { key: "hair", label: "Hair Style", options: getOptions("hair") },
      { key: "hairColor", label: "Hair Color", options: getOptions("hairColor"), isColor: true },
      { key: "earrings", label: "Earrings", options: getOptions("earrings"), optional: true },
      { key: "glasses", label: "Glasses", options: getOptions("glasses"), optional: true },
    ],
  },
  {
    id: "face",
    label: "Face",
    icon: "mdi:emoticon-outline",
    attributes: [
      { key: "eyes", label: "Eyes", options: getOptions("eyes") },
      { key: "eyebrows", label: "Eyebrows", options: getOptions("eyebrows") },
      { key: "mouth", label: "Mouth", options: getOptions("mouth") },
      { key: "features", label: "Details", options: getOptions("features"), optional: true },
      { key: "skinColor", label: "Skin Tone", options: getOptions("skinColor"), isColor: true },
    ],
  },
];

type Config = Record<string, any>;

function generateSvg(seed: string, config: Config): string {
  return createAvatar(adventurer, { seed, scale: 100, ...config }).toString();
}

function OptionThumbnail({
  seed,
  baseConfig,
  attrKey,
  value,
  isSelected,
  onClick,
  optional,
}: {
  seed: string;
  baseConfig: Config;
  attrKey: string;
  value: string;
  isSelected: boolean;
  onClick: () => void;
  optional?: boolean;
}) {
  const svg = useMemo(() => {
    const preview: Config = { ...baseConfig, [attrKey]: [value] };
    if (optional) {
      const probKey = attrKey + "Probability";
      preview[probKey] = 100;
    }
    return generateSvg(seed, preview);
  }, [seed, baseConfig, attrKey, value, optional]);

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border-2 transition-all ${
        isSelected
          ? "border-brand-500 ring-2 ring-brand-500/30 scale-105"
          : "border-border hover:border-gray-500 hover:scale-105"
      }`}
    >
      <div
        className="h-16 w-16 sm:h-20 sm:w-20"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </button>
  );
}

type AvatarBuilderModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: string | null;
  onSave: (config: string) => Promise<void>;
  userName?: string | null;
  userId?: string;
};

function AvatarBuilderModal({
  isOpen,
  onClose,
  initialConfig,
  onSave,
  userName,
  userId,
}: AvatarBuilderModalProps) {
  const [isPending, startTransition] = useTransition();
  const [seed, setSeed] = useState(userId || userName || "Adventurer");
  const [config, setConfig] = useState<Config>({
    backgroundColor: ["b6e3f4"],
  });
  const [activeTab, setActiveTab] = useState("head");

  useEffect(() => {
    if (isOpen && initialConfig) {
      try {
        const parsed = JSON.parse(initialConfig);
        if (parsed.seed) setSeed(parsed.seed);
        setConfig(parsed);
      } catch (e) {
        console.error("Failed to parse initial avatar config", e);
      }
    }
  }, [isOpen, initialConfig]);

  const avatarSvg = useMemo(() => generateSvg(seed, config), [seed, config]);

  const handleOptionSelect = (key: string, value: string, optional?: boolean) => {
    setConfig((prev) => {
      const next = { ...prev, [key]: [value] };
      if (optional) next[key + "Probability"] = 100;
      return next;
    });
  };

  const handleClearOption = (key: string) => {
    setConfig((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next[key + "Probability"];
      return next;
    });
  };

  const handleRandomize = () => {
    setSeed(Math.random().toString(36).substring(7));
    const next: Config = {};
    next.backgroundColor = [BG_COLORS[Math.floor(Math.random() * (BG_COLORS.length - 1))] || "b6e3f4"];

    CATEGORIES.forEach((cat) => {
      cat.attributes.forEach((attr) => {
        if (!attr.options.length) return;
        if (attr.optional && Math.random() > 0.5) return;
        next[attr.key] = [attr.options[Math.floor(Math.random() * attr.options.length)]];
        if (attr.optional) next[attr.key + "Probability"] = 100;
      });
    });

    setConfig(next);
  };

  const handleSave = () => {
    startTransition(async () => {
      await onSave(JSON.stringify({ seed, ...config }));
      onClose();
    });
  };

  if (!isOpen) return null;

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-secondary shadow-2xl md:flex-row">

        {/* Left pane: Live preview */}
        <div className="flex w-full shrink-0 flex-col items-center justify-center border-b border-border bg-gradient-to-br from-surface to-secondary p-8 md:w-2/5 md:border-r md:border-b-0">
          <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
            <div
              className={`h-64 w-64 overflow-hidden rounded-full ${
                config.backgroundColor?.[0] === "transparent" || !config.backgroundColor
                  ? "border border-dashed border-gray-600"
                  : ""
              } shadow-xl ring-4 ring-border transition-all`}
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
            />
          </div>

          <button
            onClick={handleRandomize}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface py-3 font-semibold text-white transition-colors hover:bg-surface/80 hover:ring-2 hover:ring-brand-500"
          >
            <Icon icon="mdi:dice-multiple" className="text-xl text-brand-400" />
            Randomize
          </button>
        </div>

        {/* Right pane: Controls */}
        <div className="flex flex-1 flex-col overflow-hidden bg-secondary">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-bold text-white">Avatar Builder</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <Icon icon="mdi:close" className="text-lg" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-2">
            <button
              onClick={() => setActiveTab("background")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "background"
                  ? "bg-brand-500 text-white"
                  : "bg-surface text-gray-400 hover:text-white"
              }`}
            >
              <Icon icon="mdi:palette" className="text-base" /> Background
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === cat.id
                    ? "bg-brand-500 text-white"
                    : "bg-surface text-gray-400 hover:text-white"
                }`}
              >
                <Icon icon={cat.icon} className="text-base" /> {cat.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-4">
            {activeTab === "background" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                  Color Palette
                </h3>
                <div className="flex flex-wrap gap-3">
                  {BG_COLORS.map((hex) => (
                    <button
                      key={hex}
                      aria-label={`Select color ${hex}`}
                      onClick={() => handleOptionSelect("backgroundColor", hex)}
                      className={`h-12 w-12 rounded-full ring-offset-2 ring-offset-secondary transition-all ${
                        config.backgroundColor?.[0] === hex
                          ? "ring-2 ring-brand-500 scale-110"
                          : "hover:scale-105"
                      } ${hex === "transparent" ? "border-2 border-dashed border-gray-600 bg-transparent" : ""}`}
                      style={hex !== "transparent" ? { backgroundColor: `#${hex}` } : {}}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeCategory && (
              <div className="space-y-8">
                {activeCategory.attributes.map((attr) => (
                  <div key={attr.key}>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                        {attr.label}
                      </h3>
                      {attr.optional && (
                        <button
                          onClick={() => handleClearOption(attr.key)}
                          className="text-xs text-gray-500 transition-colors hover:text-brand-400"
                        >
                          None
                        </button>
                      )}
                    </div>

                    {attr.options.length > 0 ? (
                      attr.isColor ? (
                        <div className="flex flex-wrap gap-3">
                          {attr.options.map((opt) => (
                            <button
                              key={opt}
                              aria-label={`Select ${attr.label} ${opt}`}
                              onClick={() => handleOptionSelect(attr.key, opt)}
                              className={`h-10 w-10 shrink-0 rounded-full ring-offset-2 ring-offset-secondary transition-all ${
                                config[attr.key]?.[0] === opt
                                  ? "ring-2 ring-brand-500 scale-110"
                                  : "hover:scale-105"
                              }`}
                              style={{ backgroundColor: `#${opt}` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {attr.options.map((opt) => (
                            <OptionThumbnail
                              key={opt}
                              seed={seed}
                              baseConfig={config}
                              attrKey={attr.key}
                              value={opt}
                              isSelected={config[attr.key]?.[0] === opt}
                              onClick={() => handleOptionSelect(attr.key, opt, attr.optional)}
                              optional={attr.optional}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-xs italic text-gray-600">No options available.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border bg-surface/50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl px-5 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-surface hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-brand-600 hover:shadow-lg disabled:opacity-50"
            >
              {isPending && <Icon icon="mdi:loading" className="animate-spin text-lg" />}
              Save Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarBuilderModal;
