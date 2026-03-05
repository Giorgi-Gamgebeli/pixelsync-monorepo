import { Icon } from "@iconify/react/dist/iconify.js";

type ProviderButtonProps = {
  children: React.ReactNode;
  icon: string;
  onClick: () => void;
  disabled: boolean;
};

function ProviderButton({
  children,
  icon,
  onClick,
  disabled,
}: ProviderButtonProps) {
  return (
    <button
      type="button"
      className="mt-3 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors first:mt-0 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
      onClick={onClick}
      disabled={disabled}
    >
      <Icon icon={icon} className="text-xl" />
      {children}
    </button>
  );
}

export default ProviderButton;
