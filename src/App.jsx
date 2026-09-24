import { useEffect, useState } from "react";
import Landing from "./Landing.jsx";
import Decider from "./Decider.jsx";
import Pencil from "./components/Pencil.jsx";

const currentView = () =>
  window.location.hash === "#decide" ? "decide" : "landing";

export default function App() {
  const [view, setView] = useState(currentView);

  useEffect(() => {
    const onHash = () => {
      setView(currentView());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Pencil />
      {view === "decide" ? <Decider /> : <Landing />}
    </>
  );
}
