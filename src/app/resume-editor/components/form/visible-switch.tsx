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

  return (
    <Tooltip title={visible ? "Hide section" : "Show Section"}>
      <button onClick={handleChange} type="button">
        {visible ? <FaEye /> : <FaEyeSlash />}
      </button>
    </Tooltip>
  );
};

export default VisibleSwitch;
