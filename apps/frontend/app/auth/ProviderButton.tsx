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
      className="mt-7 flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-5 py-3 text-2xl tracking-wider transition-all duration-300 hover:border-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-200"
      onClick={onClick}
      disabled={disabled}
    >
      <div className="size-[30px]">
        <Icon icon={icon} className="text-3xl text-gray-500" />
      </div>
      {children}
    </button>
  );
}

export default ProviderButton;
