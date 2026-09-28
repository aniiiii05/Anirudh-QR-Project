import { Github, Linkedin, Mail, ArrowUp } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-8 brick-pattern border-t-4 border-mario-ground">
      <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-foreground font-bold drop-shadow-[1px_1px_0_hsl(25,60%,20%)]" style={{ fontFamily: "'VT323', monospace", fontSize: "1.1rem" }}>
          © 2025 Anirudh Sharma — Game Over? Never! 🍄
        </p>

        <div className="flex items-center gap-4">
          {[
            { icon: Linkedin, href: "https://www.linkedin.com/in/-anirudh-sharma/" },
            { icon: Github, href: "https://github.com/aniiiii05" },
            { icon: Mail, href: "mailto:sharma.aniiirudh@gmail.com" },
          ].map(({ icon: Icon, href }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-accent border-3 border-[hsl(35,80%,40%)] flex items-center justify-center text-accent-foreground hover:scale-110 transition"
            >
              <Icon size={16} />
            </a>
          ))}

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-10 h-10 bg-secondary border-4 border-[hsl(120,40%,25%)] flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground transition ml-2"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
