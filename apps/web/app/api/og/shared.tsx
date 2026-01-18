export const colors = {
  primary: "#E3E8F0",
  border: "#1C222A",
  subtext: "#89909A",
};

export function formatName(str: string): string {
  return str.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface OgLayoutProps {
  bgUrl: string;
  children: React.ReactNode;
}

export function OgLayout({ bgUrl, children }: OgLayoutProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        position: "relative",
      }}
    >
      <img
        alt=""
        height={630}
        src={bgUrl}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        width={1200}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          paddingLeft: 120,
        }}
      >
        {children}
      </div>
    </div>
  );
}

interface OgAvatarProps {
  src: string;
}

export function OgAvatar({ src }: OgAvatarProps) {
  return (
    <img
      alt=""
      height={180}
      src={src}
      style={{
        borderRadius: 0,
        border: `2px solid ${colors.border}`,
      }}
      width={180}
    />
  );
}

interface OgTextProps {
  subtext: string;
  title: string;
}

export function OgText({ subtext, title }: OgTextProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 24,
          color: colors.subtext,
          fontWeight: 500,
        }}
      >
        {subtext}
      </span>
      <span
        style={{
          fontSize: 56,
          color: colors.primary,
          fontWeight: 400,
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </span>
    </div>
  );
}
