import React from "react";

type IconProps = {
  children: string;
};

const Icon: React.FC<IconProps> = ({ children }) => {
  return <span className="material-icons-outlined md-24">{children}</span>;
};

export default Icon;
