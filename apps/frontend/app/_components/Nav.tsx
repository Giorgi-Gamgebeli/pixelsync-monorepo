"use client";

import { useActiveSectionContext } from "../_context/ActiveSectionContext";
import Link from "next/link";
import { navLinks } from "../_utils/constants";

type NavTypes = {
  setIsPhoneNavOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  phoneNav?: boolean;
};

function Nav({ setIsPhoneNavOpen, phoneNav }: NavTypes) {
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSectionContext();

  return (
    <nav>
      <ul
        className={`items-center gap-5 text-gray-500 dark:text-gray-500 ${phoneNav ? "flex flex-col" : "hidden flex-row md:flex"}`}
      >
        {navLinks.map((link) => (
          <li key={link} className="relative">
            <Link
              href={`#${link}`}
              className={`block px-3 py-2 transition hover:text-gray-950 dark:hover:text-white ${activeSection === link && "text-gray-950 dark:text-white"}`}
              onClick={() => {
                setActiveSection(link);
                setTimeOfLastClick(Date.now());

                if (!setIsPhoneNavOpen) return;
                setIsPhoneNavOpen(false);
              }}
            >
              {link.at(0).toUpperCase() + link.slice(1)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Nav;
