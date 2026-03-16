"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

const BG_COLORS = [
  "b6e3f4",
  "c0aede",
  "d1d4f9",
  "ffd5dc",
  "ffdfbf",
  "d1e8e2",
  "e2f0cb",
  "f9f871",
  "ffc75f",
  "ff9671",
  "ffc1cc",
  "fde2e4",
  "e2ece9",
  "bee1e6",
  "f0efeb",
  "transparent",
];

const dicebearSchema = adventurer.schema;
const getOptions = (key: string): string[] => {
  const prop = dicebearSchema?.properties?.[key];
  if (!prop || typeof prop === "boolean") return [];
  const items = prop.items;
  if (
    items &&
    typeof items !== "boolean" &&
    !Array.isArray(items) &&
    items.enum
  ) {
    return items.enum.filter((v): v is string => typeof v === "string");
  }
  if (Array.isArray(prop.default)) {
    return prop.default.filter((v): v is string => typeof v === "string");
  }
  return [];
};

const CATEGORIES = [
  {
    id: "head",
    label: "Head & Hair",
    icon: "mdi:face-man-profile",
    attributes: [
      { key: "hair", label: "Hair Style", options: getOptions("hair") },
      {
        key: "hairColor",
        label: "Hair Color",
        options: getOptions("hairColor"),
        isColor: true,
      },
      {
        key: "earrings",
        label: "Earrings",
        options: getOptions("earrings"),
        optional: true,
      },
      {
        key: "glasses",
        label: "Glasses",
        options: getOptions("glasses"),
        optional: true,
      },
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
      {
        key: "features",
        label: "Details",
        options: getOptions("features"),
        optional: true,
      },
      {
        key: "skinColor",
        label: "Skin Tone",
        options: getOptions("skinColor"),
        isColor: true,
      },
    ],
  },
];

type Config = Record<string, string[] | number>;

function getSelected(config: Config, key: string): string | undefined {
  const v = config[key];
  return Array.isArray(v) ? v[0] : undefined;
}

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
          ? "border-brand-500 ring-brand-500/30 scale-105 ring-2"
          : "border-border hover:scale-105 hover:border-gray-500"
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

  const handleOptionSelect = (
    key: string,
    value: string,
    optional?: boolean,
  ) => {
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
    next.backgroundColor = [
      BG_COLORS[Math.floor(Math.random() * (BG_COLORS.length - 1))] || "b6e3f4",
    ];

    CATEGORIES.forEach((cat) => {
      cat.attributes.forEach((attr) => {
        if (!attr.options.length) return;
        if (attr.optional && Math.random() > 0.5) return;
        const pick =
          attr.options[Math.floor(Math.random() * attr.options.length)];
        if (pick) next[attr.key] = [pick];
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
      <div className="border-border bg-secondary flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-2xl md:flex-row">
        {/* Left pane: Live preview */}
        <div className="border-border from-surface to-secondary flex w-full shrink-0 flex-col items-center justify-center border-b bg-gradient-to-br p-8 md:w-2/5 md:border-r md:border-b-0">
          <div className="relative mb-8 flex h-64 w-64 items-center justify-center">
            <div
              className={`h-64 w-64 overflow-hidden rounded-full ${
                getSelected(config, "backgroundColor") === "transparent" ||
                !config.backgroundColor
                  ? "border border-dashed border-gray-600"
                  : ""
              } ring-border shadow-xl ring-4 transition-all`}
              dangerouslySetInnerHTML={{ __html: avatarSvg }}
            />
          </div>

          <button
            onClick={handleRandomize}
            className="bg-surface hover:bg-surface/80 hover:ring-brand-500 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-colors hover:ring-2"
          >
            <Icon icon="mdi:dice-multiple" className="text-brand-400 text-xl" />
            Randomize
          </button>
        </div>

        {/* Right pane: Controls */}
        <div className="bg-secondary flex flex-1 flex-col overflow-hidden">
          <div className="border-border flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-bold text-white">Avatar Builder</h2>
            <button
              onClick={onClose}
              className="bg-surface flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400"
            >
              <Icon icon="mdi:close" className="text-lg" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-border flex gap-2 overflow-x-auto border-b px-6 py-2">
            <button
              onClick={() => setActiveTab("background")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
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
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
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
                <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                  Color Palette
                </h3>
                <div className="flex flex-wrap gap-3">
                  {BG_COLORS.map((hex) => (
                    <button
                      key={hex}
                      aria-label={`Select color ${hex}`}
                      onClick={() => handleOptionSelect("backgroundColor", hex)}
                      className={`ring-offset-secondary h-12 w-12 rounded-full ring-offset-2 transition-all ${
                        getSelected(config, "backgroundColor") === hex
                          ? "ring-brand-500 scale-110 ring-2"
                          : "hover:scale-105"
                      } ${hex === "transparent" ? "border-2 border-dashed border-gray-600 bg-transparent" : ""}`}
                      style={
                        hex !== "transparent"
                          ? { backgroundColor: `#${hex}` }
                          : {}
                      }
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
                      <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
                        {attr.label}
                      </h3>
                      {attr.optional && (
                        <button
                          onClick={() => handleClearOption(attr.key)}
                          className="hover:text-brand-400 text-xs text-gray-500 transition-colors"
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
                              className={`ring-offset-secondary h-10 w-10 shrink-0 rounded-full ring-offset-2 transition-all ${
                                getSelected(config, attr.key) === opt
                                  ? "ring-brand-500 scale-110 ring-2"
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
                              isSelected={getSelected(config, attr.key) === opt}
                              onClick={() =>
                                handleOptionSelect(attr.key, opt, attr.optional)
                              }
                              optional={attr.optional}
                            />
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-gray-600 italic">
                        No options available.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-border bg-surface/50 flex items-center justify-end gap-3 border-t px-6 py-4">
            <button
              onClick={onClose}
              className="hover:bg-surface rounded-xl px-5 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-2 rounded-xl px-6 py-2 text-sm font-semibold text-white transition-all hover:shadow-lg disabled:opacity-50"
            >
              {isPending && (
                <Icon icon="mdi:loading" className="animate-spin text-lg" />
              )}
              Save Avatar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AvatarBuilderModal;
