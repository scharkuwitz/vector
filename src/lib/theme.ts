/** localStorage key for the theme choice ("light" | "dark"; absent = system). */
export const THEME_KEY = "vector-theme";

/**
 * Runs in <head> before first paint (layout.tsx) and puts the saved choice on
 * <html> as data-theme, so a reload never flashes the other theme.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
