import React from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

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
    <button onClick={handleChange} type="button">
      {visible ? <FaEye /> : <FaEyeSlash />}
    </button>
  );
};

export default VisibleSwitch;
