const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const PlusIcon = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const MinusIcon = () => (<svg {...base}><path d="M5 12h14" /></svg>);
export const HomeIcon = () => (<svg {...base} fill="currentColor" stroke="none"><path d="M12 3 2 12h3v8h5v-5h4v5h5v-8h3z" /></svg>);
export const MenuIcon = () => (<svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const DotsIcon = () => (<svg {...base} fill="currentColor" stroke="none"><circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="19" cy="12" r="2.2" /></svg>);
export const ReturnIcon = () => (<svg {...base}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>);
export const SendIcon = () => (<svg {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const StopIcon = () => (<svg {...base} fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>);
export const StarIcon = () => (<svg width="30" height="30" viewBox="0 0 24 24" aria-hidden><path fill="var(--color-peach)" d="m12 2.8 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" /></svg>);
export const UserIcon = () => (<svg width="34" height="34" viewBox="0 0 24 24" fill="white" aria-hidden><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6z" /></svg>);
