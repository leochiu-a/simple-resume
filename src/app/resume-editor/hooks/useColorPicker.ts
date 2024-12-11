import { useState } from "react";
import { ColorResult } from "@uiw/react-color";

const useColorPicker = () => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState("#094C42");

  const handleDisplayColorPicker = () => {
    setDisplayColorPicker(!displayColorPicker);
  };

  const handleSetBackgroundColor = (color: ColorResult) => {
    setBackgroundColor(color.hex);
  };

  return {
    displayColorPicker,
    backgroundColor,
    toggleColorPicker: handleDisplayColorPicker,
    changeBackgroundColor: handleSetBackgroundColor,
  };
};

export default useColorPicker;
