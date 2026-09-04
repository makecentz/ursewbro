import Image from "next/image";

export function SiteHeader({ onLight = false }: { onLight?: boolean }) {
  return <header className={`site-header page-header${onLight ? " header-on-light" : ""}`}><a className="brand" href="/#top" aria-label="Vivlox home"><Image src="/brand/vivlox-wordmark.png" alt="Vivlox — Define Your Essence" width={360} height={120} priority /></a><nav aria-label="Primary navigation"><a href="/collections">Shop</a><a href="/#drops">New drops</a><a href="/collections">Collections</a><a href="/#sewcial">Community</a><a href="/#newsletter">Drop alerts</a></nav><div className="header-actions"><a href="/account">Account</a><a href="/collections">Shop now</a></div></header>;
}

export function SiteFooter() {
  const groups = [
    ["SHOP", ["New Drops", "/#drops"], ["Collections", "/collections"], ["Denim", "/collections?category=denim"], ["All Products", "/collections"]],
    ["HELP", ["FAQ", "/#faq"], ["Shipping", "/#faq"], ["Returns", "/#faq"], ["My Account", "/account"]],
    ["VIVLOX", ["About", "/#about"], ["Community", "/#sewcial"], ["Drop Alerts", "/#newsletter"], ["Admin", "/admin"]],
    ["LEGAL", ["Privacy", "/privacy"], ["Terms", "/terms"], ["Accessibility", "/#accessibility"]],
  ] as const;
  return <footer className="footer"><div className="footer-brand"><Image src="/brand/vivlox-wordmark.png" alt="Vivlox — Define Your Essence" width={215} height={72} /><p>PRE-MADE. CREATIVE.<br />READY TO WEAR.</p></div>{groups.map(([title,...links])=><div key={title}><h3>{title}</h3>{links.map(([label,href])=><a href={href} key={label}>{label}</a>)}</div>)}<div className="footer-bottom" id="accessibility">© 2026 VIVLOX. ALL RIGHTS RESERVED. <span>BUILT WITH THREAD. WORN WITH ATTITUDE.</span></div></footer>;
}
