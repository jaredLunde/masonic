import * as React from "react";

export function useForceUpdate() {
  const setState = React.useState(emptyObj)[1];
  return React.useRef(() => setState({})).current;
}

const emptyObj = {};
