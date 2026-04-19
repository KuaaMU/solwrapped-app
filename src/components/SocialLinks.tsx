const GITHUB_URL = "https://github.com/KuaaMU/solwrapped-app";
const X_URL = "https://x.com/X_SwarmMind";

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconLink href={GITHUB_URL} label="GitHub — source & issues">
        <GithubIcon />
      </IconLink>
      <IconLink href={X_URL} label="X — @X_SwarmMind">
        <XIcon />
      </IconLink>
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-sm border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--sol-purple)] hover:border-[var(--sol-purple)] hover:bg-[var(--sol-purple-faint)] transition-colors cursor-pointer"
    >
      {children}
    </a>
  );
}

function GithubIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.94 0-1.3.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.92 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.89-.01 3.28 0 .32.22.7.83.58A12 12 0 0024 12.5C24 5.87 18.63.5 12 .5z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
