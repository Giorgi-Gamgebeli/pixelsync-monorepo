"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { createAvatar } from "@dicebear/core";
import { adventurer } from "@dicebear/collection";

// Predefined palette for backgrounds
const BG_COLORS = [
    "b6e3f4", "c0aede", "d1d4f9", "ffd5dc", "ffdfbf",
    "d1e8e2", "e2f0cb", "f9f871", "ffc75f", "ff9671",
    "ffc1cc", "fde2e4", "e2ece9", "bee1e6", "f0efeb",
    "transparent",
];

// Helper to reliably extract Dicebear schema properties regardless of internal version shifts
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
            { key: "hairColor", label: "Hair Color", options: getOptions("hairColor") },
            { key: "earrings", label: "Earrings", options: getOptions("earrings") },
            { key: "glasses", label: "Glasses", options: getOptions("glasses") },
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
            { key: "features", label: "Details", options: getOptions("features") },
            { key: "skinColor", label: "Skin Tone", options: getOptions("skinColor") },
        ],
    },
];

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

    // Avatar configuration state
    const [seed, setSeed] = useState(userId || userName || "Adventurer");
    const [config, setConfig] = useState<Record<string, any>>({
        backgroundColor: ["b6e3f4"],
    });

    const [activeTab, setActiveTab] = useState("head");

    // Load initial config
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

    // SVG Preview Generation
    const avatarSvg = useMemo(() => {
        return createAvatar(adventurer, {
            seed,
            scale: 100,
            ...config,
        }).toString();
    }, [seed, config]);

    const handleOptionSelect = (key: string, value: any) => {
        setConfig((prev) => {
            const next = { ...prev };
            // Dicebear strictly takes arrays for string options
            next[key] = [value];

            // Force probabilities to 100 so optional traits show up predictably when selected
            if (key === "earrings") next.earringsProbability = 100;
            if (key === "glasses") next.glassesProbability = 100;
            if (key === "features") next.featuresProbability = 100;

            return next;
        });
    };

    const handleRandomize = () => {
        setSeed(Math.random().toString(36).substring(7));

        const nextConfig: Record<string, any> = {};
        const newBg = BG_COLORS[Math.floor(Math.random() * (BG_COLORS.length - 1))] || "b6e3f4";
        nextConfig.backgroundColor = [newBg];

        const optionals = ["earrings", "glasses", "features"];

        CATEGORIES.forEach((cat) => {
            cat.attributes.forEach((attr) => {
                if (attr.options && attr.options.length > 0) {
                    // 50% chance for optional traits to be omitted
                    if (optionals.includes(attr.key) && Math.random() > 0.5) return;

                    const randomOpt = attr.options[Math.floor(Math.random() * attr.options.length)];
                    nextConfig[attr.key] = [randomOpt];
                }
            });
        });

        nextConfig.earringsProbability = 100;
        nextConfig.glassesProbability = 100;
        nextConfig.featuresProbability = 100;

        setConfig(nextConfig);
    };

    const handleSave = () => {
        startTransition(async () => {
            const payload = JSON.stringify({ seed, ...config });
            await onSave(payload);
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
                    <div className="mb-8 relative flex h-64 w-64 items-center justify-center rounded-fully bg-white/5 shadow-inner">
                        <div
                            className={`h-64 w-64 overflow-hidden rounded-full ${config.backgroundColor?.[0] === "transparent" || !config.backgroundColor
                                ? "border border-dashed border-gray-600"
                                : ""
                                } shadow-xl ring-4 ring-border transition-all`}
                            dangerouslySetInnerHTML={{ __html: avatarSvg }}
                        />
                    </div>

                    <div className="flex w-full flex-col gap-3">
                        <button
                            onClick={handleRandomize}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface py-3 font-semibold text-white transition-colors hover:bg-surface/80 hover:ring-2 hover:ring-brand-500"
                        >
                            <Icon icon="mdi:dice-multiple" className="text-xl text-brand-400" />
                            Randomize Character
                        </button>
                    </div>
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

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 overflow-x-auto border-b border-border px-6 py-2">
                        <button
                            onClick={() => setActiveTab("background")}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === "background"
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
                                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === cat.id
                                    ? "bg-brand-500 text-white"
                                    : "bg-surface text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Icon icon={cat.icon} className="text-base" /> {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Active Tab Content */}
                    <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-4">
                        {activeTab === "background" && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Color Palette</h3>
                                <div className="flex flex-wrap gap-3">
                                    {BG_COLORS.map((hex) => (
                                        <button
                                            key={hex}
                                            aria-label={`Select color ${hex}`}
                                            onClick={() => handleOptionSelect("backgroundColor", hex)}
                                            className={`h-12 w-12 rounded-full ring-offset-2 ring-offset-secondary transition-all ${config.backgroundColor?.[0] === hex ? "ring-2 ring-brand-500 scale-110" : "hover:scale-105"
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
                                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{attr.label}</h3>
                                            <button
                                                onClick={() => {
                                                    const newConfig = { ...config };
                                                    delete newConfig[attr.key];
                                                    setConfig(newConfig);
                                                }}
                                                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        {attr.options && attr.options.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {attr.options.map((opt) => {
                                                    const isSelected = config[attr.key]?.[0] === opt;
                                                    const isColor = attr.key === "hairColor" || attr.key === "skinColor";

                                                    if (isColor) {
                                                        return (
                                                            <button
                                                                key={opt}
                                                                aria-label={`Select ${attr.label} ${opt}`}
                                                                onClick={() => handleOptionSelect(attr.key, opt)}
                                                                className={`h-10 w-10 shrink-0 rounded-full ring-offset-2 ring-offset-secondary transition-all ${isSelected ? "ring-2 ring-brand-500 scale-110" : "hover:scale-105"
                                                                    }`}
                                                                style={{ backgroundColor: `#${opt}` }}
                                                            />
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            key={opt}
                                                            onClick={() => handleOptionSelect(attr.key, opt)}
                                                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${isSelected
                                                                ? "border-brand-500 bg-brand-500/20 text-brand-400"
                                                                : "border-border bg-surface text-gray-300 hover:border-gray-500 hover:text-white"
                                                                }`}
                                                        >
                                                            {opt.startsWith("variant")
                                                                ? opt.replace("variant", "Style ")
                                                                : opt.replace(/([A-Z])/g, " $1")}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs italic text-gray-600">No options available.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
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
