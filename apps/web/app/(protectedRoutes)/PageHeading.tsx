"use client";

import { getHeading, getIcon } from "../_redux/layoutSlice";
import { useSelector } from "react-redux";
import { Icon } from "@iconify/react/dist/iconify.js";

function PageHeading() {
  const heading = useSelector(getHeading);
  const icon = useSelector(getIcon);

  return (
    <h1 className="flex items-center justify-center gap-2 py-2 text-xl">
      <Icon icon={icon} className="text-2xl" />
      {heading}
    </h1>
  );
}

export default PageHeading;
