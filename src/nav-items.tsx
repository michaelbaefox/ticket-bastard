import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Tickets from "./pages/Tickets";
import Venue from "./pages/Venue";
import Organizer from "./pages/Organizer";

export const navItems = [
  {
    title: "Home",
    to: "/",
    page: <Index />,
  },
  {
    title: "Marketplace", 
    to: "/marketplace",
    page: <Marketplace />,
  },
  {
    title: "My Tickets",
    to: "/tickets", 
    page: <Tickets />,
  },
  {
    title: "Venue",
    to: "/venue",
    page: <Venue />,
  },
  {
    title: "Organizer",
    to: "/organizer",
    page: <Organizer />,
  },
];