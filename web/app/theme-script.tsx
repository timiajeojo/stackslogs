// Runs before first paint so the saved theme applies on every page without a flash.
// Add <ThemeScript /> inside <head> in web/app/layout.tsx, and add suppressHydrationWarning to <html>.
export default function ThemeScript() {
  const code = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
