import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { Tooltip } from "@/components/ui/tooltip";

const VisibleSwitch = ({
  value: visible,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => {
  const handleChange = () => {
    onChange(!visible);
  };

  const label = visible ? "Hide section" : "Show section";

  return (
    // The tooltip renders in a portal, so it names nothing for a screen reader
    // — the button's only content is an icon. `aria-label` is what actually
    // gives it a name, and it is what lets a test tell this apart from the
    // rewrite trigger now sharing the heading.
    <Tooltip title={label}>
      <button onClick={handleChange} type="button" aria-label={label}>
        {visible ? <FaEye /> : <FaEyeSlash />}
      </button>
    </Tooltip>
  );
};

export default VisibleSwitch;
