import type { KidsData, TrackerData } from "./types";
import { applyProposedSchedule } from "./schedule";

/** Initial seed matching the live PythonAnywhere roster (photos via ImgBB / local kids). */
const baseTracker: TrackerData = {
  members: [
    {
      name: "Frea",
      photo: "https://i.ibb.co/3yNrWCC1/Frea.png",
      status: "",
      isCurrent: true,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Mimi",
      photo: "https://i.ibb.co/HpdM2gdV/Mimi.jpg",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Nini",
      photo: "https://i.ibb.co/4nSmbgkS/Nini.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Lulu",
      photo: "https://i.ibb.co/rR5XkPm3/Lulu.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Lilli",
      photo: "https://i.ibb.co/spCNTCS2/Lili.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Alae",
      photo: "https://i.ibb.co/mFNJR0Hg/Alae.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Enewa",
      photo: "https://i.ibb.co/gbtf6ts1/Enewa.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Kuku",
      photo: "https://i.ibb.co/G4SscpF3/Kuku.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Tsedaye",
      photo: "https://i.ibb.co/kVtsRDzy/Tsedaye.png",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
    {
      name: "Tammy",
      photo: "https://i.ibb.co/Kj4tdL2P/Tammy.jpg",
      status: "",
      isCurrent: false,
      hostingDate: "",
      vote: null,
    },
  ],
  history: [
    { name: "Tammy", date: "2025-09-20" },
    { name: "Tsedaye", date: "2025-06-14" },
  ],
  passStartIndex: null,
  currentRoundPassers: [],
  hostConfirmed: false,
  lastHostIndex: -1,
};

/** Seed includes Frea = second Saturday one month out, then +3 months each. */
export const defaultTracker: TrackerData = applyProposedSchedule(baseTracker);

export const defaultKids: KidsData = {
  kids: [
    { name: "Abel", photo: "/kids/Abel.jpg", vote: null },
    { name: "Bezu", photo: "/kids/Bezu.jpg", vote: null },
    { name: "Hermela", photo: "/kids/Hermela.jpg", vote: null },
    { name: "Kaleb", photo: "/kids/Kaleb.jpg", vote: null },
    { name: "Miki", photo: "/kids/Miki.jpg", vote: null },
    { name: "Moses", photo: "/kids/Moses.jpg", vote: null },
    { name: "Sayat", photo: "/kids/Sayat.jpg", vote: null },
    { name: "Sole", photo: "/kids/Sole.jpg", vote: null },
    { name: "Yafet", photo: "/kids/Yafet.jpg", vote: null },
    { name: "Geta", photo: "/kids/Geta.jpg", vote: null },
    { name: "Joey", photo: "/kids/Joey.jpg", vote: null },
    { name: "Amanu", photo: "/kids/Amanu.jpg", vote: null },
    { name: "Misgu", photo: "/kids/Misgu.jpg", vote: null },
    { name: "Habte", photo: "/kids/Habte.jpg", vote: null },
    { name: "Bethel", photo: "/kids/Bethel.jpg", vote: null },
    { name: "Bisrat", photo: "/kids/Bisrat.jpg", vote: null },
  ],
};
