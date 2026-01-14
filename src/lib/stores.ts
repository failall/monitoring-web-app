import { writable } from "svelte/store";

export const authToken = writable("");
export const isAuthenticated = writable(false);
